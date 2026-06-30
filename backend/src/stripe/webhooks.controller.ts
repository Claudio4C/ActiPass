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
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

import { StripeService } from './stripe.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService
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
        select: {
          id: true,
          membership_id: true,
          purpose: true,
          user_id: true,
          organisation_id: true,
          amount: true,
          currency: true,
          paid_at: true,
        },
      });

      if (paid?.purpose === 'membership_fee' && paid.membership_id) {
        await this.prisma.membership.update({
          where: { id: paid.membership_id },
          data: { payment_status: 'paid' },
        });
      }

      let eventTitle: string | undefined;
      if (paid?.purpose === 'event_participation') {
        const reservation = await this.prisma.reservation.findFirst({
          where: { payment_id: paid.id },
          select: { id: true, status: true, event_id: true, event: { select: { title: true } } },
        });
        eventTitle = reservation?.event.title;
        // FIX 4 — idempotence : skip silencieusement si déjà confirmé
        if (reservation && reservation.status !== 'confirmed') {
          await this.prisma.reservation.update({
            where: { id: reservation.id },
            data: { status: 'confirmed' },
          });
          console.log(`[Webhook] Event payment confirmed for event ${reservation.event_id}`);
        }
      }

      if (paid) {
        const label = paid.purpose === 'event_participation' ? eventTitle || 'événement' : 'votre cotisation';
        const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/+$/, '');
        const user = await this.prisma.user.findUnique({
          where: { id: paid.user_id },
          select: { firstname: true, lastname: true },
        });

        // Notif membre
        await this.notificationsService.notify({
          userId: paid.user_id,
          organisationId: paid.organisation_id ?? undefined,
          type: 'payment_received',
          title: 'Paiement confirmé',
          body: `Votre paiement de ${paid.amount} ${paid.currency} pour ${label} a été confirmé.`,
          link: paid.organisation_id ? `/club/${paid.organisation_id}/payment` : undefined,
          sendEmail: true,
          emailTemplate: 'PaymentReceivedEmail',
          emailSubject: 'Paiement confirmé',
          emailData: {
            firstname: user?.firstname || '',
            amount: `${paid.amount} ${paid.currency}`,
            label,
            date: (paid.paid_at ?? new Date()).toLocaleDateString('fr-FR'),
            ctaUrl: paid.organisation_id
              ? `${frontendUrl}/club/${paid.organisation_id}/payment`
              : frontendUrl,
          },
        });

        // Notif admins
        if (paid.organisation_id) {
          const admins = await this.prisma.membership.findMany({
            where: {
              organisation_id: paid.organisation_id,
              role: { type: { in: ['club_owner', 'club_manager', 'treasurer'] } },
              status: 'active',
              deleted_at: null,
              left_at: null,
            },
            select: { user_id: true },
          });
          const payerName = user ? `${user.firstname} ${user.lastname}` : 'Un membre';
          const adminLabel = paid.purpose === 'event_participation'
            ? `inscription à "${eventTitle || 'un événement'}"`
            : 'cotisation';
          for (const admin of admins) {
            if (admin.user_id !== paid.user_id) {
              await this.notificationsService.notify({
                userId: admin.user_id,
                organisationId: paid.organisation_id,
                type: 'payment_received',
                title: 'Paiement reçu',
                body: `${payerName} a réglé ${paid.amount} ${paid.currency} (${adminLabel}).`,
                link: `/dashboard/${paid.organisation_id}/payments`,
                sendPush: true,
              });
            }
          }
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
