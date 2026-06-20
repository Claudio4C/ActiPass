import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EmailModule } from './email/email.module';
import { EventsModule } from './events/events.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { PrismaModule } from './prisma/prisma.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FamilyModule } from './family/family.module';
import { UsersModule } from './users/users.module';
import { UploadModule } from './upload/upload.module';
import { StorageModule } from './storage/storage.module';
import { RequiredDocumentsModule } from './required-documents/required-documents.module';
import { MemberDocumentsModule } from './member-documents/member-documents.module';
import { SeasonsModule } from './seasons/seasons.module';
import { StripeModule } from './stripe/stripe.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 10 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganisationsModule,
    EventsModule,
    AttendanceModule,
    FamilyModule,
    EmailModule,
    UploadModule,
    StorageModule,
    RequiredDocumentsModule,
    MemberDocumentsModule,
    SeasonsModule,
    StripeModule,
    SubscriptionPlansModule,
    PaymentsModule,
    PushModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
