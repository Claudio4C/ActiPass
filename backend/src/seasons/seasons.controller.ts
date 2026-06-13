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
} from '@nestjs/common'
import { Request } from 'express'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import {
  CreateSeasonSchema,
  UpdateSeasonSchema,
  CloseSeasonSchema,
  type CreateSeasonDto,
  type UpdateSeasonDto,
  type CloseSeasonDto,
} from './dto/season.dto'
import { SeasonsService } from './seasons.service'

@Controller('organisations/:orgId/seasons')
@UseGuards(JwtAuthGuard)
export class SeasonsController {
  constructor(private readonly service: SeasonsService) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string
  }

  /** GET /organisations/:orgId/seasons */
  @Get()
  findAll(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.findAll(orgId, this.userId(req))
  }

  /**
   * GET /organisations/:orgId/seasons/current
   * Declared before /:seasonId to avoid route conflict.
   */
  @Get('current')
  getCurrent(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.getCurrent(orgId, this.userId(req))
  }

  /**
   * GET /organisations/:orgId/seasons/mine
   * Declared before /:seasonId to avoid route conflict.
   */
  @Get('mine')
  getMine(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.getMine(orgId, this.userId(req))
  }

  /** POST /organisations/:orgId/seasons */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('orgId') orgId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const dto = CreateSeasonSchema.parse(body) as CreateSeasonDto
    return this.service.create(orgId, dto, this.userId(req))
  }

  /** PATCH /organisations/:orgId/seasons/:seasonId */
  @Patch(':seasonId')
  update(
    @Param('orgId') orgId: string,
    @Param('seasonId') seasonId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const dto = UpdateSeasonSchema.parse(body) as UpdateSeasonDto
    return this.service.update(orgId, seasonId, dto, this.userId(req))
  }

  /** DELETE /organisations/:orgId/seasons/:seasonId */
  @Delete(':seasonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('orgId') orgId: string,
    @Param('seasonId') seasonId: string,
    @Req() req: Request,
  ) {
    await this.service.remove(orgId, seasonId, this.userId(req))
  }

  /** POST /organisations/:orgId/seasons/:seasonId/activate */
  @Post(':seasonId/activate')
  @HttpCode(HttpStatus.OK)
  activate(
    @Param('orgId') orgId: string,
    @Param('seasonId') seasonId: string,
    @Req() req: Request,
  ) {
    return this.service.activate(orgId, seasonId, this.userId(req))
  }

  /** POST /organisations/:orgId/seasons/:seasonId/close */
  @Post(':seasonId/close')
  @HttpCode(HttpStatus.OK)
  close(
    @Param('orgId') orgId: string,
    @Param('seasonId') seasonId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const dto = CloseSeasonSchema.parse(body) as CloseSeasonDto
    return this.service.close(orgId, seasonId, dto, this.userId(req))
  }
}
