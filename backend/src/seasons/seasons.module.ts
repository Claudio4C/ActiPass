import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule }   from '../auth/auth.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { SeasonsController }  from './seasons.controller'
import { RenewalsController } from './renewals.controller'
import { SeasonsService }     from './seasons.service'

@Module({
  imports:     [PrismaModule, AuthModule, NotificationsModule],
  controllers: [SeasonsController, RenewalsController],
  providers:   [SeasonsService],
  exports:     [SeasonsService],
})
export class SeasonsModule {}
