import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule }   from '../auth/auth.module'
import { SeasonsController } from './seasons.controller'
import { SeasonsService }    from './seasons.service'

@Module({
  imports:     [PrismaModule, AuthModule],
  controllers: [SeasonsController],
  providers:   [SeasonsService],
  exports:     [SeasonsService],
})
export class SeasonsModule {}
