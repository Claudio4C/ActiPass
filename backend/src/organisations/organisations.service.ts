import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateOrganisationDto, UpdateOrganisationDto } from './dto';

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une nouvelle organisation
   * L'utilisateur devient automatiquement propriétaire
   */
  async createOrganisation(createOrganisationDto: CreateOrganisationDto, userId: string) {
    const { name, type, description, address, phone, email, website } = createOrganisationDto;

    // Créer l'organisation
    const organisation = await this.prisma.organisation.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        type: type,
        description,
        address,
        phone,
        email,
        website_url: website,
        created_by_id: userId,
      },
    });

    // Trouver le rôle propriétaire (club_owner par défaut)
    const ownerRoleType = 'club_owner';
    const ownerRole = await this.prisma.role.findFirst({
      where: {
        type: ownerRoleType as
          | 'club_owner'
          | 'club_manager'
          | 'treasurer'
          | 'coach'
          | 'member'
          | 'municipal_admin'
          | 'municipal_manager'
          | 'municipal_viewer',
      },
    });

    if (!ownerRole) {
      throw new BadRequestException(`Rôle propriétaire non trouvé pour le type ${type}`);
    }

    // Créer l'adhésion (membership) de l'utilisateur à l'organisation
    await this.prisma.membership.create({
      data: {
        user_id: userId,
        organisation_id: organisation.id,
        role_id: ownerRole.id,
        is_main_membership: true,
        validated: true,
        status: 'active' as 'active' | 'pending' | 'banned',
      },
    });

    return {
      message: 'Organisation créée avec succès',
      organisation: {
        id: organisation.id,
        name: organisation.name,
        type: organisation.type,
        created_at: organisation.created_at,
      },
      role: {
        id: ownerRole.id,
        name: ownerRole.name,
        type: ownerRole.type,
      },
    };
  }

  /**
   * Récupérer les organisations d'un utilisateur
   */
  async getUserOrganisations(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        left_at: null, // Seulement les adhésions actives
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            created_at: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
          },
        },
      },
    });

    return memberships.map((membership) => ({
      organisation: membership.organisation,
      role: membership.role,
      joined_at: membership.joined_at,
    }));
  }

  /**
   * Récupérer une organisation spécifique
   */
  async getOrganisation(organisationId: string, userId: string) {
    // Vérifier que l'utilisateur est membre de l'organisation
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
      include: {
        organisation: true,
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    return {
      organisation: membership.organisation,
      myRole: membership.role,
    };
  }

  /**
   * Modifier une organisation
   */
  async updateOrganisation(
    organisationId: string,
    updateOrganisationDto: UpdateOrganisationDto,
    userId: string
  ) {
    // Vérifier que l'utilisateur est propriétaire
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'municipal_manager'] as ('club_owner' | 'municipal_manager')[],
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Seul le propriétaire peut modifier l'organisation");
    }

    // Préparer les données à mettre à jour
    const updateData: Record<string, unknown> = { ...updateOrganisationDto };
    if (updateOrganisationDto.website !== undefined) {
      updateData.website_url = updateOrganisationDto.website;
    }
    delete updateData.website; // Supprimer le champ website du DTO

    const updatedOrganisation = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: updateData, // Type assertion nécessaire pour Prisma
    });

    return {
      message: 'Organisation mise à jour avec succès',
      organisation: updatedOrganisation,
    };
  }

  /**
   * Supprimer une organisation
   */
  async deleteOrganisation(organisationId: string, userId: string) {
    // Vérifier que l'organisation existe
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new BadRequestException('Organisation non trouvée');
    }

    // Vérifier que l'utilisateur est propriétaire
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'municipal_manager'] as ('club_owner' | 'municipal_manager')[],
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Seul le propriétaire peut supprimer l'organisation");
    }

    // Soft delete de l'organisation : mettre deleted_at et passer en suspended
    await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        deleted_at: new Date(),
        status: 'suspended',
        updated_at: new Date(),
      },
    });

    // Soft delete des membres
    await this.prisma.membership.updateMany({
      where: {
        organisation_id: organisationId,
        left_at: null,
      },
      data: {
        left_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { message: 'Organisation supprimée avec succès' };
  }

  /**
   * Récupérer les membres d'une organisation
   */
  async getOrganisationMembers(organisationId: string, userId: string) {
    // Vérifier que l'utilisateur est membre de l'organisation
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const members = await this.prisma.membership.findMany({
      where: {
        organisation_id: organisationId,
        left_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            username: true,
            created_at: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
          },
        },
      },
      orderBy: { joined_at: 'asc' },
    });

    return members.map((member) => ({
      id: member.user.id,
      email: member.user.email,
      firstname: member.user.firstname,
      lastname: member.user.lastname,
      username: member.user.username,
      role: member.role,
      joined_at: member.joined_at,
    }));
  }

  /**
   * Changer le rôle d'un membre
   */
  async updateMemberRole(
    organisationId: string,
    memberId: string,
    roleType: string,
    userId: string
  ) {
    // Vérifier que l'utilisateur est propriétaire
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'municipal_manager'] as ('club_owner' | 'municipal_manager')[],
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Seul le propriétaire peut modifier les rôles');
    }

    // Trouver le nouveau rôle
    const newRole = await this.prisma.role.findFirst({
      where: {
        type: roleType as
          | 'club_owner'
          | 'club_manager'
          | 'treasurer'
          | 'coach'
          | 'member'
          | 'municipal_admin'
          | 'municipal_manager'
          | 'municipal_viewer',
      },
    });

    if (!newRole) {
      throw new BadRequestException('Rôle non trouvé');
    }

    // Mettre à jour le rôle du membre
    await this.prisma.membership.updateMany({
      where: {
        user_id: memberId,
        organisation_id: organisationId,
        left_at: null,
      },
      data: { role_id: newRole.id },
    });

    return {
      message: 'Rôle mis à jour avec succès',
      newRole: {
        id: newRole.id,
        name: newRole.name,
        type: newRole.type,
      },
    };
  }

  /**
   * Retirer un membre d'une organisation
   */
  async removeMember(organisationId: string, memberId: string, userId: string) {
    // Vérifier que l'utilisateur est propriétaire
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'municipal_manager'] as ('club_owner' | 'municipal_manager')[],
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Seul le propriétaire peut retirer des membres');
    }

    // Ne pas permettre de se retirer soi-même
    if (memberId === userId) {
      throw new BadRequestException('Vous ne pouvez pas vous retirer de votre propre organisation');
    }

    // Marquer l'adhésion comme terminée
    await this.prisma.membership.updateMany({
      where: {
        user_id: memberId,
        organisation_id: organisationId,
        left_at: null,
      },
      data: { left_at: new Date() },
    });

    return { message: 'Membre retiré avec succès' };
  }

  /**
   * Rejoindre une organisation
   */
  async joinOrganisation(organisationId: string, userId: string, roleType: string = 'member') {
    // Vérifier que l'organisation existe
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new Error('Organisation non trouvée');
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingMembership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null, // Pas encore parti
      },
    });

    if (existingMembership) {
      throw new Error('Vous êtes déjà membre de cette organisation');
    }

    // Trouver le rôle
    const role = await this.prisma.role.findFirst({
      where: {
        type: roleType as
          | 'club_owner'
          | 'club_manager'
          | 'treasurer'
          | 'coach'
          | 'member'
          | 'municipal_admin'
          | 'municipal_manager'
          | 'municipal_viewer',
        space: organisation.type === 'sport' ? 'club_360' : 'municipality',
      },
    });

    if (!role) {
      throw new Error(`Rôle ${roleType} non trouvé`);
    }

    // Créer le membership
    const membership = await this.prisma.membership.create({
      data: {
        user_id: userId,
        organisation_id: organisationId,
        role_id: role.id,
        joined_at: new Date(),
        status: 'pending', // En attente d'approbation
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    return {
      message: "Demande d'adhésion envoyée avec succès",
      membership,
    };
  }
}
