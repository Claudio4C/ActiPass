import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';

import { PaymentsController } from './payments.controller';
import { OrgPaymentsController } from './org-payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, StripeModule, NotificationsModule],
  controllers: [PaymentsController, OrgPaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
