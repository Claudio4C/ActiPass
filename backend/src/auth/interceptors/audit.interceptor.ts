import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditConfig } from '../decorators/audit.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

interface ResponseWithStatus extends Response {
  statusCode: number;
}

interface ErrorWithStatus extends Error {
  status?: number;
}

interface RequestWithNetwork {
  connection?: {
    remoteAddress?: string;
  };
  socket?: {
    remoteAddress?: string;
  };
  ip?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditConfig = this.reflector.get<AuditConfig>(AUDIT_KEY, context.getHandler());

    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<ResponseWithStatus>();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        if (auditConfig.logOnSuccess) {
          this.logAuditEvent(
            user,
            request,
            response,
            auditConfig,
            'success',
            data,
            Date.now() - startTime
          ).catch(console.error);
        }
      }),
      catchError(async (error: Error) => {
        if (auditConfig.logOnFailure) {
          await this.logAuditEvent(
            user,
            request,
            response,
            auditConfig,
            'failure',
            null,
            Date.now() - startTime,
            error
          );
        }
        throw error;
      })
    );
  }

  private async logAuditEvent(
    user: AuthenticatedUser,
    request: RequestWithUser,
    response: ResponseWithStatus,
    config: AuditConfig,
    status: 'success' | 'failure',
    data?: unknown,
    duration?: number,
    error?: Error
  ): Promise<void> {
    try {
      const resourceId = this.extractResourceId(request, config.resourceType);
      const organisationId = this.extractOrganisationId(request);

      const details: Record<string, unknown> = {
        status,
        duration,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ipAddress: this.getClientIp(request),
      };

      if (config.includeRequestBody && request.body) {
        details.requestBody = this.sanitizeRequestBody(request.body);
      }

      if (config.includeResponseBody && data) {
        details.responseBody = this.sanitizeResponseBody(data);
      }

      if (error) {
        details.error = {
          message: error.message,
          stack: error.stack,
          statusCode: (error as ErrorWithStatus).status || 500,
        };
      }

      await this.auditService.logEvent({
        userId: user.id,
        action: config.action,
        resourceType: config.resourceType,
        resourceId,
        organisationId,
        details,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
      // Ne pas faire échouer la requête principale à cause d'un problème d'audit
    }
  }

  private extractResourceId(request: RequestWithUser, resourceType: string): string | undefined {
    // Extraire l'ID de la ressource depuis les paramètres de la route
    const params = request.params as Record<string, string>;

    // Mapper les types de ressources aux paramètres de route
    const resourceIdMap: Record<string, string> = {
      event: 'id',
      member: 'id',
      payment: 'id',
      booking: 'id',
      case: 'id',
      document: 'id',
      subsidy: 'id',
      facility: 'id',
      convention: 'id',
      role: 'id',
      user: 'id',
    };

    const paramName = resourceIdMap[resourceType];
    return paramName ? params[paramName] : undefined;
  }

  private extractOrganisationId(request: RequestWithUser): string | undefined {
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

  private getClientIp(request: RequestWithUser): string {
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    const requestWithNetwork = request as RequestWithNetwork;
    return (
      forwardedFor?.split(',')[0] ||
      requestWithNetwork.connection?.remoteAddress ||
      requestWithNetwork.socket?.remoteAddress ||
      requestWithNetwork.ip ||
      'unknown'
    );
  }

  private sanitizeRequestBody(body: unknown): Record<string, unknown> {
    // Supprimer les données sensibles du body
    const sanitized = { ...(body as Record<string, unknown>) };

    // Supprimer les mots de passe et tokens
    delete sanitized.password;
    delete sanitized.passwordConfirm;
    delete sanitized.token;
    delete sanitized.refreshToken;

    return sanitized;
  }

  private sanitizeResponseBody(data: unknown): unknown {
    // Supprimer les données sensibles de la réponse
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...(data as Record<string, unknown>) };

      // Supprimer les données sensibles
      delete sanitized.password;
      delete sanitized.passwordHash;
      delete sanitized.token;
      delete sanitized.refreshToken;

      // Limiter la taille des données
      if (JSON.stringify(sanitized).length > 10000) {
        return {
          message: 'Response data too large for audit log',
          size: JSON.stringify(data).length,
        };
      }

      return sanitized;
    }

    return data;
  }
}
