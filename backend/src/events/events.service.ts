import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventType, EventStatus } from '../generated/prisma/client';

import { PermissionsService } from '../auth/permissions.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateEventDto, UpdateEventDto, CancelEventDto } from './dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService
  ) {}

  /**
   * Créer un événement
   * - Admin/Manager : création directe
   * - Coach : création avec requires_approval = true si pas dans ses créneaux
   */
  async createEvent(organisationId: string, userId: string, createEventDto: CreateEventDto) {
    // Vérifier que l'utilisateur est membre de l'organisation
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const userRole = membership.role.type;
    const isCoach = userRole === 'coach';

    // Vérifier les permissions
    if (isCoach && !createEventDto.requires_approval) {
      // Coach peut créer des créneaux privés directement
      if (createEventDto.visibility !== 'private') {
        throw new ForbiddenException(
          'Les coachs ne peuvent créer que des créneaux privés directement'
        );
      }
    }

    // Si coach et pas privé, mettre en attente de validation
    const status =
      isCoach && createEventDto.visibility !== 'private' && createEventDto.requires_approval
        ? 'draft' // En attente de validation par admin
        : createEventDto.status || 'published';

    const event = await this.prisma.event.create({
      data: {
        organisation_id: organisationId,
        title: createEventDto.title,
        description: createEventDto.description,
        event_type: createEventDto.event_type,
        start_time: new Date(createEventDto.start_time),
        end_time: new Date(createEventDto.end_time),
        location: createEventDto.location,
        visibility: createEventDto.visibility,
        capacity: createEventDto.capacity,
        registration_required: createEventDto.registration_required ?? false,
        price: createEventDto.price ?? 0,
        is_recurring: createEventDto.is_recurring ?? false,
        recurrence_pattern: createEventDto.recurrence_pattern,
        status: status,
        cover_url: createEventDto.cover_url,
        created_by_id: userId,
        linked_listing_id: createEventDto.linked_listing_id,
        ...(createEventDto.category_ids && {
          EventCategory: {
            create: createEventDto.category_ids.map((catId) => ({
              category_id: catId,
            })),
          },
        }),
      },
      include: {
        created_by: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        EventCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    // Si récurrent, créer les occurrences
    if (createEventDto.is_recurring && createEventDto.recurrence_pattern) {
      this.createRecurringOccurrences(event.id, createEventDto.recurrence_pattern);
    }

    return event;
  }

  /**
   * Lister les événements d'une organisation
   */
  async getOrganisationEvents(
    organisationId: string,
    userId: string,
    filters?: {
      status?: EventStatus;
      event_type?: EventType;
      start_date?: string;
      end_date?: string;
    }
  ) {
    // Vérifier que l'utilisateur est membre (même en attente)
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    // Si le membership est en attente, on ne peut voir que les événements publiés
    const isPending = membership.status === 'pending';
    if (isPending && filters?.status && filters.status !== 'published') {
      throw new ForbiddenException(
        'Votre adhésion est en attente. Vous ne pouvez voir que les événements publiés.'
      );
    }

    const events = await this.prisma.event.findMany({
      where: {
        organisation_id: organisationId,
        deleted_at: null,
        // Si le membership est en attente, on ne peut voir que les événements publiés
        ...(isPending ? { status: 'published' } : filters?.status && { status: filters.status }),
        ...(filters?.event_type && { event_type: filters.event_type }),
        ...(filters?.start_date && {
          start_time: {
            gte: new Date(filters.start_date),
          },
        }),
        ...(filters?.end_date && {
          end_time: {
            lte: new Date(filters.end_date),
          },
        }),
      },
      include: {
        created_by: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
        EventCategory: {
          include: {
            category: true,
          },
        },
        Reservation: {
          where: {
            membership_id: membership.id,
            deleted_at: null,
          },
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            Reservation: {
              where: {
                status: {
                  in: ['confirmed', 'pending'],
                },
                deleted_at: null,
              },
            },
          },
        },
      },
      orderBy: {
        start_time: 'asc',
      },
    });

    return events.map((event) => ({
      ...event,
      current_registrations: event._count.Reservation,
      available_spots: event.capacity ? event.capacity - event._count.Reservation : null,
      myReservation: event.Reservation.length > 0 ? event.Reservation[0] : null,
    }));
  }

  /**
   * Obtenir un événement par ID
   */
  async getEventById(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        created_by: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        EventCategory: {
          include: {
            category: true,
          },
        },
        Reservation: {
          where: {
            deleted_at: null,
          },
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            Reservation: {
              where: {
                status: {
                  in: ['confirmed', 'pending'],
                },
                deleted_at: null,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Événement non trouvé');
    }

    // Vérifier que l'utilisateur est membre de l'organisation
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: event.organisation_id,
        left_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    return {
      ...event,
      current_registrations: event._count.Reservation,
      available_spots: event.capacity ? event.capacity - event._count.Reservation : null,
    };
  }

  /**
   * Modifier un événement
   * - Admin/Manager : modification directe
   * - Coach : modification de ses séances (si pas de chevauchement) → validation admin requise
   */
  async updateEvent(
    eventId: string,
    organisationId: string,
    userId: string,
    updateEventDto: UpdateEventDto
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }

    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const userRole = membership.role.type;
    const isCoach = userRole === 'coach';

    // Coach ne peut modifier que ses propres événements
    if (isCoach && event.created_by_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres événements');
    }

    // Vérifier les chevauchements si modification d'horaire
    if (updateEventDto.start_time || updateEventDto.end_time) {
      const hasConflict = await this.checkTimeConflict(
        organisationId,
        eventId,
        updateEventDto.start_time || event.start_time.toISOString(),
        updateEventDto.end_time || event.end_time.toISOString()
      );

      if (hasConflict && isCoach) {
        // Coach : nécessite validation admin
        // Pour l'instant, on bloque si conflit
        throw new BadRequestException(
          'Chevauchement détecté. La modification nécessite une validation admin.'
        );
      }
    }

    // Si série récurrente et apply_to_all_occurrences
    if (event.is_recurring && updateEventDto.apply_to_all_occurrences) {
      // TODO: Mettre à jour toutes les occurrences de la série
      // Pour l'instant, on met à jour seulement l'événement principal
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(updateEventDto.title && { title: updateEventDto.title }),
        ...(updateEventDto.description !== undefined && {
          description: updateEventDto.description,
        }),
        ...(updateEventDto.event_type && { event_type: updateEventDto.event_type }),
        ...(updateEventDto.start_time && { start_time: new Date(updateEventDto.start_time) }),
        ...(updateEventDto.end_time && { end_time: new Date(updateEventDto.end_time) }),
        ...(updateEventDto.location !== undefined && { location: updateEventDto.location }),
        ...(updateEventDto.visibility && { visibility: updateEventDto.visibility }),
        ...(updateEventDto.capacity !== undefined && { capacity: updateEventDto.capacity }),
        ...(updateEventDto.registration_required !== undefined && {
          registration_required: updateEventDto.registration_required,
        }),
        ...(updateEventDto.price !== undefined && { price: updateEventDto.price }),
        ...(updateEventDto.status && { status: updateEventDto.status }),
        ...(updateEventDto.cover_url !== undefined && { cover_url: updateEventDto.cover_url }),
      },
      include: {
        created_by: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
        EventCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    return updatedEvent;
  }

  /**
   * Annuler un événement
   * - Coach : peut annuler ses séances
   * - Admin : peut annuler tout événement
   * - Remboursement automatique si configuré
   */
  async cancelEvent(
    eventId: string,
    organisationId: string,
    userId: string,
    cancelEventDto: CancelEventDto
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        Reservation: {
          where: {
            status: {
              in: ['confirmed', 'pending'],
            },
            deleted_at: null,
          },
          include: {
            membership: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }

    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const userRole = membership.role.type;
    const isCoach = userRole === 'coach';

    // Coach ne peut annuler que ses propres événements
    if (isCoach && event.created_by_id !== userId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos propres événements');
    }

    // Annuler l'événement
    const cancelledEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'cancelled',
      },
    });

    // Annuler toutes les réservations
    await this.prisma.reservation.updateMany({
      where: {
        event_id: eventId,
        status: {
          in: ['confirmed', 'pending'],
        },
        deleted_at: null,
      },
      data: {
        status: 'cancelled',
      },
    });

    // Remboursement automatique si configuré
    if (cancelEventDto.refund_automatically) {
      // TODO: Implémenter le remboursement automatique
      // Pour chaque réservation avec paiement, créer un crédit ou rembourser
      console.log('Remboursement automatique à implémenter');
    }

    // Notifications (à implémenter avec le service email)
    if (cancelEventDto.notify_participants !== false) {
      // TODO: Envoyer des notifications aux participants
      console.log('Notifications à implémenter');
    }

    return {
      ...cancelledEvent,
      message: 'Événement annulé avec succès',
      cancelled_reservations: event.Reservation.length,
    };
  }

  /**
   * Supprimer un événement (soft delete)
   */
  async deleteEvent(eventId: string, organisationId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }

    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");
    }

    // Vérifier les permissions (seulement admin/owner)
    const canDelete = await this.permissionsService.hasPermission(
      userId,
      {
        resource: 'events',
        action: 'delete',
        scope: 'organisation',
      },
      organisationId
    );

    if (!canDelete) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer cet événement');
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        deleted_at: new Date(),
      },
    });

    return { message: 'Événement supprimé avec succès' };
  }

  /**
   * Gérer la capacité et liste d'attente
   */
  async getEventWaitlist(eventId: string, organisationId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }

    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");
    }

    // Vérifier les permissions
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const userRole = membership.role.type;
    const canManage = ['club_owner', 'club_manager'].includes(userRole);
    const isCoach = userRole === 'coach';

    // Coach peut consulter mais pas modifier la capacité
    if (!canManage && !isCoach) {
      throw new ForbiddenException("Vous ne pouvez pas consulter la liste d'attente");
    }

    // Récupérer les réservations en attente (liste d'attente)
    const waitlist = await this.prisma.reservation.findMany({
      where: {
        event_id: eventId,
        status: 'pending',
        deleted_at: null,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'asc', // Premier arrivé, premier servi
      },
    });

    const confirmed = await this.prisma.reservation.findMany({
      where: {
        event_id: eventId,
        status: 'confirmed',
        deleted_at: null,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      event: {
        id: event.id,
        title: event.title,
        capacity: event.capacity,
        current_registrations: confirmed.length,
        available_spots: event.capacity ? event.capacity - confirmed.length : null,
      },
      confirmed,
      waitlist,
      can_manage_capacity: canManage,
    };
  }

  /**
   * Ajouter/retirer manuellement de la liste d'attente (Coach avec délégation)
   */
  async manageWaitlist(
    eventId: string,
    organisationId: string,
    userId: string,
    action: 'add' | 'remove',
    membershipId: string,
    justification?: string
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
      },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const userRole = membership.role.type;
    const isCoach = userRole === 'coach';

    // Coach peut gérer la liste d'attente de ses événements
    if (isCoach && event.created_by_id !== userId) {
      throw new ForbiddenException(
        "Vous ne pouvez gérer que la liste d'attente de vos propres événements"
      );
    }

    if (action === 'add') {
      // Ajouter à la liste d'attente
      await this.prisma.reservation.create({
        data: {
          event_id: eventId,
          membership_id: membershipId,
          status: 'pending',
          note: justification,
        },
      });
    } else {
      // Retirer de la liste d'attente
      await this.prisma.reservation.updateMany({
        where: {
          event_id: eventId,
          membership_id: membershipId,
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });
    }

    return { message: `Membre ${action === 'add' ? 'ajouté à' : 'retiré de'} la liste d'attente` };
  }

  /**
   * S'inscrire à un événement (pour les membres)
   * - Gère automatiquement la capacité et la liste d'attente
   * - Crée une réservation avec statut confirmed ou pending selon la disponibilité
   */
  async registerToEvent(eventId: string, organisationId: string, userId: string) {
    // Vérifier que l'événement existe
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        Reservation: {
          where: {
            deleted_at: null,
            status: {
              in: ['confirmed', 'pending'],
            },
          },
        },
      },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }

    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");
    }

    if (event.status === 'cancelled') {
      throw new BadRequestException('Cet événement a été annulé');
    }

    if (event.status === 'draft') {
      throw new BadRequestException("Cet événement n'est pas encore publié");
    }

    // Vérifier que l'utilisateur est membre de l'organisation
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        left_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        event_id: eventId,
        membership_id: membership.id,
        deleted_at: null,
        status: {
          in: ['confirmed', 'pending'],
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('Vous êtes déjà inscrit à cet événement');
    }

    // Compter les réservations confirmées
    const confirmedCount = event.Reservation.filter((r) => r.status === 'confirmed').length;

    // Déterminer le statut de la réservation
    let reservationStatus: 'confirmed' | 'pending' = 'confirmed';

    // Si l'événement a une capacité limitée
    if (event.capacity && event.capacity > 0) {
      if (confirmedCount >= event.capacity) {
        // Capacité atteinte, mettre en liste d'attente
        reservationStatus = 'pending';
      }
    }

    // Créer la réservation
    const reservation = await this.prisma.reservation.create({
      data: {
        event_id: eventId,
        membership_id: membership.id,
        status: reservationStatus,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            start_time: true,
            end_time: true,
            capacity: true,
          },
        },
      },
    });

    return {
      message:
        reservationStatus === 'confirmed'
          ? 'Inscription confirmée'
          : "Vous êtes sur la liste d'attente",
      reservation: {
        id: reservation.id,
        status: reservation.status,
        event: reservation.event,
        user: reservation.membership.user,
      },
    };
  }

  /**
   * Vérifier les conflits d'horaire
   */
  private async checkTimeConflict(
    organisationId: string,
    excludeEventId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflictingEvents = await this.prisma.event.findFirst({
      where: {
        organisation_id: organisationId,
        id: { not: excludeEventId },
        deleted_at: null,
        status: { not: 'cancelled' },
        OR: [
          {
            // L'événement commence pendant un autre
            start_time: { lte: start },
            end_time: { gte: start },
          },
          {
            // L'événement se termine pendant un autre
            start_time: { lte: end },
            end_time: { gte: end },
          },
          {
            // L'événement englobe un autre
            start_time: { gte: start },
            end_time: { lte: end },
          },
        ],
      },
    });

    return !!conflictingEvents;
  }

  /**
   * Créer les occurrences récurrentes
   * @param _parentEventId - ID de l'événement parent (sera utilisé lors de l'implémentation)
   * @param _recurrencePattern - Pattern de récurrence JSON (sera utilisé lors de l'implémentation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private createRecurringOccurrences(_parentEventId: string, _recurrencePattern: string): void {
    // TODO: Implémenter la création des occurrences récurrentes
    // Parser le pattern JSON et créer les événements
    console.log('Création des occurrences récurrentes à implémenter');
  }
}
