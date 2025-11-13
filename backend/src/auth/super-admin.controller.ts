import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin')
@UseGuards(JwtAuthGuard)
@SkipThrottle() // Désactiver le rate limiting pour toutes les routes Super Admin
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
   * Récupérer une organisation par ID
   */
  @Get('organisations/:id')
  async getOrganisation(@Param('id') organisationId: string, @Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.getOrganisationById(organisationId);
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
    @Body() body: { reason?: string } | undefined,
    @Req() req: Request
  ) {
    await this.checkSuperAdmin(req);
    const reason = body?.reason || 'Aucune raison spécifiée';
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
   * Restaurer un utilisateur supprimé
   */
  @Put('users/:id/restore')
  async restoreUser(@Param('id') userId: string, @Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.restoreUser(userId);
  }

  /**
   * Supprimer une organisation (soft delete)
   */
  @Delete('organisations/:id')
  async deleteOrganisation(@Param('id') organisationId: string, @Req() req: Request) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.deleteOrganisation(organisationId);
  }

  /**
   * Supprimer définitivement une organisation (hard delete - à utiliser avec précaution)
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
   * Modifier une organisation (Super Admin peut modifier n'importe quelle organisation)
   */
  @Put('organisations/:id')
  async updateOrganisation(
    @Param('id') organisationId: string,
    @Body()
    updateData: {
      name?: string;
      description?: string | null;
      type?: 'sport' | 'culture' | 'loisir' | 'social' | 'other';
      logo_url?: string | null;
      email?: string | null;
      phone?: string | null;
      website_url?: string | null;
      address?: string | null;
      city?: string | null;
      zip_code?: string | null;
      country?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      member_limit?: number | null;
      is_public?: boolean;
      status?: 'active' | 'suspended' | 'pending_validation';
    },
    @Req() req: Request
  ) {
    await this.checkSuperAdmin(req);
    return this.superAdminService.updateOrganisation(organisationId, updateData);
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
