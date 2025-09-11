import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface ABACContext {
  userId: string;
  organisationId?: string;
  sectionId?: string;
  isMinor?: boolean;
  isLegalGuardian?: boolean;
  baseLegale?: string;
  resourceOwnerId?: string;
  resourceType?: string;
  resourceId?: string;
}

export interface ABACRule {
  name: string;
  condition: (context: ABACContext) => Promise<boolean>;
  description: string;
}

@Injectable()
export class ABACService {
  constructor(private prisma: PrismaService) {}

  private rules: ABACRule[] = [
    {
      name: 'minor_data_protection',
      condition: async (context) => {
        // Les données des mineurs ne sont accessibles qu'aux responsables légaux et admins
        if (context.isMinor) {
          return (
            context.isLegalGuardian || (await this.isAdmin(context.userId, context.organisationId))
          );
        }
        return true;
      },
      description: 'Protection des données des mineurs',
    },
    {
      name: 'section_isolation',
      condition: async (context) => {
        // Un responsable de section ne peut accéder qu'aux données de sa section
        if (context.sectionId) {
          return await this.hasAccessToSection(context.userId, context.sectionId);
        }
        return true;
      },
      description: 'Isolation des sections',
    },
    {
      name: 'tenant_isolation',
      condition: async (context) => {
        // Un utilisateur ne peut accéder qu'aux données de son tenant
        return await this.belongsToSameTenant(context.userId, context.organisationId);
      },
      description: 'Isolation des tenants',
    },
    {
      name: 'resource_ownership',
      condition: async (context) => {
        // Un utilisateur peut accéder à ses propres ressources
        if (context.resourceOwnerId) {
          return (
            context.userId === context.resourceOwnerId ||
            (await this.isAdmin(context.userId, context.organisationId))
          );
        }
        return true;
      },
      description: 'Propriété des ressources',
    },
    {
      name: 'municipal_aggregated_data',
      condition: async (context) => {
        // Les utilisateurs municipaux ne voient que des données agrégées
        if (await this.isMunicipalUser(context.userId)) {
          return this.isAggregatedData(context.resourceType);
        }
        return true;
      },
      description: 'Données agrégées pour les utilisateurs municipaux',
    },
    {
      name: 'health_data_protection',
      condition: async (context) => {
        // Les données de santé nécessitent des permissions spéciales
        if (this.isHealthData(context.resourceType)) {
          return await this.hasHealthDataAccess(context.userId, context.organisationId);
        }
        return true;
      },
      description: 'Protection des données de santé',
    },
    {
      name: 'financial_data_protection',
      condition: async (context) => {
        // Les données financières sont limitées aux trésoriers et admins
        if (this.isFinancialData(context.resourceType)) {
          return await this.hasFinancialAccess(context.userId, context.organisationId);
        }
        return true;
      },
      description: 'Protection des données financières',
    },
  ];

  /**
   * Évalue toutes les règles ABAC pour un contexte donné
   */
  async evaluateRules(
    context: ABACContext
  ): Promise<{ allowed: boolean; violatedRules: string[] }> {
    const violatedRules: string[] = [];

    for (const rule of this.rules) {
      try {
        const result = await rule.condition(context);
        if (!result) {
          violatedRules.push(rule.name);
        }
      } catch (error) {
        console.error(`Error evaluating ABAC rule ${rule.name}:`, error);
        violatedRules.push(rule.name);
      }
    }

    return {
      allowed: violatedRules.length === 0,
      violatedRules,
    };
  }

  /**
   * Vérifie si un utilisateur est administrateur
   */
  private async isAdmin(userId: string, organisationId?: string): Promise<boolean> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        status: 'active',
        ...(organisationId && { organisation_id: organisationId }),
      },
      include: {
        role: true,
      },
    });

    return memberships.some(
      (membership) =>
        membership.role.type === 'club_owner' ||
        membership.role.type === 'club_manager' ||
        membership.role.type === 'municipal_admin'
    );
  }

  /**
   * Vérifie si un utilisateur a accès à une section
   */
  private async hasAccessToSection(userId: string, sectionId: string): Promise<boolean> {
    // Logique pour vérifier l'accès à une section
    // À implémenter selon votre modèle de données
    console.log(`Checking access for user ${userId} to section ${sectionId}`);
    await Promise.resolve(); // Simuler une opération async
    return true;
  }

  /**
   * Vérifie si l'utilisateur appartient au même tenant
   */
  private async belongsToSameTenant(userId: string, organisationId?: string): Promise<boolean> {
    if (!organisationId) return true;

    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        status: 'active',
      },
    });

    return !!membership;
  }

  /**
   * Vérifie si l'utilisateur est municipal
   */
  private async isMunicipalUser(userId: string): Promise<boolean> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        status: 'active',
      },
      include: {
        role: true,
      },
    });

    return memberships.some((membership) => membership.role.space === 'municipality');
  }

  /**
   * Vérifie si les données sont agrégées
   */
  private isAggregatedData(resourceType?: string): boolean {
    // Les données agrégées sont typiquement des rapports et métriques
    return resourceType === 'report' || resourceType === 'facility:metrics';
  }

  /**
   * Vérifie si les données sont de santé
   */
  private isHealthData(resourceType?: string): boolean {
    return resourceType === 'case' || resourceType === 'document';
  }

  /**
   * Vérifie l'accès aux données de santé
   */
  private async hasHealthDataAccess(userId: string, organisationId?: string): Promise<boolean> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        status: 'active',
        ...(organisationId && { organisation_id: organisationId }),
      },
      include: {
        role: true,
      },
    });

    return memberships.some((membership) =>
      ['club_owner', 'club_admin', 'secretary', 'coach'].includes(membership.role.type)
    );
  }

  /**
   * Vérifie si les données sont financières
   */
  private isFinancialData(resourceType?: string): boolean {
    return resourceType === 'finance' || resourceType === 'pricing';
  }

  /**
   * Vérifie l'accès aux données financières
   */
  private async hasFinancialAccess(userId: string, organisationId?: string): Promise<boolean> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        status: 'active',
        ...(organisationId && { organisation_id: organisationId }),
      },
      include: {
        role: true,
      },
    });

    return memberships.some((membership) =>
      ['club_owner', 'club_admin', 'treasurer'].includes(membership.role.type)
    );
  }

  /**
   * Obtient le contexte ABAC pour une requête
   */
  async getContext(
    userId: string,
    organisationId?: string,
    resourceType?: string,
    resourceId?: string
  ): Promise<ABACContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        birthdate: true,
        memberships: {
          where: { status: 'active' },
          include: {
            organisation: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Déterminer si l'utilisateur est mineur
    const isMinor = user.birthdate
      ? new Date().getFullYear() - user.birthdate.getFullYear() < 18
      : false;

    // Déterminer si l'utilisateur est responsable légal
    // Note: À implémenter selon votre logique métier
    const isLegalGuardian = false;

    // Déterminer le propriétaire de la ressource
    let resourceOwnerId: string | undefined;
    if (resourceId && resourceType) {
      resourceOwnerId = await this.getResourceOwner(resourceType, resourceId);
    }

    return {
      userId,
      organisationId,
      isMinor,
      isLegalGuardian,
      resourceOwnerId,
      resourceType,
      resourceId,
    };
  }

  /**
   * Obtient le propriétaire d'une ressource
   */
  private async getResourceOwner(
    resourceType: string,
    resourceId: string
  ): Promise<string | undefined> {
    switch (resourceType) {
      case 'event': {
        const event = await this.prisma.event.findUnique({
          where: { id: resourceId },
          select: { created_by_id: true },
        });
        return event?.created_by_id;
      }

      case 'listing': {
        const listing = await this.prisma.listing.findUnique({
          where: { id: resourceId },
          select: { user_id: true },
        });
        return listing?.user_id;
      }

      case 'private_course': {
        const course = await this.prisma.privateCourse.findUnique({
          where: { id: resourceId },
          select: { tutor_id: true, student_id: true },
        });
        return course?.tutor_id || course?.student_id;
      }

      default:
        return undefined;
    }
  }
}
