import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Guard personnalisé qui skip le throttling pour les routes Super Admin
 */
@Injectable()
export class SuperAdminThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Récupérer le nom du controller
    const controllerName = controller.name;

    // Skip throttling si c'est le SuperAdminController
    if (controllerName === 'SuperAdminController' || controllerName.includes('SuperAdmin')) {
      return true;
    }

    // Vérifier l'URL de plusieurs façons - méthode la plus fiable
    const url = request.url || request.path || request.originalUrl || '';
    const route = request.route?.path || '';
    const baseUrl = request.baseUrl || '';

    // Construire une chaîne complète pour vérifier
    const fullUrl = `${baseUrl}${url}${route}`.toLowerCase();

    // Skip throttling pour toutes les routes Super Admin
    if (fullUrl.includes('super-admin') || fullUrl.includes('superadmin')) {
      return true;
    }

    // Vérifier aussi le chemin de la route directement
    if (request.route && typeof request.route.path === 'string') {
      if (request.route.path.includes('super-admin')) {
        return true;
      }
    }

    // Vérifier si @SkipThrottle() est présent
    // Essayer plusieurs clés de métadonnées possibles
    const skipThrottle1 = this.reflector.getAllAndOverride<boolean>('skipThrottle', [
      handler,
      controller,
    ]);
    const skipThrottle2 = this.reflector.getAllAndOverride<boolean>('__skipThrottle__', [
      handler,
      controller,
    ]);

    if (skipThrottle1 || skipThrottle2) {
      return true;
    }

    // Sinon, appliquer le throttling normal
    return super.canActivate(context);
  }
}
