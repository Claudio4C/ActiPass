import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SeasonsService } from './seasons.service'

@Controller('organisations/:orgId')
@UseGuards(JwtAuthGuard)
export class RenewalsController {
  constructor(private readonly service: SeasonsService) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string
  }

  /** GET /organisations/:orgId/renewals */
  @Get('renewals')
  getRenewals(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.getRenewals(orgId, this.userId(req))
  }
}
