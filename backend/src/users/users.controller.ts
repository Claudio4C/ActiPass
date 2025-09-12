import { Controller, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';

import { SuperAdminOrPermissions } from '../auth/decorators/super-admin-or-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminOrPermissionsGuard } from '../auth/guards/super-admin-or-permissions.guard';
import { SuperAdminService } from '../auth/super-admin.service';

import { UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, SuperAdminOrPermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly superAdminService: SuperAdminService
  ) {}

  /**
   * Récupérer mon profil
   */
  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.getUserProfile(userId);
  }

  /**
   * Modifier mon profil
   */
  @Put('me')
  async updateMyProfile(@Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.updateUserProfile(userId, updateUserDto);
  }

  /**
   * Récupérer mes organisations
   */
  @Get('me/organisations')
  async getMyOrganisations(@Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.getUserOrganisations(userId);
  }

  /**
   * Récupérer mes permissions
   */
  @Get('me/permissions')
  async getMyPermissions(@Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.getUserPermissions(userId);
  }

  /**
   * Récupérer un utilisateur spécifique (Super Admin ou admin seulement)
   */
  @Get(':id')
  @SuperAdminOrPermissions('user', 'read', 'organisation')
  async getUser(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.getUser(id, userId);
  }

  /**
   * Modifier un utilisateur (Super Admin ou admin seulement)
   */
  @Put(':id')
  @SuperAdminOrPermissions('user', 'update', 'organisation')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.updateUser(id, updateUserDto, userId);
  }

  /**
   * Supprimer un utilisateur (Super Admin ou admin seulement)
   */
  @Delete(':id')
  @SuperAdminOrPermissions('user', 'delete', 'organisation')
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.deleteUser(id, userId);
  }

  /**
   * Récupérer les permissions d'un utilisateur (Super Admin ou admin seulement)
   */
  @Get(':id/permissions')
  @SuperAdminOrPermissions('user', 'read', 'organisation')
  async getUserPermissions(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.getUserPermissions(id);
  }
}
