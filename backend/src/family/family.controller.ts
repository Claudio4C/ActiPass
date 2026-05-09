import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChildDto, UpdateChildDto, EnrollChildDto, UpsertChildHealthDto } from './dto';
import { FamilyService } from './family.service';

@Controller('family')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.getFamilyDashboard(parentId);
  }

  @Get('children')
  async getChildren(@Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.getChildren(parentId);
  }

  @Post('children')
  @HttpCode(HttpStatus.CREATED)
  async createChild(@Body() dto: CreateChildDto, @Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.createChild(parentId, dto);
  }

  @Put('children/:childId')
  async updateChild(
    @Param('childId') childId: string,
    @Body() dto: UpdateChildDto,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.updateChild(parentId, childId, dto);
  }

  @Delete('children/:childId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeChild(@Param('childId') childId: string, @Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.removeChild(parentId, childId);
  }

  @Post('children/:childId/memberships')
  @HttpCode(HttpStatus.CREATED)
  async enrollChild(
    @Param('childId') childId: string,
    @Body() dto: EnrollChildDto,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.enrollChild(parentId, childId, dto);
  }

  @Post('children/:childId/events/:eventId/register')
  @HttpCode(HttpStatus.CREATED)
  async registerChildToEvent(
    @Param('childId') childId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.registerChildToEvent(parentId, childId, eventId);
  }

  @Delete('children/:childId/events/:eventId/register')
  @HttpCode(HttpStatus.OK)
  async unregisterChildFromEvent(
    @Param('childId') childId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.unregisterChildFromEvent(parentId, childId, eventId);
  }

  // ─── Health info ──────────────────────────────────────────────────────────

  @Get('children/:childId/health')
  async getChildHealth(@Param('childId') childId: string, @Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.getChildHealth(parentId, childId);
  }

  @Put('children/:childId/health')
  async upsertChildHealth(
    @Param('childId') childId: string,
    @Body() dto: UpsertChildHealthDto,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.upsertChildHealth(parentId, childId, dto);
  }

  // ─── Authorizations ───────────────────────────────────────────────────────

  @Get('children/:childId/authorizations')
  async getChildAuthorizations(@Param('childId') childId: string, @Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.getChildAuthorizations(parentId, childId);
  }

  @Post('children/:childId/authorizations/:type/sign')
  @HttpCode(HttpStatus.OK)
  async signAuthorization(
    @Param('childId') childId: string,
    @Param('type') type: string,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.signAuthorization(parentId, childId, type);
  }

  @Delete('children/:childId/authorizations/:type/sign')
  @HttpCode(HttpStatus.OK)
  async unsignAuthorization(
    @Param('childId') childId: string,
    @Param('type') type: string,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.unsignAuthorization(parentId, childId, type);
  }
}
