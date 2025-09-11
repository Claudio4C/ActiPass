import { Controller, Get, Post, Put, Delete, UseGuards } from '@nestjs/common';

import {
  RequireEventRead,
  RequireEventWrite,
  RequireEventManage,
  RequireMemberRead,
  RequireMemberManage,
  RequirePaymentRead,
  RequireReportRead,
  RequireMunicipalAccess,
  RequireEquipmentManage,
  RequireRead,
  RequireManage,
} from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

/**
 * Exemple d'utilisation des permissions dans un contrôleur
 *
 * Ce fichier montre comment utiliser le système de permissions
 * avec les décorateurs et guards pour sécuriser les endpoints
 */

@Controller('events')
@UseGuards(PermissionsGuard)
export class EventsController {
  // ✅ Lecture des événements - accessible aux membres et plus
  @Get()
  @RequireEventRead('organisation')
  getEvents() {
    return { message: 'Liste des événements' };
  }

  // ✅ Création d'événements - accessible aux gestionnaires et propriétaires
  @Post()
  @RequireEventWrite('organisation')
  createEvent() {
    return { message: 'Événement créé' };
  }

  // ✅ Gestion complète des événements - accessible aux propriétaires uniquement
  @Put(':id')
  @RequireEventManage('organisation')
  updateEvent() {
    return { message: 'Événement modifié' };
  }

  @Delete(':id')
  @RequireEventManage('organisation')
  deleteEvent() {
    return { message: 'Événement supprimé' };
  }
}

@Controller('members')
@UseGuards(PermissionsGuard)
export class MembersController {
  // ✅ Lecture des membres - accessible aux coachs et plus
  @Get()
  @RequireMemberRead('organisation')
  getMembers() {
    return { message: 'Liste des membres' };
  }

  // ✅ Gestion des membres - accessible aux gestionnaires et propriétaires
  @Post()
  @RequireMemberManage('organisation')
  createMember() {
    return { message: 'Membre créé' };
  }

  @Put(':id')
  @RequireMemberManage('organisation')
  updateMember() {
    return { message: 'Membre modifié' };
  }
}

@Controller('payments')
@UseGuards(PermissionsGuard)
export class PaymentsController {
  // ✅ Lecture des paiements - accessible aux gestionnaires et propriétaires
  @Get()
  @RequirePaymentRead('organisation')
  getPayments() {
    return { message: 'Liste des paiements' };
  }
}

@Controller('reports')
@UseGuards(PermissionsGuard)
export class ReportsController {
  // ✅ Lecture des rapports - accessible aux gestionnaires et propriétaires
  @Get()
  @RequireReportRead('organisation')
  getReports() {
    return { message: 'Rapports disponibles' };
  }
}

/**
 * Contrôleur pour le Portail Municipal
 */
@Controller('municipal')
@UseGuards(PermissionsGuard)
export class MunicipalController {
  // ✅ Accès aux données agrégées - accessible aux utilisateurs municipaux
  @Get('organisations')
  @RequireMunicipalAccess()
  getOrganisations() {
    return { message: 'Liste des organisations de la ville' };
  }

  // ✅ Gestion des équipements - accessible aux gestionnaires d'équipements
  @Get('equipment')
  @RequireEquipmentManage()
  getEquipment() {
    return { message: 'Gestion des équipements municipaux' };
  }
}

/**
 * Exemples d'utilisation avancée avec permissions personnalisées
 */
@Controller('advanced')
@UseGuards(PermissionsGuard)
export class AdvancedController {
  // ✅ Permission personnalisée pour la lecture de ses propres réservations
  @Get('my-reservations')
  @RequireRead('reservations', 'own')
  getMyReservations() {
    return { message: 'Mes réservations' };
  }

  // ✅ Permission personnalisée pour la gestion globale
  @Get('admin-dashboard')
  @RequireManage('organisation', 'global')
  getAdminDashboard() {
    return { message: 'Tableau de bord administrateur' };
  }
}
