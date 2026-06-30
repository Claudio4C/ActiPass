import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

import { BroadcastDto } from './dto/broadcast.dto';

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  private async assertIsAdminOrOwner(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    });
    if (!m || !['club_owner', 'club_manager'].includes(m.role.type)) {
      throw new ForbiddenException('Acces reserve aux gestionnaires du club.');
    }
  }

  async resolveRecipients(orgId: string, target: string, memberIds?: string[]): Promise<string[]> {
    switch (target) {
      case 'all': {
        const memberships = await this.prisma.membership.findMany({
          where: { organisation_id: orgId, status: 'active', deleted_at: null },
          select: { user_id: true },
        });
        return memberships.map((m) => m.user_id);
      }

      case 'missing_documents': {
        const [requiredDocs, activeMembers] = await Promise.all([
          this.prisma.requiredDocument.findMany({
            where: { organisation_id: orgId, required: true },
          }),
          this.prisma.membership.findMany({
            where: {
              organisation_id: orgId,
              status: 'active',
              deleted_at: null,
              role: { type: { in: ['member', 'coach'] } },
            },
            select: { user_id: true },
          }),
        ]);
        if (requiredDocs.length === 0) return [];

        const now = new Date();
        const userIds: string[] = [];
        for (const m of activeMembers) {
          const docs = await this.prisma.memberDocument.findMany({
            where: { organisation_id: orgId, user_id: m.user_id },
          });
          let hasProblem = false;
          for (const reqDoc of requiredDocs) {
            const memberDoc = docs.find((d) => d.required_document_id === reqDoc.id);
            if (!memberDoc) { hasProblem = true; break; }
            if (memberDoc.status === 'approved') {
              if (memberDoc.expires_at && memberDoc.expires_at < now) { hasProblem = true; break; }
            } else if (memberDoc.status === 'rejected') {
              hasProblem = true; break;
            } else if (memberDoc.status !== 'pending') {
              hasProblem = true; break;
            }
          }
          if (hasProblem) userIds.push(m.user_id);
        }
        return userIds;
      }

      case 'unpaid': {
        const activeSeason = await this.prisma.season.findFirst({
          where: { organisation_id: orgId, is_active: true },
        });
        if (!activeSeason) return [];
        const memberships = await this.prisma.membership.findMany({
          where: {
            organisation_id: orgId,
            season_id: activeSeason.id,
            status: 'active',
            payment_status: { not: 'paid' },
            deleted_at: null,
            role: { type: { in: ['member', 'coach'] } },
          },
          select: { user_id: true },
        });
        return memberships.map((m) => m.user_id);
      }

      case 'waitlist': {
        const reservations = await this.prisma.reservation.findMany({
          where: {
            status: 'pending',
            payment_id: null,
            membership: { organisation_id: orgId, deleted_at: null },
          },
          include: { membership: { select: { user_id: true } } },
        });
        return [...new Set(reservations.map((r) => r.membership.user_id))];
      }

      case 'manual': {
        if (!memberIds || memberIds.length === 0) {
          throw new BadRequestException('member_ids requis pour target=manual');
        }
        const memberships = await this.prisma.membership.findMany({
          where: {
            user_id: { in: memberIds },
            organisation_id: orgId,
            status: 'active',
            deleted_at: null,
          },
          select: { user_id: true },
        });
        return memberships.map((m) => m.user_id);
      }

      default:
        throw new BadRequestException('Target invalide');
    }
  }

  async broadcast(orgId: string, userId: string, dto: BroadcastDto) {
    await this.assertIsAdminOrOwner(orgId, userId);

    const [userIds, org] = await Promise.all([
      this.resolveRecipients(orgId, dto.target, dto.member_ids),
      this.prisma.organisation.findUnique({ where: { id: orgId }, select: { name: true } }),
    ]);

    const organisationName = org?.name ?? 'votre club';
    const frontendUrl = this.config.get<string>('FRONTEND_URL')?.replace(/\/+$/, '') ?? 'http://localhost:5173';
    const sendEmail = dto.channel === 'email' || dto.channel === 'both';

    // Lien in-app selon la nature du message
    const linkByTarget: Record<string, string> = {
      all:               `/club/${orgId}`,
      missing_documents: `/club/${orgId}/documents`,
      unpaid:            `/club/${orgId}/payment`,
      waitlist:          `/club/${orgId}/events`,
      manual:            `/club/${orgId}`,
    };
    const inAppLink = linkByTarget[dto.target] ?? `/club/${orgId}`;
    const ctaUrl = `${frontendUrl}${inAppLink}`;

    // Exclure l'expéditeur pour éviter les auto-notifications
    const recipientIds = userIds.filter((id) => id !== userId);

    const users = sendEmail
      ? await this.prisma.user.findMany({
          where: { id: { in: recipientIds } },
          select: { id: true, firstname: true },
        })
      : [];
    const firstnameMap = new Map(users.map((u) => [u.id, u.firstname]));

    await Promise.all(
      recipientIds.map((uid) =>
        this.notificationsService.notify({
          userId: uid,
          organisationId: orgId,
          type: 'admin_broadcast',
          title: dto.subject,
          body: dto.message,
          link: inAppLink,
          sendEmail,
          emailTemplate: sendEmail ? 'BroadcastEmail' : undefined,
          emailSubject: dto.subject,
          emailData: sendEmail
            ? {
                firstname: firstnameMap.get(uid) ?? 'Membre',
                organisationName,
                subject: dto.subject,
                message: dto.message,
                ctaUrl,
              }
            : undefined,
        }),
      ),
    );

    await this.prisma.broadcastLog.create({
      data: {
        organisation_id: orgId,
        sent_by: userId,
        target: dto.target,
        subject: dto.subject,
        message: dto.message,
        recipients_count: recipientIds.length,
      },
    });

    return { sent: recipientIds.length, target: dto.target };
  }

  async getRecipientsCount(orgId: string, userId: string, target: string) {
    await this.assertIsAdminOrOwner(orgId, userId);
    const userIds = await this.resolveRecipients(orgId, target);
    return { count: userIds.length, target };
  }

  async getHistory(orgId: string, userId: string) {
    await this.assertIsAdminOrOwner(orgId, userId);
    return this.prisma.broadcastLog.findMany({
      where: { organisation_id: orgId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
  }

  async clearHistory(orgId: string, userId: string) {
    await this.assertIsAdminOrOwner(orgId, userId);
    const { count } = await this.prisma.broadcastLog.deleteMany({
      where: { organisation_id: orgId },
    });
    return { deleted: count };
  }
}
