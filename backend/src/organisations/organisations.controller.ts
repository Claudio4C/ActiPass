import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

import { RequireManage, RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

import {
  CreateOrganisationDto,
  UpdateOrganisationDto,
  InviteMemberDto,
  CreateMemberTagDto,
  SetMemberTagsDto,
} from './dto';
import { OrganisationsService } from './organisations.service';

@Controller('organisations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  /**
   * Créer une nouvelle organisation (club/association ou municipalité)
   * L'utilisateur devient automatiquement propriétaire
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrganisation(
    @Body() createOrganisationDto: CreateOrganisationDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.createOrganisation(createOrganisationDto, userId);
  }

  /**
   * Lister tous les clubs publics (annuaire — accessible à tout utilisateur connecté)
   */
  @Get('public')
  async listPublicOrganisations(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
  ) {
    return this.organisationsService.listPublicOrganisations({
      search, type, city, limit: parseInt(limit ?? '50'),
    });
  }

  /**
   * Lister mes organisations (celles où je suis membre)
   */
  @Get('my')
  async getMyOrganisations(@Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.getUserOrganisations(userId);
  }

  /**
   * Détails d'une organisation
   */
  @Get(':id')
  async getOrganisation(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.getOrganisation(id, userId);
  }

  /**
   * Modifier une organisation (seulement si je suis propriétaire)
   */
  @Put(':id')
  @RequireManage('organisation', 'own')
  async updateOrganisation(
    @Param('id') id: string,
    @Body() updateOrganisationDto: UpdateOrganisationDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.updateOrganisation(id, updateOrganisationDto, userId);
  }

  /**
   * Supprimer une organisation (seulement si je suis propriétaire)
   */
  @Delete(':id')
  @RequireManage('organisation', 'own')
  async deleteOrganisation(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.deleteOrganisation(id, userId);
  }

  /**
   * Rejoindre une organisation (demande d'adhésion)
   */
  @Post(':id/join')
  async joinOrganisation(
    @Param('id') organisationId: string,
    @Body() body: { roleType?: string },
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.joinOrganisation(
      organisationId,
      userId,
      body.roleType || 'member'
    );
  }

  /**
   * Lister les membres d'une organisation (?tagId= pour filtrer par tag)
   */
  @Get(':id/members')
  async getOrganisationMembers(
    @Param('id') id: string,
    @Query('tagId') tagId: string | undefined,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.getOrganisationMembers(id, userId, tagId ? { tagId } : undefined);
  }

  /**
   * Récupérer l'historique des anciens membres (route statique avant :memberId)
   */
  @Get(':id/members/history')
  async getOrganisationMembersHistory(@Param('id') organisationId: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.getOrganisationMembersHistory(organisationId, userId);
  }

  /**
   * Exporter les membres en CSV
   */
  @Get(':id/members/export')
  async exportMembersToCSV(
    @Param('id') organisationId: string,
    @Query('includeHistory') includeHistory: string | undefined,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.exportMembersToCSV(
      organisationId,
      userId,
      includeHistory === 'true'
    );
  }

  /**
   * Inviter un membre par email
   */
  @Post(':id/members/invite')
  @RequirePermissions({ resource: 'role', action: 'assign', scope: 'organisation' })
  async inviteMember(
    @Param('id') organisationId: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.inviteMember(organisationId, userId, inviteMemberDto);
  }

  /**
   * Tags membres du club (libellés — contrôle d’accès dans le service, sans RBAC « members.read »)
   */
  @Get(':id/member-tags')
  async listOrganisationMemberTags(@Param('id') organisationId: string, @Req() req: Request) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.listOrganisationMemberTags(organisationId, userId);
  }

  @Post(':id/member-tags')
  async createOrganisationMemberTag(
    @Param('id') organisationId: string,
    @Body() dto: CreateMemberTagDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.createOrganisationMemberTag(organisationId, userId, dto.name);
  }

  @Delete(':id/member-tags/:tagId')
  async deleteOrganisationMemberTag(
    @Param('id') organisationId: string,
    @Param('tagId') tagId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.deleteOrganisationMemberTag(organisationId, userId, tagId);
  }

  /**
   * Détail d'un membre (avec tuteurs si mineur)
   */
  @Get(':id/members/:memberId')
  async getMemberById(
    @Param('id') organisationId: string,
    @Param('memberId') memberId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    return this.organisationsService.getMemberById(organisationId, memberId, userId);
  }

  /**
   * Attribuer des tags à un membre (remplace l'ensemble des tags)
   */
  @Put(':id/members/:memberId/tags')
  async setMemberTags(
    @Param('id') organisationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: SetMemberTagsDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.setMemberTagsForUser(
      organisationId,
      memberId,
      userId,
      dto.tagIds
    );
  }

  /**
   * Changer le rôle d'un membre (seulement si je suis propriétaire)
   */
  @Put(':id/members/:memberId/role')
  @RequirePermissions({ resource: 'role', action: 'assign', scope: 'organisation' })
  async updateMemberRole(
    @Param('id') organisationId: string,
    @Param('memberId') memberId: string,
    @Body() body: { roleType: string },
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.updateMemberRole(
      organisationId,
      memberId,
      body.roleType,
      userId
    );
  }

  /**
   * Retirer un membre d'une organisation (seulement si je suis propriétaire)
   */
  @Delete(':id/members/:memberId')
  @RequirePermissions({ resource: 'role', action: 'assign', scope: 'organisation' })
  async removeMember(
    @Param('id') organisationId: string,
    @Param('memberId') memberId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.organisationsService.removeMember(organisationId, memberId, userId);
  }
}
