import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { AttendanceController, AttendanceStatsController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AttendanceController, AttendanceStatsController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
