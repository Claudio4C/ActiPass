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

  /**
   * GET /family/dashboard
   * Vue consolidée : tous les enfants + leurs prochains événements
   */
  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.getFamilyDashboard(parentId);
  }

  /**
   * GET /family/children
   * Liste des enfants rattachés au parent connecté
   */
  @Get('children')
  async getChildren(@Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.getChildren(parentId);
  }

  /**
   * POST /family/children
   * Créer un enfant et le rattacher au parent connecté
   */
  @Post('children')
  @HttpCode(HttpStatus.CREATED)
  async createChild(@Body() dto: CreateChildDto, @Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.createChild(parentId, dto);
  }

  /**
   * PATCH /family/children/:childId
   * Mettre à jour les infos d'un enfant
   */
  @Patch('children/:childId')
  async updateChild(
    @Param('childId') childId: string,
    @Body() dto: UpdateChildDto,
    @Req() req: Request,
  ) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.updateChild(parentId, childId, dto);
  }

  /**
   * DELETE /family/children/:childId
   * Supprimer le lien familial (ne supprime pas le compte)
   */
  @Delete('children/:childId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeChild(@Param('childId') childId: string, @Req() req: Request) {
    const parentId = req.user?.['sub'] as string;
    return this.familyService.removeChild(parentId, childId);
  }

  /**
   * POST /family/children/:childId/memberships
   * Inscrire un enfant dans une organisation
   */
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
