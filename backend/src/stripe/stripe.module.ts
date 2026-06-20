import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [StripeController, WebhooksController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
