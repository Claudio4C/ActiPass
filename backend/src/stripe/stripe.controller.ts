import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

import { StripeService } from './stripe.service';

@Controller('stripe')
@UseGuards(JwtAuthGuard)
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string;
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

  private async assertIsAdminOrOwner(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    });
    if (!m || !['club_owner', 'club_manager'].includes(m.role.type)) {
      throw new ForbiddenException('Accès réservé aux gestionnaires du club.');
    }
  }

  private async getOrg(orgId: string) {
    const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organisation introuvable.');
    }
    return org;
  }

  private accountLinkUrls(orgId: string) {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL').replace(/\/+$/, '');
    return {
      refresh_url: `${frontendUrl}/dashboard/${orgId}/settings?stripe=refresh`,
      return_url: `${frontendUrl}/dashboard/${orgId}/settings?stripe=success`,
    };
  }

  /** POST /stripe/connect/onboard */
  @Post('connect/onboard')
  @HttpCode(HttpStatus.OK)
  async onboard(@Body() body: unknown, @Req() req: Request) {
    const { organisationId } = body as { organisationId: string };
    if (!organisationId) {
      throw new BadRequestException('organisationId requis.');
    }

    await this.assertIsOwner(organisationId, this.userId(req));
    const org = await this.getOrg(organisationId);

    let accountId = org.stripe_account_id;

    if (!accountId) {
      const account = await this.stripeService.client.accounts.create({
        type: 'express',
        country: 'FR',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await this.prisma.organisation.update({
        where: { id: organisationId },
        data: { stripe_account_id: accountId },
      });
    }

    const { refresh_url, return_url } = this.accountLinkUrls(organisationId);
    const link = await this.stripeService.client.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  /** POST /stripe/connect/refresh */
  @Post('connect/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown, @Req() req: Request) {
    const { organisationId } = body as { organisationId: string };
    if (!organisationId) {
      throw new BadRequestException('organisationId requis.');
    }

    await this.assertIsOwner(organisationId, this.userId(req));
    const org = await this.getOrg(organisationId);

    if (!org.stripe_account_id) {
      throw new BadRequestException('Aucun compte Stripe associé à cette organisation.');
    }

    const { refresh_url, return_url } = this.accountLinkUrls(organisationId);
    const link = await this.stripeService.client.accountLinks.create({
      account: org.stripe_account_id,
      refresh_url,
      return_url,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  /** GET /stripe/connect/status/:orgId */
  @Get('connect/status/:orgId')
  async status(@Param('orgId') orgId: string, @Req() req: Request) {
    await this.assertIsAdminOrOwner(orgId, this.userId(req));
    const org = await this.getOrg(orgId);

    if (!org.stripe_account_id) {
      return {
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
        stripe_account_id: null,
      };
    }

    const account = await this.stripeService.client.accounts.retrieve(org.stripe_account_id);

    await this.prisma.organisation.update({
      where: { id: orgId },
      data: {
        stripe_charges_enabled: account.charges_enabled ?? false,
        stripe_payouts_enabled: account.payouts_enabled ?? false,
        stripe_onboarding_done: account.details_submitted ?? false,
      },
    });

    return {
      connected: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      stripe_account_id: org.stripe_account_id,
    };
  }
}
