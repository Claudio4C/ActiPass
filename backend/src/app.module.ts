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
import { OrganisationsModule } from './organisations/organisations.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
      {
        name: 'auth',
        ttl: 60,
        limit: 5,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganisationsModule,
    EmailModule,
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
