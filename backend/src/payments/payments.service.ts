import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

import type { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async assertIsAdminOrOwner(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    });
    if (!m || !['club_owner', 'club_manager'].includes(m.role.type)) {
      throw new ForbiddenException('Accès réservé aux gestionnaires du club.');
    }
  }

  // ── Checkout ─────────────────────────────────────────────────────────────────

  async checkout(dto: CheckoutDto, userId: string) {
    // Verify active or pending membership
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: dto.organisationId,
        status: { in: ['active', 'pending'] },
        deleted_at: null,
      },
    });
    if (!membership) {
      throw new ForbiddenException(
        'Vous devez être membre de cette organisation pour payer une cotisation.'
      );
    }

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: dto.planId, organisation_id: dto.organisationId, is_active: true },
    });
    if (!plan) {
      throw new NotFoundException('Formule introuvable ou inactive.');
    }

    // Guard: prevent double payment for the same plan
    const alreadyPaid = await this.prisma.payment.findFirst({
      where: {
        user_id: userId,
        organisation_id: dto.organisationId,
        subscription_plan_id: dto.planId,
        status: 'paid',
      },
    });
    if (alreadyPaid) {
      throw new ConflictException('Vous avez déjà payé cette cotisation.');
    }

    const org = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: dto.organisationId },
    });
    if (!org.stripe_account_id) {
      throw new BadRequestException("Ce club n'a pas encore connecté Stripe.");
    }
    if (!org.stripe_charges_enabled) {
      throw new BadRequestException(
        "Le compte Stripe de ce club n'est pas encore activé. L'onboarding doit être complété."
      );
    }

    const feeAmount = Math.round(plan.amount * 0.02);
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL').replace(/\/+$/, '');

    const lineItems = plan.stripe_price_id
      ? [{ price: plan.stripe_price_id, quantity: 1 as const }]
      : [
          {
            price_data: {
              currency: 'eur' as const,
              unit_amount: plan.amount,
              product_data: { name: plan.name },
            },
            quantity: 1 as const,
          },
        ];

    const session = await this.stripe.client.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: `${frontendUrl}/club/${dto.organisationId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/club/${dto.organisationId}/payment/cancel`,
        payment_intent_data: {
          application_fee_amount: feeAmount,
        },
      },
      { stripeAccount: org.stripe_account_id }
    );

    console.log('[Checkout] Session Stripe créée:', session.id);

    const paymentIntentId =
      session.payment_intent && typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

    const created = await this.prisma.payment.create({
      data: {
        user_id: userId,
        organisation_id: dto.organisationId,
        membership_id: dto.membershipId ?? membership.id,
        subscription_plan_id: dto.planId,
        amount: plan.amount / 100,
        currency: 'eur',
        payment_type: 'stripe',
        status: 'pending',
        target_type: 'plan',
        target_id: dto.planId,
        purpose: 'membership_fee',
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        installment_number: 1,
        total_installments: plan.max_installments,
      },
    });
    console.log('[Checkout] Payment créé — stripe_session_id:', created.stripe_session_id);

    return { checkout_url: session.url };
  }

  // ── Member payment history ────────────────────────────────────────────────────

  async getMyPayments(orgId: string, userId: string) {
    const m = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        status: { notIn: ['banned'] },
        deleted_at: null,
      },
    });
    if (!m) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation.");
    }

    return this.prisma.payment.findMany({
      where: { user_id: userId, organisation_id: orgId, payment_type: 'stripe' },
      include: {
        subscription_plan: { select: { name: true, amount: true } },
        membership: { select: { id: true, status: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── Admin payment list ────────────────────────────────────────────────────────

  async getAdminPayments(
    orgId: string,
    userId: string,
    filters: { status?: string; userId?: string }
  ) {
    await this.assertIsAdminOrOwner(orgId, userId);

    return this.prisma.payment.findMany({
      where: {
        organisation_id: orgId,
        payment_type: 'stripe',
        ...(filters.status
          ? { status: filters.status as 'paid' | 'pending' | 'failed' | 'refunded' }
          : {}),
        ...(filters.userId ? { user_id: filters.userId } : {}),
      },
      include: {
        user: { select: { firstname: true, lastname: true, email: true } },
        subscription_plan: { select: { name: true, amount: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
