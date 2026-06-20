import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';

import { PushService } from './push.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
