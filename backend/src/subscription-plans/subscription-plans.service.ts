import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

import type { CreatePlanDto, UpdatePlanDto } from './dto/subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService
  ) {}

  // ── Role assertions ──────────────────────────────────────────────────────────

  private async assertIsAdminOrOwner(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    });
    if (!m || !['club_owner', 'club_manager'].includes(m.role.type)) {
      throw new ForbiddenException('Accès réservé aux gestionnaires du club.');
    }
  }

  private async assertIsOwner(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    });
    if (!m || m.role.type !== 'club_owner') {
      throw new ForbiddenException('Accès réservé au propriétaire du club.');
    }
  }

  private async assertIsMember(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        status: { notIn: ['resigned', 'banned'] },
        deleted_at: null,
      },
    });
    if (!m) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation.");
    }
  }

  private async findPlanOrFail(planId: string, orgId: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: planId, organisation_id: orgId },
    });
    if (!plan) {
      throw new NotFoundException('Formule introuvable.');
    }
    return plan;
  }

  // ── Endpoints ────────────────────────────────────────────────────────────────

  async findAll(orgId: string, userId: string) {
    await this.assertIsMember(orgId, userId);

    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { organisation_id: orgId },
      include: {
        season: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return plans.map((p) => ({
      ...p,
      payment_count: p._count.payments,
    }));
  }

  async create(orgId: string, dto: CreatePlanDto, userId: string) {
    await this.assertIsAdminOrOwner(orgId, userId);

    const org = await this.prisma.organisation.findUniqueOrThrow({ where: { id: orgId } });
    const amountCents = Math.round(dto.amount * 100);

    let stripePriceId: string | null = null;
    if (org.stripe_account_id) {
      const price = await this.stripe.client.prices.create(
        {
          unit_amount: amountCents,
          currency: 'eur',
          product_data: { name: dto.name },
        },
        { stripeAccount: org.stripe_account_id }
      );
      stripePriceId = price.id;
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        organisation_id: orgId,
        season_id: dto.seasonId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        amount: amountCents,
        stripe_price_id: stripePriceId,
        max_installments: dto.max_installments,
        target_audience: dto.target_audience ?? null,
      },
      include: {
        season: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
    });
  }

  async update(orgId: string, planId: string, dto: UpdatePlanDto, userId: string) {
    await this.assertIsAdminOrOwner(orgId, userId);
    await this.findPlanOrFail(planId, orgId);

    return this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        ...(dto.max_installments !== undefined && { max_installments: dto.max_installments }),
        ...(dto.target_audience !== undefined && { target_audience: dto.target_audience }),
      },
      include: {
        season: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
    });
  }

  async remove(orgId: string, planId: string, userId: string) {
    await this.assertIsOwner(orgId, userId);
    const plan = await this.findPlanOrFail(planId, orgId);

    const paymentCount = await this.prisma.payment.count({
      where: { subscription_plan_id: planId },
    });

    if (paymentCount > 0) {
      // Soft delete — keep for history
      await this.prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { is_active: false },
      });
    } else {
      await this.prisma.subscriptionPlan.delete({ where: { id: plan.id } });
    }
  }
}
