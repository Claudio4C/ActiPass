import { Controller, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';

import { RequireManage } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

import { UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
   * Récupérer un utilisateur spécifique (admin seulement)
   */
  @Get(':id')
  @RequireManage('user', 'organisation')
  async getUser(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.getUser(id, userId);
  }

  /**
   * Modifier un utilisateur (admin seulement)
   */
  @Put(':id')
  @RequireManage('user', 'organisation')
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
   * Supprimer un utilisateur (admin seulement)
   */
  @Delete(':id')
  @RequireManage('user', 'organisation')
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.deleteUser(id, userId);
  }

  /**
   * Récupérer les permissions d'un utilisateur (admin seulement)
   */
  @Get(':id/permissions')
  @RequireManage('user', 'organisation')
  async getUserPermissions(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.usersService.getUserPermissions(id);
  }
}
