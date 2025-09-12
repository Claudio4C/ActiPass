import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService, PermissionCheck } from '../permissions.service';

interface PermissionRequirement extends PermissionCheck {
  space?: 'club_360' | 'municipality';
}

interface AuthenticatedUser {
  sub: string;
  email: string;
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Récupérer l'organisation depuis les paramètres ou le body
    const organisationId = this.getOrganisationId(request);

    // Vérifier chaque permission requise
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.hasPermission(
        user.sub,
        permission,
        organisationId
      );

      if (!hasPermission) {
        // Si une permission spécifique à un espace est requise, vérifier dans cet espace
        if (permission.space) {
          const hasPermissionInSpace = await this.permissionsService.hasPermissionInSpace(
            user.sub,
            permission,
            permission.space,
            organisationId
          );

          if (!hasPermissionInSpace) {
            throw new ForbiddenException(
              `Insufficient permissions. Required: ${permission.resource}:${permission.action} in ${permission.space} space`
            );
          }
        } else {
          throw new ForbiddenException(
            `Insufficient permissions. Required: ${permission.resource}:${permission.action}`
          );
        }
      }
    }

    return true;
  }

  private getOrganisationId(request: Request): string | undefined {
    // Essayer de récupérer l'organisation depuis différents endroits
    const params = request.params as Record<string, string>;
    const body = request.body as Record<string, unknown>;
    const query = request.query as Record<string, string>;

    return (
      params?.organisationId ||
      (typeof body?.organisation_id === 'string' ? body.organisation_id : undefined) ||
      query?.organisationId ||
      (request.headers['x-organisation-id'] as string)
    );
  }
}
