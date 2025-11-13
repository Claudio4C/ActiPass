import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { SuperAdminUser } from './types/super-admin.types';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie si un utilisateur est super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { is_super_admin: true },
    });

    return Boolean(user?.is_super_admin);
  }

  /**
   * Obtient une organisation par ID (même supprimée)
   */
  async getOrganisationById(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstname: true,
                lastname: true,
              },
            },
            role: true,
          },
        },
      },
    });

    if (!organisation) {
      throw new Error('Organisation non trouvée');
    }

    return {
      ...organisation,
      isDeleted: organisation.deleted_at !== null,
    };
  }

  /**
   * Obtient toutes les organisations (même supprimées)
   */
  async getAllOrganisations() {
    const organisations = await this.prisma.organisation.findMany({
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstname: true,
                lastname: true,
              },
            },
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Ajouter le champ isDeleted pour faciliter le filtrage côté frontend
    return organisations.map((org) => ({
      ...org,
      isDeleted: org.deleted_at !== null,
    }));
  }

  /**
   * Obtient tous les utilisateurs (y compris supprimés pour SuperAdmin)
   */
  async getAllUsers(): Promise<SuperAdminUser[]> {
    const users = await this.prisma.user.findMany({
      // Ne pas filtrer par deleted_at pour voir tous les utilisateurs
      select: {
        id: true,
        email: true,
        username: true,
        firstname: true,
        lastname: true,
        is_email_verified: true,
        status: true,
        is_super_admin: true,
        created_at: true,
        last_login_at: true,
        deleted_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Ajouter le champ isDeleted pour faciliter le filtrage côté frontend
    return users.map((user) => ({
      ...user,
      isDeleted: user.deleted_at !== null,
    })) as SuperAdminUser[];
  }

  /**
   * Suspendre un utilisateur
   */
  async suspendUser(userId: string, reason: string) {
    // TODO: Ajouter un champ pour la raison de suspension si nécessaire
    console.log('Raison de suspension:', reason);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'suspended',
      },
    });
  }

  /**
   * Réactiver un utilisateur
   */
  async activateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'active',
      },
    });
  }

  /**
   * Restaurer un utilisateur supprimé
   */
  async restoreUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { deleted_at: null, status: 'active' },
    });
  }

  /**
   * Supprimer une organisation (soft delete)
   */
  async deleteOrganisation(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new Error('Organisation non trouvée');
    }

    // Soft delete de l'organisation : mettre deleted_at et passer en suspended
    return this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        deleted_at: new Date(),
        status: 'suspended',
      },
    });
  }

  /**
   * Supprimer définitivement une organisation (hard delete - à utiliser avec précaution)
   */
  async permanentlyDeleteOrganisation(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new Error('Organisation non trouvée');
    }

    // Supprimer d'abord tous les membres
    await this.prisma.membership.deleteMany({
      where: { organisation_id: organisationId },
    });

    // Puis supprimer définitivement l'organisation
    return this.prisma.organisation.delete({
      where: { id: organisationId },
    });
  }

  /**
   * Restaurer une organisation supprimée
   */
  async restoreOrganisation(organisationId: string) {
    return this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        deleted_at: null,
        status: 'active',
      },
    });
  }

  /**
   * Modifier une organisation (Super Admin peut modifier n'importe quelle organisation)
   */
  async updateOrganisation(
    organisationId: string,
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
    }
  ) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new Error('Organisation non trouvée');
    }

    // Préparer les données à mettre à jour (enlever les undefined)
    const dataToUpdate: Record<string, unknown> = {};
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] !== undefined) {
        dataToUpdate[key] = updateData[key as keyof typeof updateData];
      }
    });

    return this.prisma.organisation.update({
      where: { id: organisationId },
      data: dataToUpdate,
    });
  }

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingUsers,
      totalOrganisations,
      activeOrganisations,
      suspendedOrganisations,
      pendingOrganisations,
      totalMemberships,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deleted_at: null } }),
      this.prisma.user.count({ where: { status: 'active', deleted_at: null } }),
      this.prisma.user.count({ where: { status: 'suspended', deleted_at: null } }),
      this.prisma.user.count({ where: { status: 'pending', deleted_at: null } }),
      this.prisma.organisation.count(), // Toutes les organisations, y compris supprimées
      this.prisma.organisation.count({ where: { status: 'active', deleted_at: null } }), // Organisations actives
      this.prisma.organisation.count({
        where: {
          OR: [{ status: 'suspended', deleted_at: null }, { deleted_at: { not: null } }],
        },
      }), // Organisations suspendues + supprimées
      this.prisma.organisation.count({ where: { status: 'pending_validation', deleted_at: null } }), // Organisations en attente
      this.prisma.membership.count({ where: { left_at: null } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        pending: pendingUsers,
      },
      organisations: {
        total: totalOrganisations,
        active: activeOrganisations,
        suspended: suspendedOrganisations, // Suspendues + Supprimées regroupées
        pending: pendingOrganisations,
      },
      memberships: {
        total: totalMemberships,
      },
    };
  }

  /**
   * Créer un nouveau Super Admin (SEUL le Super Admin peut le faire)
   */
  async createSuperAdmin(data: {
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    password: string;
  }) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new Error("Un utilisateur avec cet email ou nom d'utilisateur existe déjà");
    }

    // Créer le Super Admin
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const superAdmin = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        firstname: data.firstname,
        lastname: data.lastname,
        password: hashedPassword,
        is_email_verified: true,
        gender: 'prefer_not_to_say',
        is_super_admin: true,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstname: true,
        lastname: true,
        is_super_admin: true,
        status: true,
      },
    });

    return {
      message: 'Super Admin créé avec succès',
      superAdmin,
    };
  }
}
