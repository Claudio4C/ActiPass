import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateOrganisationDto, UpdateOrganisationDto, InviteMemberDto } from './dto';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

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
      status: membership.status,
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
        left_at: null, // Seulement les membres actifs (non retirés)
        deleted_at: null, // Exclure aussi les membres supprimés (soft delete)
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

    console.log(
      `[getOrganisationMembers] Retourné ${members.length} membres actifs pour l'organisation ${organisationId}`
    );

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

    // Vérifier que le membre existe et est actif
    // Utiliser findFirst pour trouver le membership actif
    const memberToRemove = await this.prisma.membership.findFirst({
      where: {
        user_id: memberId,
        organisation_id: organisationId,
        left_at: null,
        deleted_at: null, // Exclure aussi les membres supprimés (soft delete)
      },
    });

    if (!memberToRemove) {
      throw new BadRequestException('Membre introuvable ou déjà retiré de cette organisation');
    }

    console.log(`[removeMember] Trouvé membership à retirer:`, {
      membershipId: memberToRemove.id,
      userId: memberId,
      organisationId: organisationId,
      currentLeftAt: memberToRemove.left_at,
    });

    // Marquer l'adhésion comme terminée en utilisant l'ID du membership pour garantir la mise à jour
    const leftAtDate = new Date();
    const updatedMembership = await this.prisma.membership.update({
      where: {
        id: memberToRemove.id,
      },
      data: {
        left_at: leftAtDate,
        // Le status reste tel quel, seul left_at indique que le membre a quitté
      },
    });

    console.log(`[removeMember] Membership mis à jour:`, {
      membershipId: updatedMembership.id,
      leftAt: updatedMembership.left_at,
      success: !!updatedMembership.left_at,
    });

    // Vérifier que la mise à jour a bien été effectuée
    if (!updatedMembership.left_at) {
      throw new BadRequestException('Erreur lors de la mise à jour du membership');
    }

    // Vérifier en relisant depuis la BDD pour confirmer
    const verifyMembership = await this.prisma.membership.findUnique({
      where: { id: memberToRemove.id },
      select: { id: true, left_at: true, user_id: true, organisation_id: true },
    });

    if (!verifyMembership || !verifyMembership.left_at) {
      console.error(`[removeMember] ERREUR: La mise à jour n'a pas été persistée en BDD`, {
        membershipId: memberToRemove.id,
        verifyResult: verifyMembership,
      });
      throw new BadRequestException(
        "La mise à jour du membership n'a pas été persistée en base de données"
      );
    }

    console.log(`[removeMember] Vérification BDD réussie:`, {
      membershipId: verifyMembership.id,
      leftAt: verifyMembership.left_at,
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

  /**
   * Inviter un membre par email
   */
  async inviteMember(organisationId: string, userId: string, inviteMemberDto: InviteMemberDto) {
    // Vérifier que l'utilisateur est propriétaire ou admin
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'club_manager'] as ('club_owner' | 'club_manager')[],
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Seul le propriétaire ou un administrateur peut inviter des membres'
      );
    }

    // Vérifier que l'organisation existe
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new BadRequestException('Organisation non trouvée');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: inviteMemberDto.email },
    });

    const roleType = inviteMemberDto.roleType || 'member';

    // Trouver le rôle
    const role = await this.prisma.role.findFirst({
      where: {
        type: roleType as 'club_owner' | 'club_manager' | 'treasurer' | 'coach' | 'member',
        space: organisation.type === 'sport' ? 'club_360' : 'municipality',
      },
    });

    if (!role) {
      throw new BadRequestException(`Rôle ${roleType} non trouvé`);
    }

    // Si l'utilisateur existe déjà, créer directement le membership
    if (existingUser) {
      const existingMembership = await this.prisma.membership.findFirst({
        where: {
          user_id: existingUser.id,
          organisation_id: organisationId,
          left_at: null,
        },
      });

      if (existingMembership) {
        throw new BadRequestException('Cet utilisateur est déjà membre de cette organisation');
      }

      // Créer le membership
      await this.prisma.membership.create({
        data: {
          user_id: existingUser.id,
          organisation_id: organisationId,
          role_id: role.id,
          joined_at: new Date(),
          status: 'pending',
        },
      });

      // Envoyer un email de notification
      await this.emailService.sendEmail({
        to: inviteMemberDto.email,
        subject: `Invitation à rejoindre ${organisation.name}`,
        html: `
          <h2>Vous avez été invité à rejoindre ${organisation.name}</h2>
          <p>Bonjour ${inviteMemberDto.firstname || inviteMemberDto.email},</p>
          <p>Vous avez été invité à rejoindre l'organisation <strong>${organisation.name}</strong> en tant que <strong>${role.name}</strong>.</p>
          <p>Connectez-vous à votre compte pour accepter l'invitation.</p>
          ${inviteMemberDto.message ? `<p><em>${inviteMemberDto.message}</em></p>` : ''}
        `,
      });

      return { message: 'Invitation envoyée avec succès' };
    }

    // Si l'utilisateur n'existe pas, envoyer un email d'invitation avec lien d'inscription
    const invitationToken = `invite_${organisationId}_${Date.now()}`; // TODO: Générer un token sécurisé

    await this.emailService.sendEmail({
      to: inviteMemberDto.email,
      subject: `Invitation à rejoindre ${organisation.name}`,
      html: `
        <h2>Invitation à rejoindre ${organisation.name}</h2>
        <p>Bonjour ${inviteMemberDto.firstname || inviteMemberDto.email},</p>
        <p>Vous avez été invité à rejoindre l'organisation <strong>${organisation.name}</strong> en tant que <strong>${role.name}</strong>.</p>
        <p>Pour accepter cette invitation, veuillez créer un compte en cliquant sur le lien ci-dessous :</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?invite=${invitationToken}">Créer mon compte et accepter l'invitation</a></p>
        ${inviteMemberDto.message ? `<p><em>${inviteMemberDto.message}</em></p>` : ''}
      `,
    });

    return { message: 'Invitation envoyée avec succès' };
  }

  /**
   * Récupérer l'historique des anciens membres (left_at != null)
   */
  async getOrganisationMembersHistory(organisationId: string, userId: string) {
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
        left_at: { not: null }, // Seulement les membres qui ont quitté
        deleted_at: null,
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
      orderBy: { left_at: 'desc' },
    });

    return members.map((member) => ({
      id: member.user.id,
      email: member.user.email,
      firstname: member.user.firstname,
      lastname: member.user.lastname,
      username: member.user.username,
      role: member.role,
      joined_at: member.joined_at,
      left_at: member.left_at,
    }));
  }

  /**
   * Exporter les membres en CSV
   */
  async exportMembersToCSV(
    organisationId: string,
    userId: string,
    includeHistory: boolean = false
  ) {
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

    const whereClause: {
      organisation_id: string;
      deleted_at: null;
      left_at?: null | { not: null };
    } = {
      organisation_id: organisationId,
      deleted_at: null,
    };

    if (!includeHistory) {
      whereClause.left_at = null;
    }

    const members = await this.prisma.membership.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            username: true,
            phone: true,
            created_at: true,
          },
        },
        role: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { joined_at: 'asc' },
    });

    // Générer le CSV
    const headers = [
      'Email',
      'Prénom',
      'Nom',
      'Username',
      'Téléphone',
      'Rôle',
      "Date d'adhésion",
      'Date de départ',
    ];
    const rows = members.map((member) => [
      member.user.email,
      member.user.firstname,
      member.user.lastname,
      member.user.username || '',
      member.user.phone || '',
      member.role.name,
      member.joined_at.toISOString().split('T')[0],
      member.left_at ? member.left_at.toISOString().split('T')[0] : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return {
      csv: csvContent,
      filename: `membres_${organisationId}_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }
}
