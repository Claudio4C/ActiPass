import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly maxRequests = 100; // 100 requêtes
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  use(req: Request, res: Response, next: NextFunction) {
    const clientId = this.getClientId(req);
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Nettoyer les anciennes entrées
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < windowStart) {
        delete this.store[key];
      }
    });

    // Vérifier la limite
    if (!this.store[clientId]) {
      this.store[clientId] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
    } else if (this.store[clientId].resetTime < now) {
      this.store[clientId] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
    } else if (this.store[clientId].count >= this.maxRequests) {
      return res.status(429).json({
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        error: 'Too Many Requests',
        statusCode: 429,
        retryAfter: Math.ceil((this.store[clientId].resetTime - now) / 1000),
      });
    } else {
      this.store[clientId].count++;
    }

    // Ajouter les headers de rate limit
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', this.maxRequests - this.store[clientId].count);
    res.setHeader('X-RateLimit-Reset', new Date(this.store[clientId].resetTime).toISOString());

    next();
  }

  private getClientId(req: Request): string {
    // Utiliser l'IP + User-Agent pour identifier le client
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  }
}
