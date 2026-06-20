import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private messaging: Messaging | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase non configuré — les notifications push sont désactivées.');
      return;
    }

    try {
      const app = getApps().length
        ? getApp()
        : initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
          });
      this.messaging = getMessaging(app);
    } catch (error) {
      this.logger.error('Échec de l’initialisation de Firebase Admin', error);
    }
  }

  async sendToToken(fcmToken: string, title: string, body: string, link?: string): Promise<void> {
    if (!this.messaging) return;

    try {
      await this.messaging.send({
        token: fcmToken,
        notification: { title, body },
        webpush: link ? { fcmOptions: { link } } : undefined,
      });
    } catch (error) {
      const code = (error as { errorInfo?: { code?: string } })?.errorInfo?.code;
      if (code === 'messaging/registration-token-not-registered') {
        await this.removeToken(fcmToken);
        return;
      }
      this.logger.error(`Échec d'envoi push au token ${fcmToken}`, error);
    }
  }

  async sendToUser(userId: string, title: string, body: string, link?: string): Promise<void> {
    if (!this.messaging) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcm_tokens: true },
    });
    if (!user || user.fcm_tokens.length === 0) return;

    await Promise.all(user.fcm_tokens.map((token) => this.sendToToken(token, title, body, link)));
  }

  private async removeToken(fcmToken: string): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { fcm_tokens: { has: fcmToken } },
      select: { id: true, fcm_tokens: true },
    });
    await Promise.all(
      users.map((u) =>
        this.prisma.user.update({
          where: { id: u.id },
          data: { fcm_tokens: u.fcm_tokens.filter((t) => t !== fcmToken) },
        })
      )
    );
  }
}
