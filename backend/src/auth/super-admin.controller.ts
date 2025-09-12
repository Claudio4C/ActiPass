import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin')
@UseGuards(JwtAuthGuard)
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  /**
   * Middleware pour vérifier que l'utilisateur est super admin
   */
  private async checkSuperAdmin(req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }

    const isSuperAdmin = await this.superAdminService.isSuperAdmin(userId);
    if (!isSuperAdmin) {
      throw new Error('Accès refusé. Super Admin requis.');
    }

    return userId;
  }

  /**
   * Tableau de bord Super Admin
   */
  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.getGlobalStats();
  }

  /**
   * Lister toutes les organisations
   */
  @Get('organisations')
  async getAllOrganisations(@Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.getAllOrganisations();
  }

  /**
   * Lister tous les utilisateurs
   */
  @Get('users')
  async getAllUsers(@Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.getAllUsers();
  }

  /**
   * Suspendre un utilisateur
   */
  @Put('users/:id/suspend')
  async suspendUser(
    @Param('id') userId: string,
    @Body() body: { reason?: string },
    @Req() req: Request
  ) {
    await this.checkSuperAdmin(req);
    const reason = body.reason || 'Aucune raison spécifiée';
    return this.superAdminService.suspendUser(userId, reason);
  }

  /**
   * Réactiver un utilisateur
   */
  @Put('users/:id/activate')
  async activateUser(@Param('id') userId: string, @Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.activateUser(userId);
  }

  /**
   * Supprimer définitivement une organisation
   */
  @Delete('organisations/:id/permanent')
  async permanentlyDeleteOrganisation(@Param('id') organisationId: string, @Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.permanentlyDeleteOrganisation(organisationId);
  }

  /**
   * Restaurer une organisation supprimée
   */
  @Put('organisations/:id/restore')
  async restoreOrganisation(@Param('id') organisationId: string, @Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.restoreOrganisation(organisationId);
  }

  /**
   * Créer un nouveau Super Admin (SEUL le Super Admin peut le faire)
   */
  @Post('create-super-admin')
  async createSuperAdmin(
    @Body()
    body: {
      email: string;
      username: string;
      firstname: string;
      lastname: string;
      password: string;
    },
    @Req() req: Request
  ) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.createSuperAdmin(body);
  }
}
