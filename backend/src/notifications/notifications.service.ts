import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailService } from '../email/email.service';
import { EmailTemplateName } from '../email/templates';
import { NotificationPreference } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

import { UpdateNotificationPreferencesDto } from './dto';

export interface NotifyParams {
  userId: string;
  organisationId?: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  sendEmail?: boolean;
  sendPush?: boolean;
  emailTemplate?: EmailTemplateName;
  emailSubject?: string;
  emailData?: Record<string, unknown>;
}

const EMAIL_PREF_BY_TYPE: Record<string, keyof NotificationPreference> = {
  payment_received: 'email_payment_received',
  document_validated: 'email_document_decision',
  document_rejected: 'email_document_decision',
  event_reminder: 'email_event_reminder',
  membership_approved: 'email_membership_decision',
  membership_rejected: 'email_membership_decision',
  renewal_invitation: 'email_renewal_invitation',
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly config: ConfigService
  ) {}

  async notify(params: NotifyParams) {
    const notification = await this.prisma.notification.create({
      data: {
        user_id: params.userId,
        organisation_id: params.organisationId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    });

    const prefs = await this.getOrCreatePreferences(params.userId);

    if (params.sendPush && prefs.push_enabled) {
      this.pushService
        .sendToUser(params.userId, params.title, params.body, params.link)
        .catch(() => undefined);
    }

    if (params.sendEmail && params.emailTemplate && params.emailData) {
      const prefKey = EMAIL_PREF_BY_TYPE[params.type];
      const allowed = !prefKey || prefs[prefKey] !== false;
      if (allowed) {
        this.sendNotificationEmail(
          params.userId,
          params.emailSubject || params.title,
          params.emailTemplate,
          params.emailData
        ).catch(() => undefined);
      }
    }

    return notification;
  }

  async getOrCreatePreferences(userId: string): Promise<NotificationPreference> {
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { user_id: userId },
    });
    if (existing) return existing;

    return this.prisma.notificationPreference.create({ data: { user_id: userId } });
  }

  async updatePreferences(userId: string, patch: UpdateNotificationPreferencesDto) {
    await this.getOrCreatePreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { user_id: userId },
      data: patch,
    });
  }

  private async sendNotificationEmail(
    userId: string,
    subject: string,
    template: EmailTemplateName,
    data: Record<string, unknown>
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) return;

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/+$/, '');

    await this.emailService.sendTemplateEmail({
      to: user.email,
      subject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template: template as any,
      data: {
        ...data,
        unsubscribeUrl: `${frontendUrl}/account/notifications`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }
    if (notification.user_id !== userId) {
      throw new ForbiddenException("Vous n'êtes pas le propriétaire de cette notification");
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, read_at: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true, read_at: new Date() },
    });
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { user_id: userId, read: false },
    });
    return { count };
  }

  async list(userId: string, opts: { unreadOnly?: boolean; limit?: number }) {
    return this.prisma.notification.findMany({
      where: { user_id: userId, ...(opts.unreadOnly ? { read: false } : {}) },
      orderBy: { created_at: 'desc' },
      take: opts.limit ?? 50,
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }
    if (notification.user_id !== userId) {
      throw new ForbiddenException("Vous n'êtes pas le propriétaire de cette notification");
    }

    await this.prisma.notification.delete({ where: { id: notificationId } });
    return { success: true };
  }

  async clearAll(userId: string) {
    await this.prisma.notification.deleteMany({ where: { user_id: userId } });
    return { success: true };
  }
}
