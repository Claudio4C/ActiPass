import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface AuditEvent {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  organisationId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enregistre un événement d'audit
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          user_id: event.userId,
          action: event.action,
          resource_type: event.resourceType,
          resource_id: event.resourceId,
          organisation_id: event.organisationId,
          details: event.details ? (event.details as Prisma.InputJsonValue) : undefined,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          timestamp: event.timestamp || new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Ne pas faire échouer la requête principale à cause d'un problème d'audit
    }
  }

  /**
   * Enregistre une action de création
   */
  async logCreate(
    userId: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string; organisationId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: 'create',
      resourceType,
      resourceId,
      organisationId: context?.organisationId,
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Enregistre une action de modification
   */
  async logUpdate(
    userId: string,
    resourceType: string,
    resourceId: string,
    beforeData: Record<string, unknown>,
    afterData: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string; organisationId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: 'update',
      resourceType,
      resourceId,
      organisationId: context?.organisationId,
      details: {
        before: beforeData,
        after: afterData,
        changes: this.getChanges(beforeData, afterData),
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Enregistre une action de suppression
   */
  async logDelete(
    userId: string,
    resourceType: string,
    resourceId: string,
    deletedData: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string; organisationId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: 'delete',
      resourceType,
      resourceId,
      organisationId: context?.organisationId,
      details: {
        deleted_data: deletedData,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Enregistre une action d'export
   */
  async logExport(
    userId: string,
    resourceType: string,
    exportType: string,
    recordCount: number,
    context?: { ipAddress?: string; userAgent?: string; organisationId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: 'export',
      resourceType,
      organisationId: context?.organisationId,
      details: {
        export_type: exportType,
        record_count: recordCount,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Enregistre une action d'approbation
   */
  async logApproval(
    userId: string,
    resourceType: string,
    resourceId: string,
    decision: 'approved' | 'rejected',
    reason?: string,
    context?: { ipAddress?: string; userAgent?: string; organisationId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: 'approve',
      resourceType,
      resourceId,
      organisationId: context?.organisationId,
      details: {
        decision,
        reason,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Enregistre une action de connexion
   */
  async logLogin(
    userId: string,
    success: boolean,
    context?: { ipAddress?: string; userAgent?: string; organisationId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: 'login',
      resourceType: 'auth',
      organisationId: context?.organisationId,
      details: {
        success,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Enregistre une action de changement de permissions
   */
  async logPermissionChange(
    userId: string,
    targetUserId: string,
    roleId: string,
    action: 'assign' | 'revoke',
    context?: { ipAddress?: string; userAgent?: string; organisationId?: string }
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: 'permission_change',
      resourceType: 'role',
      resourceId: roleId,
      organisationId: context?.organisationId,
      details: {
        target_user_id: targetUserId,
        action,
        role_id: roleId,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Récupère les logs d'audit pour un utilisateur
   */
  async getUserAuditLogs(
    userId: string,
    organisationId?: string,
    limit: number = 100,
    offset: number = 0
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        user_id: userId,
        ...(organisationId && { organisation_id: organisationId }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Récupère les logs d'audit pour une ressource
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        resource_type: resourceType,
        resource_id: resourceId,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Récupère les logs d'audit pour une organisation
   */
  async getOrganisationAuditLogs(organisationId: string, limit: number = 100, offset: number = 0) {
    return this.prisma.auditLog.findMany({
      where: {
        organisation_id: organisationId,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Calcule les différences entre deux objets
   */
  private getChanges(
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    for (const key in after) {
      if (before[key] !== after[key]) {
        changes[key] = {
          from: before[key],
          to: after[key],
        };
      }
    }

    return changes;
  }

  /**
   * Génère un rapport d'audit pour une période
   */
  async generateAuditReport(organisationId: string, startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organisation_id: organisationId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    // Grouper par action
    const actionSummary = logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Grouper par ressource
    const resourceSummary = logs.reduce(
      (acc, log) => {
        acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      period: { startDate, endDate },
      totalEvents: logs.length,
      actionSummary,
      resourceSummary,
      logs: logs.map((log) => ({
        id: log.id,
        user: log.user,
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        timestamp: log.timestamp,
        ipAddress: log.ip_address,
        details: log.details,
      })),
    };
  }
}
