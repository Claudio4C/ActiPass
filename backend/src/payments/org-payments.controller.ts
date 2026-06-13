import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('organisations/:orgId')
@UseGuards(JwtAuthGuard)
export class OrgPaymentsController {
  constructor(private readonly service: PaymentsService) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string;
  }

  /** GET /organisations/:orgId/payments/unpaid-members */
  @Get('payments/unpaid-members')
  getUnpaidMembers(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.getUnpaidMembers(orgId, this.userId(req));
  }

  /** POST /organisations/:orgId/payments/remind/:userId */
  @Post('payments/remind/:userId')
  @HttpCode(HttpStatus.OK)
  remindMember(
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    return this.service.remindMember(orgId, targetUserId, this.userId(req));
  }
}
