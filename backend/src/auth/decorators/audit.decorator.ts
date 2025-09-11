import { SetMetadata } from '@nestjs/common';

export interface AuditConfig {
  action: string;
  resourceType: string;
  logOnSuccess?: boolean;
  logOnFailure?: boolean;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

export const AUDIT_KEY = 'audit';

/**
 * Décorateur pour activer l'audit automatique sur un endpoint
 */
export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_KEY, config);

/**
 * Décorateurs prédéfinis pour les actions courantes
 */
export const AuditCreate = (resourceType: string) =>
  Audit({
    action: 'create',
    resourceType,
    logOnSuccess: true,
    includeRequestBody: true,
  });

export const AuditUpdate = (resourceType: string) =>
  Audit({
    action: 'update',
    resourceType,
    logOnSuccess: true,
    includeRequestBody: true,
  });

export const AuditDelete = (resourceType: string) =>
  Audit({
    action: 'delete',
    resourceType,
    logOnSuccess: true,
    includeRequestBody: true,
  });

export const AuditRead = (resourceType: string) =>
  Audit({
    action: 'read',
    resourceType,
    logOnSuccess: false, // Ne pas logger les lectures normales
    logOnFailure: true,
  });

export const AuditExport = (resourceType: string) =>
  Audit({
    action: 'export',
    resourceType,
    logOnSuccess: true,
    includeResponseBody: true,
  });

export const AuditApprove = (resourceType: string) =>
  Audit({
    action: 'approve',
    resourceType,
    logOnSuccess: true,
    includeRequestBody: true,
  });

export const AuditLogin = () =>
  Audit({
    action: 'login',
    resourceType: 'auth',
    logOnSuccess: true,
    logOnFailure: true,
  });

export const AuditPermissionChange = () =>
  Audit({
    action: 'permission_change',
    resourceType: 'role',
    logOnSuccess: true,
    includeRequestBody: true,
  });
