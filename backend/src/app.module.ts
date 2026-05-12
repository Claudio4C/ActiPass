import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SuperAdminThrottlerGuard } from './auth/guards/super-admin-throttler.guard';
import { EmailModule } from './email/email.module';
import { EventsModule } from './events/events.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { PrismaModule } from './prisma/prisma.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FamilyModule } from './family/family.module';
import { UsersModule } from './users/users.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 400, // 400 req/min — navigation SaaS fluide (multi-appels au chargement de page)
      },
      {
        name: 'auth',
        ttl: 60,
        limit: 15, // Auth reste stricte : 15 tentatives/min anti-bruteforce
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganisationsModule,
    EventsModule,
    AttendanceModule,
    FamilyModule,
    EmailModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SuperAdminThrottlerGuard,
    },
  ],
})
export class AppModule {}
