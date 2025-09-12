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
   * Obtient toutes les organisations (même supprimées)
   */
  async getAllOrganisations() {
    return this.prisma.organisation.findMany({
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
  }

  /**
   * Obtient tous les utilisateurs
   */
  async getAllUsers(): Promise<SuperAdminUser[]> {
    const users = await this.prisma.user.findMany({
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
      },
      orderBy: { created_at: 'desc' },
    });

    return users as SuperAdminUser[];
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
   * Supprimer définitivement une organisation
   */
  async permanentlyDeleteOrganisation(organisationId: string) {
    // Supprimer d'abord tous les membres
    await this.prisma.membership.deleteMany({
      where: { organisation_id: organisationId },
    });

    // Puis supprimer l'organisation
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
      data: { deleted_at: null },
    });
  }

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats() {
    const [totalUsers, activeUsers, totalOrganisations, activeOrganisations, totalMemberships] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'active' } }),
        this.prisma.organisation.count(),
        this.prisma.organisation.count({ where: { deleted_at: null } }),
        this.prisma.membership.count({ where: { left_at: null } }),
      ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: totalUsers - activeUsers,
      },
      organisations: {
        total: totalOrganisations,
        active: activeOrganisations,
        deleted: totalOrganisations - activeOrganisations,
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
