import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

import { StripeService } from './stripe.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService
  ) {}

  @Public()
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Req() req: Request, @Headers('stripe-signature') sig: string) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) {
      throw new BadRequestException('Missing raw body.');
    }

    let event: ReturnType<StripeService['constructEvent']>;
    try {
      event = this.stripeService.constructEvent(raw, sig);
    } catch {
      throw new BadRequestException('Webhook signature verification failed.');
    }

    // ── account.updated ───────────────────────────────────────────────────────
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
    }

    // ── checkout.session.completed ────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string;
        payment_intent: string | null;
      };

      console.log('[Webhook] checkout.session.completed — session.id:', session.id);
      const allPayments = await this.prisma.payment.findMany({
        select: { id: true, stripe_session_id: true, status: true },
      });
      console.log('[Webhook] Payments en base:', JSON.stringify(allPayments));

      await this.prisma.payment.updateMany({
        where: { stripe_session_id: session.id },
        data: {
          status: 'paid',
          paid_at: new Date(),
          ...(session.payment_intent ? { stripe_payment_intent_id: session.payment_intent } : {}),
        },
      });

      // Update membership payment_status
      const paid = await this.prisma.payment.findFirst({
        where: { stripe_session_id: session.id },
        select: { membership_id: true },
      });
      if (paid?.membership_id) {
        await this.prisma.membership.update({
          where: { id: paid.membership_id },
          data: { payment_status: 'paid' },
        });
      }
    }

    // ── payment_intent.payment_failed ─────────────────────────────────────────
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as { id: string };
      await this.prisma.payment.updateMany({
        where: { stripe_payment_intent_id: pi.id },
        data: { status: 'failed' },
      });
    }

    // ── charge.refunded ───────────────────────────────────────────────────────
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
