import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CreateChildDto, UpdateChildDto, EnrollChildDto } from './dto';
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

  @Patch('children/:childId')
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
}
