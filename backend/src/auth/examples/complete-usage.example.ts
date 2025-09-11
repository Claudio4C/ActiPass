import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  Injectable,
} from '@nestjs/common';

import { ABACService } from '../abac.service';
import { AuditService } from '../audit.service';
import {
  AuditCreate,
  AuditUpdate,
  AuditDelete,
  AuditRead,
  AuditExport,
  AuditApprove,
  AuditLogin,
  AuditPermissionChange,
} from '../decorators/audit.decorator';
import {
  RequireRead,
  RequireManage,
  RequireEventRead,
  RequireEventWrite,
  RequireEventManage,
  RequireMemberRead,
  RequireMemberManage,
  RequirePaymentRead,
  RequireReportRead,
  RequireMunicipalAccess,
  RequireEquipmentManage,
} from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AuditInterceptor } from '../interceptors/audit.interceptor';

/**
 * Exemple complet d'utilisation du système de rôles et permissions
 * avec RBAC, ABAC et audit automatique
 */

@Controller('events')
@UseGuards(PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class EventsController {
  // ✅ Lecture des événements - accessible aux membres et plus
  @Get()
  @RequireEventRead('organisation')
  @AuditRead('event')
  getEvents() {
    return { message: 'Liste des événements' };
  }

  // ✅ Création d'événements - accessible aux gestionnaires et propriétaires
  @Post()
  @RequireEventWrite('organisation')
  @AuditCreate('event')
  createEvent() {
    return { message: 'Événement créé' };
  }

  // ✅ Gestion complète des événements - accessible aux propriétaires uniquement
  @Put(':id')
  @RequireEventManage('organisation')
  @AuditUpdate('event')
  updateEvent() {
    return { message: 'Événement modifié' };
  }

  @Delete(':id')
  @RequireEventManage('organisation')
  @AuditDelete('event')
  deleteEvent() {
    return { message: 'Événement supprimé' };
  }
}

@Controller('members')
@UseGuards(PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class MembersController {
  // ✅ Lecture des membres - accessible aux coachs et plus
  @Get()
  @RequireMemberRead('organisation')
  @AuditRead('member')
  getMembers() {
    return { message: 'Liste des membres' };
  }

  // ✅ Gestion des membres - accessible aux gestionnaires et propriétaires
  @Post()
  @RequireMemberManage('organisation')
  @AuditCreate('member')
  createMember() {
    return { message: 'Membre créé' };
  }

  @Put(':id')
  @RequireMemberManage('organisation')
  @AuditUpdate('member')
  updateMember() {
    return { message: 'Membre modifié' };
  }
}

@Controller('payments')
@UseGuards(PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class PaymentsController {
  // ✅ Lecture des paiements - accessible aux trésoriers et plus
  @Get()
  @RequirePaymentRead('organisation')
  @AuditRead('payment')
  getPayments() {
    return { message: 'Liste des paiements' };
  }

  // ✅ Export des données financières - accessible aux trésoriers uniquement
  @Get('export')
  @RequirePaymentRead('organisation')
  @AuditExport('payment')
  exportPayments() {
    return { message: 'Export des paiements' };
  }
}

@Controller('reports')
@UseGuards(PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ReportsController {
  // ✅ Lecture des rapports - accessible aux gestionnaires et propriétaires
  @Get()
  @RequireReportRead('organisation')
  @AuditRead('report')
  getReports() {
    return { message: 'Rapports disponibles' };
  }

  // ✅ Export des rapports - accessible aux gestionnaires et propriétaires
  @Get('export')
  @RequireReportRead('organisation')
  @AuditExport('report')
  exportReports() {
    return { message: 'Export des rapports' };
  }
}

/**
 * Contrôleur pour le Portail Municipal
 */
@Controller('municipal')
@UseGuards(PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class MunicipalController {
  // ✅ Accès aux données agrégées - accessible aux utilisateurs municipaux
  @Get('organisations')
  @RequireMunicipalAccess()
  @AuditRead('organisation')
  getOrganisations() {
    return { message: 'Liste des organisations de la ville' };
  }

  // ✅ Gestion des équipements - accessible aux gestionnaires d'équipements
  @Get('equipment')
  @RequireEquipmentManage()
  @AuditRead('facility')
  getEquipment() {
    return { message: 'Gestion des équipements municipaux' };
  }

  // ✅ Instruction des subventions - accessible aux responsables finances
  @Post('subsidies/:id/review')
  @RequireMunicipalAccess()
  @AuditApprove('subsidy')
  reviewSubsidy() {
    return { message: 'Subvention instruite' };
  }
}

/**
 * Contrôleur d'authentification avec audit
 */
@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  @Post('login')
  @AuditLogin()
  login() {
    return { message: 'Connexion réussie' };
  }

  @Post('logout')
  @AuditLogin()
  logout() {
    return { message: 'Déconnexion réussie' };
  }
}

/**
 * Contrôleur de gestion des rôles avec audit
 */
@Controller('roles')
@UseGuards(PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class RolesController {
  @Post(':userId/assign')
  @RequireManage('role', 'organisation')
  @AuditPermissionChange()
  assignRole() {
    return { message: 'Rôle attribué' };
  }

  @Delete(':userId/revoke')
  @RequireManage('role', 'organisation')
  @AuditPermissionChange()
  revokeRole() {
    return { message: 'Rôle révoqué' };
  }
}

/**
 * Exemples d'utilisation avancée avec permissions personnalisées
 */
@Controller('advanced')
@UseGuards(PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class AdvancedController {
  // ✅ Permission personnalisée pour la lecture de ses propres réservations
  @Get('my-reservations')
  @RequireRead('reservations', 'own')
  @AuditRead('booking')
  getMyReservations() {
    return { message: 'Mes réservations' };
  }

  // ✅ Permission personnalisée pour la gestion globale
  @Get('admin-dashboard')
  @RequireManage('organisation', 'global')
  @AuditRead('report')
  getAdminDashboard() {
    return { message: 'Tableau de bord administrateur' };
  }

  // ✅ Gestion des présences - accessible aux coachs et bénévoles
  @Post('attendance')
  @RequireRead('attendance', 'organisation')
  @AuditCreate('attendance')
  markAttendance() {
    return { message: 'Présence enregistrée' };
  }

  // ✅ Gestion des documents - accessible aux secrétaires et plus
  @Post('documents/upload')
  @RequireRead('document', 'own')
  @AuditCreate('document')
  uploadDocument() {
    return { message: 'Document uploadé' };
  }

  // ✅ Communication - accessible aux coachs et gestionnaires
  @Post('messages')
  @RequireRead('comm', 'organisation')
  @AuditCreate('comm')
  sendMessage() {
    return { message: 'Message envoyé' };
  }
}

/**
 * Exemple d'utilisation du service de permissions dans un service métier
 */

import { PermissionsService } from '../permissions.service';

@Injectable()
export class BusinessService {
  constructor(
    private permissionsService: PermissionsService,
    private abacService: ABACService,
    private auditService: AuditService
  ) {}

  async processSensitiveOperation(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    organisationId?: string
  ) {
    // 1. Vérifier les permissions RBAC + ABAC
    const accessCheck = await this.permissionsService.canAccessResourceWithABAC(
      userId,
      resourceType,
      resourceId,
      action,
      organisationId
    );

    if (!accessCheck.allowed) {
      // Logger la tentative d'accès non autorisée
      await this.auditService.logEvent({
        userId,
        action: 'unauthorized_access_attempt',
        resourceType,
        resourceId,
        organisationId,
        details: {
          reason: accessCheck.reason,
          attempted_action: action,
        },
      });

      throw new Error(`Access denied: ${accessCheck.reason}`);
    }

    // 2. Exécuter l'opération
    const result = this.executeOperation(resourceType, resourceId, action);

    // 3. Logger l'opération réussie
    await this.auditService.logEvent({
      userId,
      action,
      resourceType,
      resourceId,
      organisationId,
      details: {
        success: true,
        result_summary: this.summarizeResult(result),
      },
    });

    return result;
  }

  private executeOperation(resourceType: string, resourceId: string, action: string) {
    // Logique métier ici
    return { success: true, resourceType, resourceId, action };
  }

  private summarizeResult(result: { resourceType: string; resourceId: string }): string {
    // Créer un résumé du résultat pour l'audit
    return `Operation completed on ${result.resourceType} ${result.resourceId}`;
  }
}
