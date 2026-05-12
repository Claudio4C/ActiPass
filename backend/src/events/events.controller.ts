import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

import {
  RequireEventRead,
  RequireEventWrite,
  RequireEventManage,
} from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

import { CreateEventDto, UpdateEventDto, CancelEventDto } from './dto';
import { EventsService } from './events.service';

@Controller('organisations/:organisationId/events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Créer un événement
   * - Admin/Manager : création directe
   * - Coach : création avec requires_approval si pas dans ses créneaux
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireEventWrite('organisation')
  async createEvent(
    @Param('organisationId') organisationId: string,
    @Body() createEventDto: CreateEventDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.createEvent(organisationId, userId, createEventDto);
  }

  /**
   * Lister les événements d'une organisation
   * Les membres en attente peuvent voir uniquement les événements publiés
   * Note: Pas de vérification de permission ici, le service gère l'accès
   */
  @Get()
  @UseGuards(JwtAuthGuard) // Seulement l'authentification, pas de vérification de permissions
  async getOrganisationEvents(
    @Param('organisationId') organisationId: string,
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('event_type') event_type?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.getOrganisationEvents(organisationId, userId, {
      ...(status && { status: status as 'draft' | 'published' | 'cancelled' }),
      ...(event_type && {
        event_type: event_type as 'training' | 'match' | 'meeting' | 'workshop' | 'other',
      }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
    });
  }

  /**
   * Obtenir un événement par ID
   */
  @Get(':eventId')
  @RequireEventRead('organisation')
  async getEventById(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.getEventById(eventId, userId);
  }

  /**
   * Modifier un événement
   * - Admin/Manager : modification directe
   * - Coach : modification de ses séances (si pas de chevauchement) → validation admin requise
   */
  @Put(':eventId')
  @RequireEventWrite('organisation')
  async updateEvent(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.updateEvent(eventId, organisationId, userId, updateEventDto);
  }

  /**
   * Annuler un événement
   * - Coach : peut annuler ses séances
   * - Admin : peut annuler tout événement
   */
  @Post(':eventId/cancel')
  @RequireEventWrite('organisation')
  async cancelEvent(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Body() cancelEventDto: CancelEventDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.cancelEvent(eventId, organisationId, userId, cancelEventDto);
  }

  /**
   * Supprimer un événement (soft delete)
   * - Seulement Admin/Owner
   */
  @Delete(':eventId')
  @RequireEventManage('organisation')
  async deleteEvent(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.deleteEvent(eventId, organisationId, userId);
  }

  /**
   * Gérer la capacité et liste d'attente
   * - Coach : consultation + gestion liste (pas modification capacité sauf délégation)
   * - Admin : définit capacité + règles
   */
  @Get(':eventId/waitlist')
  @RequireEventRead('organisation')
  async getEventWaitlist(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.getEventWaitlist(eventId, organisationId, userId);
  }

  /**
   * Ajouter/retirer manuellement de la liste d'attente (Coach avec délégation)
   */
  @Post(':eventId/waitlist/:action')
  @RequireEventWrite('organisation')
  async manageWaitlist(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Param('action') action: 'add' | 'remove',
    @Body() body: { membershipId: string; justification?: string },
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    return this.eventsService.manageWaitlist(
      eventId,
      organisationId,
      userId,
      action,
      body.membershipId,
      body.justification
    );
  }

  /**
   * S'inscrire à un événement (pour les membres)
   * - Gère automatiquement la capacité et la liste d'attente
   * - Crée une réservation avec statut confirmed ou pending selon la disponibilité
   */
  @Post(':eventId/register')
  @HttpCode(HttpStatus.CREATED)
  @RequireEventRead('organisation')
  async registerToEvent(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) { throw new Error('Utilisateur non authentifié'); }
    return this.eventsService.registerToEvent(eventId, organisationId, userId);
  }

  @Delete(':eventId/register')
  @HttpCode(HttpStatus.OK)
  @RequireEventRead('organisation')
  async unregisterFromEvent(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) { throw new Error('Utilisateur non authentifié'); }
    return this.eventsService.unregisterFromEvent(eventId, organisationId, userId);
  }
}
