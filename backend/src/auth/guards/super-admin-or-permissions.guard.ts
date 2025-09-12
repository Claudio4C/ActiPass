import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { SUPER_ADMIN_OR_PERMISSIONS_KEY } from '../decorators/super-admin-or-permissions.decorator';
import { PermissionsService } from '../permissions.service';
import { SuperAdminService } from '../super-admin.service';

interface AuthenticatedUser {
  sub: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  is_super_admin?: boolean;
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class SuperAdminOrPermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private superAdminService: SuperAdminService,
    private permissionsService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionRequirement = this.reflector.getAllAndOverride<{
      resource: string;
      action: string;
      scope?: string;
    }>(SUPER_ADMIN_OR_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!permissionRequirement) {
      return true; // Pas de permission requise
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.sub) {
      return false;
    }

    const userId = user.sub;

    // 1. Vérifier si c'est un Super Admin
    const isSuperAdmin = await this.superAdminService.isSuperAdmin(userId);
    if (isSuperAdmin) {
      return true; // Super Admin a accès à tout
    }

    // 2. Sinon, vérifier les permissions normales
    return this.permissionsService.hasPermission(userId, {
      resource: permissionRequirement.resource,
      action: permissionRequirement.action,
      scope: (permissionRequirement.scope as 'own' | 'organisation' | 'global') || 'organisation',
    });
  }
}
