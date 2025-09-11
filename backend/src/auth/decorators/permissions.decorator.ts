import { SetMetadata } from '@nestjs/common';

export interface PermissionRequirement {
  resource: string;
  action: string;
  scope?: 'own' | 'organisation' | 'global';
  space?: 'club_360' | 'municipality';
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Décorateur pour définir les permissions requises pour un endpoint
 */
export const RequirePermissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Décorateur pour les permissions de lecture
 */
export const RequireRead = (
  resource: string,
  scope: 'own' | 'organisation' | 'global' = 'organisation'
) => RequirePermissions({ resource, action: 'read', scope });

/**
 * Décorateur pour les permissions d'écriture
 */
export const RequireWrite = (
  resource: string,
  scope: 'own' | 'organisation' | 'global' = 'organisation'
) =>
  RequirePermissions({ resource, action: 'create', scope }, { resource, action: 'update', scope });

/**
 * Décorateur pour les permissions de gestion
 */
export const RequireManage = (
  resource: string,
  scope: 'own' | 'organisation' | 'global' = 'organisation'
) => RequirePermissions({ resource, action: 'manage', scope });

/**
 * Décorateur pour les permissions de suppression
 */
export const RequireDelete = (
  resource: string,
  scope: 'own' | 'organisation' | 'global' = 'organisation'
) => RequirePermissions({ resource, action: 'delete', scope });

/**
 * Décorateurs spécifiques aux ressources
 */
export const RequireEventRead = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireRead('events', scope);

export const RequireEventWrite = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireWrite('events', scope);

export const RequireEventManage = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireManage('events', scope);

export const RequireMemberRead = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireRead('members', scope);

export const RequireMemberWrite = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireWrite('members', scope);

export const RequireMemberManage = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireManage('members', scope);

export const RequirePaymentRead = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireRead('payments', scope);

export const RequirePaymentManage = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireManage('payments', scope);

export const RequireReportRead = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireRead('reports', scope);

export const RequireReportManage = (scope: 'own' | 'organisation' | 'global' = 'organisation') =>
  RequireManage('reports', scope);

/**
 * Décorateurs pour l'espace municipal
 */
export const RequireMunicipalAccess = () =>
  RequirePermissions({
    resource: 'organisation',
    action: 'read',
    scope: 'global',
    space: 'municipality',
  });

export const RequireEquipmentManage = () =>
  RequirePermissions({
    resource: 'equipment',
    action: 'manage',
    scope: 'global',
    space: 'municipality',
  });

export const RequireGrantsManage = () =>
  RequirePermissions({
    resource: 'grants',
    action: 'manage',
    scope: 'global',
    space: 'municipality',
  });
