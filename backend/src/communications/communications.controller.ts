import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminOrPermissionsGuard } from '../auth/guards/super-admin-or-permissions.guard';

import { CommunicationsService } from './communications.service';
import { BroadcastDto } from './dto/broadcast.dto';

@Controller('organisations/:orgId/communications')
@UseGuards(JwtAuthGuard, SuperAdminOrPermissionsGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('broadcast')
  broadcast(
    @Param('orgId') orgId: string,
    @Body() dto: BroadcastDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.['sub'] as string;
    return this.communicationsService.broadcast(orgId, userId, dto);
  }

  @Get('history')
  getHistory(@Param('orgId') orgId: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    return this.communicationsService.getHistory(orgId, userId);
  }

  @Get('recipients-count')
  getRecipientsCount(
    @Param('orgId') orgId: string,
    @Query('target') target: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.['sub'] as string;
    return this.communicationsService.getRecipientsCount(orgId, userId, target);
  }

  @Delete('history')
  clearHistory(@Param('orgId') orgId: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    return this.communicationsService.clearHistory(orgId, userId);
  }
}
