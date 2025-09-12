import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    // Log de la requête entrante
    this.logger.log(`${method} ${url} - ${ip} - ${userAgent}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log de la réponse
        this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms - ${ip}`);

        // Log des erreurs de performance
        if (duration > 5000) {
          this.logger.warn(`Slow request: ${method} ${url} - ${duration}ms`);
        }
      }),
      catchError((error: Error & { status?: number }) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log des erreurs
        this.logger.error(
          `${method} ${url} ${statusCode} - ${duration}ms - ${ip} - ${error.message}`
        );

        return throwError(() => error);
      })
    );
  }
}
