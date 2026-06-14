import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

import { StripeService } from './stripe.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Req() req: Request, @Headers('stripe-signature') sig: string) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) {
      throw new BadRequestException('Missing raw body.');
    }

    // FIX 2 — Détecter si l'event vient d'un compte connecté (Connect) ou de la plateforme.
    // Les events Connect ont un champ top-level `account`. On lit le JSON brut sans vérification
    // pour choisir le bon secret, puis on vérifie la signature avec ce secret.
    let peekPayload: { account?: string };
    try {
      peekPayload = JSON.parse(raw.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid webhook payload.');
    }

    const isConnect = !!peekPayload.account;
    const secret = isConnect
      ? this.config.getOrThrow<string>('STRIPE_CONNECT_WEBHOOK_SECRET')
      : this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    let event: ReturnType<StripeService['constructEvent']>;
    try {
      event = this.stripeService.constructEvent(raw, sig, secret);
    } catch {
      throw new BadRequestException('Webhook signature verification failed.');
    }

    // ── Platform events (pas de compte connecté) ───────────────────────────
    if (!isConnect) {
      if (event.type === 'account.updated') {
        const account = event.data.object as {
          id: string;
          charges_enabled: boolean;
          payouts_enabled: boolean;
          details_submitted: boolean;
        };
        await this.prisma.organisation.updateMany({
          where: { stripe_account_id: account.id },
          data: {
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
            stripe_onboarding_done: account.details_submitted,
          },
        });
        console.log(`[Webhook] account.updated — ${account.id}`);
      }
      return { received: true };
    }

    // ── Connect events (émis par les comptes connectés des clubs) ──────────
    console.log(`[Webhook] ${event.type} received`);

    // ── checkout.session.completed ─────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { id: string; payment_intent: string | null };

      await this.prisma.payment.updateMany({
        where: { stripe_session_id: session.id },
        data: {
          status: 'paid',
          paid_at: new Date(),
          ...(session.payment_intent ? { stripe_payment_intent_id: session.payment_intent } : {}),
        },
      });

      const paid = await this.prisma.payment.findFirst({
        where: { stripe_session_id: session.id },
        select: { id: true, membership_id: true, purpose: true },
      });

      if (paid?.purpose === 'membership_fee' && paid.membership_id) {
        await this.prisma.membership.update({
          where: { id: paid.membership_id },
          data: { payment_status: 'paid' },
        });
      }

      if (paid?.purpose === 'event_participation') {
        const reservation = await this.prisma.reservation.findFirst({
          where: { payment_id: paid.id },
          select: { id: true, status: true, event_id: true },
        });
        // FIX 4 — idempotence : skip silencieusement si déjà confirmé
        if (reservation && reservation.status !== 'confirmed') {
          await this.prisma.reservation.update({
            where: { id: reservation.id },
            data: { status: 'confirmed' },
          });
          console.log(`[Webhook] Event payment confirmed for event ${reservation.event_id}`);
        }
      }
    }

    // ── checkout.session.expired ───────────────────────────────────────────
    // FIX 3 — annuler le payment pending et libérer la réservation
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as { id: string };

      await this.prisma.payment.updateMany({
        where: { stripe_session_id: session.id, status: 'pending' },
        data: { status: 'failed' },
      });

      const payment = await this.prisma.payment.findFirst({
        where: { stripe_session_id: session.id, purpose: 'event_participation' },
        select: { id: true },
      });

      if (payment) {
        const reservation = await this.prisma.reservation.findFirst({
          where: { payment_id: payment.id, status: { in: ['pending', 'confirmed'] } },
          select: { id: true, event_id: true },
        });
        if (reservation) {
          await this.prisma.reservation.update({
            where: { id: reservation.id },
            data: { status: 'cancelled', deleted_at: new Date() },
          });
          console.log(
            `[Webhook] Reservation cancelled (session expired) for event ${reservation.event_id}`
          );
        }
      }
    }

    // ── payment_intent.payment_failed ──────────────────────────────────────
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as { id: string };
      await this.prisma.payment.updateMany({
        where: { stripe_payment_intent_id: pi.id },
        data: { status: 'failed' },
      });
    }

    // ── charge.refunded ────────────────────────────────────────────────────
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as { payment_intent: string | null };
      if (charge.payment_intent) {
        await this.prisma.payment.updateMany({
          where: { stripe_payment_intent_id: charge.payment_intent },
          data: { status: 'refunded' },
        });
      }
    }

    return { received: true };
  }
}
