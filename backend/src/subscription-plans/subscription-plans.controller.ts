import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreatePlanSchema, UpdatePlanSchema } from './dto/subscription-plan.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@Controller('organisations/:orgId/plans')
@UseGuards(JwtAuthGuard)
export class SubscriptionPlansController {
  constructor(private readonly service: SubscriptionPlansService) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string;
  }

  /** GET /organisations/:orgId/plans */
  @Get()
  findAll(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.findAll(orgId, this.userId(req));
  }

  /** POST /organisations/:orgId/plans */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Param('orgId') orgId: string, @Body() body: unknown, @Req() req: Request) {
    const dto = CreatePlanSchema.parse(body);
    return this.service.create(orgId, dto, this.userId(req));
  }

  /** PATCH /organisations/:orgId/plans/:planId */
  @Patch(':planId')
  update(
    @Param('orgId') orgId: string,
    @Param('planId') planId: string,
    @Body() body: unknown,
    @Req() req: Request
  ) {
    const dto = UpdatePlanSchema.parse(body);
    return this.service.update(orgId, planId, dto, this.userId(req));
  }

  /** DELETE /organisations/:orgId/plans/:planId */
  @Delete(':planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('orgId') orgId: string,
    @Param('planId') planId: string,
    @Req() req: Request
  ) {
    await this.service.remove(orgId, planId, this.userId(req));
  }
}
