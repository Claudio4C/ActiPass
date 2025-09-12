import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { filterXSS } from 'xss';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Protection XSS
    this.sanitizeInput(req.body);
    this.sanitizeInput(req.query);
    this.sanitizeInput(req.params);

    // 2. Headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 3. Validation de la taille du body
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB max
      return res.status(413).json({
        message: 'Payload trop volumineux',
        error: 'Payload Too Large',
        statusCode: 413,
      });
    }

    next();
  }

  private sanitizeInput(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          // Nettoyer les chaînes de caractères
          obj[key] = filterXSS(obj[key], {
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script'],
          });
        } else if (typeof obj[key] === 'object') {
          this.sanitizeInput(obj[key]);
        }
      }
    }
  }
}
