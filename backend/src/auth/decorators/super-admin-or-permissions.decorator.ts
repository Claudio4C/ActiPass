import { SetMetadata } from '@nestjs/common';

export const SUPER_ADMIN_OR_PERMISSIONS_KEY = 'super_admin_or_permissions';

/**
 * Décorateur qui permet l'accès aux Super Admins OU aux utilisateurs avec les permissions spécifiées
 */
export const SuperAdminOrPermissions = (resource: string, action: string, scope?: string) =>
  SetMetadata(SUPER_ADMIN_OR_PERMISSIONS_KEY, { resource, action, scope });
