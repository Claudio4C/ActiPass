import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { ABACService, ABACContext } from './abac.service';

export interface PermissionCheck {
  resource: string;
  action: string;
  scope?: 'own' | 'organisation' | 'global';
}

@Injectable()
export class PermissionsService {
  constructor(
    private prisma: PrismaService,
    private abacService: ABACService
  ) {}

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async hasPermission(
    userId: string,
    permission: PermissionCheck,
    organisationId?: string
  ): Promise<boolean> {
    const userMemberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        status: 'active',
        ...(organisationId && { organisation_id: organisationId }),
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    for (const membership of userMemberships) {
      const hasPermission = membership.role.permissions.some(
        (rolePerm) =>
          rolePerm.permission.resource === permission.resource &&
          rolePerm.permission.action === permission.action &&
          this.checkScope(rolePerm.permission.scope, permission.scope)
      );

      if (hasPermission) {
        return true;
      }
    }

    return false;
  }

  /**
   * Vérifie si un utilisateur a une permission dans un espace spécifique
   */
  async hasPermissionInSpace(
    userId: string,
    permission: PermissionCheck,
    space: 'club_360' | 'municipality',
    organisationId?: string
  ): Promise<boolean> {
    const userMemberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        status: 'active',
        role: {
          space: space,
        },
        ...(organisationId && { organisation_id: organisationId }),
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    for (const membership of userMemberships) {
      const hasPermission = membership.role.permissions.some(
        (rolePerm) =>
          rolePerm.permission.resource === permission.resource &&
          rolePerm.permission.action === permission.action &&
          this.checkScope(rolePerm.permission.scope, permission.scope)
      );

      if (hasPermission) {
        return true;
      }
    }

    return false;
  }

  /**
   * Récupère toutes les permissions d'un utilisateur
   */
  async getUserPermissions(userId: string, organisationId?: string): Promise<string[]> {
    const userMemberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        status: 'active',
        ...(organisationId && { organisation_id: organisationId }),
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();

    for (const membership of userMemberships) {
      for (const rolePerm of membership.role.permissions) {
        permissions.add(rolePerm.permission.slug);
      }
    }

    return Array.from(permissions);
  }

  /**
   * Récupère les rôles d'un utilisateur dans une organisation
   */
  async getUserRoles(
    userId: string,
    organisationId: string
  ): Promise<Array<{ role: string; space: string; type: string }>> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        status: 'active',
      },
      include: {
        role: true,
      },
    });

    return memberships.map((membership) => ({
      role: membership.role.name,
      space: membership.role.space,
      type: membership.role.type,
    }));
  }

  /**
   * Vérifie si un utilisateur est propriétaire d'une ressource
   */
  async isOwner(userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    switch (resourceType) {
      case 'event': {
        const event = await this.prisma.event.findUnique({
          where: { id: resourceId },
          select: { created_by_id: true },
        });
        return event?.created_by_id === userId;
      }

      case 'listing': {
        const listing = await this.prisma.listing.findUnique({
          where: { id: resourceId },
          select: { user_id: true },
        });
        return listing?.user_id === userId;
      }

      case 'private_course': {
        const course = await this.prisma.privateCourse.findUnique({
          where: { id: resourceId },
          select: { tutor_id: true, student_id: true },
        });
        return course?.tutor_id === userId || course?.student_id === userId;
      }

      default:
        return false;
    }
  }

  /**
   * Vérifie la portée d'une permission
   */
  private checkScope(permissionScope: string, requestedScope?: string): boolean {
    if (!requestedScope) return true;

    switch (permissionScope) {
      case 'global':
        return true;
      case 'organisation':
        return requestedScope === 'organisation' || requestedScope === 'own';
      case 'own':
        return requestedScope === 'own';
      default:
        return false;
    }
  }

  /**
   * Vérifie si un utilisateur peut accéder à une ressource avec ABAC
   */
  async canAccessResourceWithABAC(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    organisationId?: string,
    context?: Partial<ABACContext>
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 1. Vérifier les permissions RBAC de base
    const hasRBACPermission = await this.hasPermission(
      userId,
      {
        resource: resourceType,
        action: action,
        scope: 'organisation',
      },
      organisationId
    );

    if (!hasRBACPermission) {
      return { allowed: false, reason: 'Insufficient RBAC permissions' };
    }

    // 2. Vérifier les règles ABAC
    const abacContext = await this.abacService.getContext(
      userId,
      organisationId,
      resourceType,
      resourceId
    );

    const abacResult = await this.abacService.evaluateRules({
      ...abacContext,
      ...context,
    });

    if (!abacResult.allowed) {
      return {
        allowed: false,
        reason: `ABAC rules violated: ${abacResult.violatedRules.join(', ')}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Vérifie si un utilisateur peut accéder à une ressource
   */
  async canAccessResource(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    organisationId?: string
  ): Promise<boolean> {
    // Vérifier si l'utilisateur est propriétaire
    const isOwner = await this.isOwner(userId, resourceType, resourceId);

    if (isOwner) {
      return true;
    }

    // Vérifier les permissions
    const permission: PermissionCheck = {
      resource: resourceType,
      action: action,
      scope: 'organisation',
    };

    return this.hasPermission(userId, permission, organisationId);
  }
}
