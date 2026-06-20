import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType, EventStatus } from '../generated/prisma/client';

import { PermissionsService } from '../auth/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

import { CreateEventDto, UpdateEventDto, CancelEventDto } from './dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService
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
        cancellation_deadline_hours: createEventDto.cancellation_deadline_hours ?? null,
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

    if (createEventDto.is_recurring && createEventDto.recurrence_pattern) {
      await this.createRecurringOccurrences(event.id, createEventDto.recurrence_pattern);
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
        deleted_at: null,
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

    // Tous les IDs membership de l'utilisateur dans cette org (historiques inclus) :
    // une réservation peut avoir été créée avec un membership antérieur (réinscription,
    // soft-delete puis réactivation), findFirst seul ne suffit pas à les couvrir tous.
    const allMembershipIds = (
      await this.prisma.membership.findMany({
        where: { user_id: userId, organisation_id: organisationId },
        select: { id: true },
      })
    ).map((m) => m.id);

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
      omit: {
        attendance_checkin_token: true,
        attendance_checkin_token_expires_at: true,
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
            membership_id: { in: allMembershipIds },
            deleted_at: null,
          },
          select: {
            id: true,
            status: true,
            created_at: true,
          },
        },
        _count: {
          select: {
            Reservation: {
              where: {
                status: 'confirmed',
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

    // Compute waitlist positions for pending reservations in parallel
    const pendingItems = events
      .map(ev => {
        const myRsv = ev.Reservation.find(r => r.status !== 'cancelled');
        return myRsv?.status === 'pending' ? { eventId: ev.id, rsvId: myRsv.id, createdAt: myRsv.created_at } : null;
      })
      .filter(Boolean) as { eventId: string; rsvId: string; createdAt: Date }[];

    const positionMap = new Map<string, number>();
    if (pendingItems.length > 0) {
      await Promise.all(pendingItems.map(async ({ eventId, createdAt }) => {
        const countBefore = await this.prisma.reservation.count({
          where: { event_id: eventId, status: 'pending', deleted_at: null, created_at: { lt: createdAt } },
        });
        positionMap.set(eventId, countBefore + 1);
      }));
    }

    return events.map((event) => {
      const myRsv = event.Reservation.find((r) => r.status !== 'cancelled') ?? null;
      return {
        ...event,
        current_registrations: event._count.Reservation,
        available_spots: event.capacity ? event.capacity - event._count.Reservation : null,
        myReservation: myRsv
          ? {
              id: myRsv.id,
              status: myRsv.status,
              waitlist_position: myRsv.status === 'pending' ? (positionMap.get(event.id) ?? null) : null,
            }
          : null,
      };
    });
  }

  /**
   * Obtenir un événement par ID
   */
  async getEventById(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      omit: {
        attendance_checkin_token: true,
        attendance_checkin_token_expires_at: true,
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

    // BUG 1 — utilise tous les membership IDs (multi-membership / réinscription)
    const allMembershipIds = (
      await this.prisma.membership.findMany({
        where: { user_id: userId, organisation_id: event.organisation_id },
        select: { id: true },
      })
    ).map((m) => m.id);

    const myReservation = event.Reservation.find(
      (r) => allMembershipIds.includes(r.membership_id) && r.status !== 'cancelled',
    ) ?? null;

    const confirmedCount = event.Reservation.filter((r) => r.status === 'confirmed').length;

    // Compute waitlist position if member is pending
    let waitlistPosition: number | null = null;
    if (myReservation?.status === 'pending') {
      const sortedPending = event.Reservation
        .filter(r => r.status === 'pending')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const idx = sortedPending.findIndex(r => r.id === myReservation.id);
      waitlistPosition = idx >= 0 ? idx + 1 : null;
    }

    return {
      ...event,
      current_registrations: confirmedCount,
      available_spots: event.capacity ? event.capacity - confirmedCount : null,
      myReservation: myReservation
        ? { id: myReservation.id, status: myReservation.status, waitlist_position: waitlistPosition }
        : null,
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
      omit: {
        attendance_checkin_token: true,
        attendance_checkin_token_expires_at: true,
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

    // Block capacity reduction below current confirmed count
    if (updateEventDto.capacity !== undefined && updateEventDto.capacity !== null) {
      const confirmedCount = await this.prisma.reservation.count({
        where: { event_id: eventId, status: 'confirmed', deleted_at: null },
      });
      if (updateEventDto.capacity < confirmedCount) {
        throw new BadRequestException(
          `La capacité (${updateEventDto.capacity}) ne peut pas être inférieure au nombre d'inscrits confirmés (${confirmedCount}).`,
        );
      }
    }

    const sharedData = {
      ...(updateEventDto.title && { title: updateEventDto.title }),
      ...(updateEventDto.description !== undefined && { description: updateEventDto.description }),
      ...(updateEventDto.event_type && { event_type: updateEventDto.event_type }),
      ...(updateEventDto.location !== undefined && { location: updateEventDto.location }),
      ...(updateEventDto.visibility && { visibility: updateEventDto.visibility }),
      ...(updateEventDto.capacity !== undefined && { capacity: updateEventDto.capacity }),
      ...(updateEventDto.registration_required !== undefined && { registration_required: updateEventDto.registration_required }),
      ...(updateEventDto.price !== undefined && { price: updateEventDto.price }),
      ...(updateEventDto.cancellation_deadline_hours !== undefined && { cancellation_deadline_hours: updateEventDto.cancellation_deadline_hours }),
      ...(updateEventDto.status && { status: updateEventDto.status }),
    };

    if (updateEventDto.apply_to_all_occurrences) {
      const parentId = event.parent_event_id ?? eventId;
      await this.prisma.event.updateMany({
        where: { parent_event_id: parentId, status: { not: 'cancelled' }, deleted_at: null },
        data: sharedData,
      });
      await this.prisma.event.update({ where: { id: parentId }, data: sharedData });
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...sharedData,
        ...(updateEventDto.event_type && { event_type: updateEventDto.event_type }),
        ...(updateEventDto.start_time && { start_time: new Date(updateEventDto.start_time) }),
        ...(updateEventDto.end_time && { end_time: new Date(updateEventDto.end_time) }),
        ...(updateEventDto.visibility && { visibility: updateEventDto.visibility }),
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

    // Remboursement automatique des paiements event
    if (cancelEventDto.refund_automatically) {
      await this.refundPaidEventPayments([eventId], organisationId)
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
  async deleteEvent(eventId: string, organisationId: string, userId: string, deleteSeries = false) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      omit: {
        attendance_checkin_token: true,
        attendance_checkin_token_expires_at: true,
      },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }

    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");
    }

    const canDelete = await this.permissionsService.hasPermission(
      userId,
      { resource: 'events', action: 'delete', scope: 'organisation' },
      organisationId,
    );

    if (!canDelete) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer cet événement');
    }

    const now = new Date();

    if (deleteSeries) {
      const parentId = event.parent_event_id ?? eventId;
      // Récupère tous les IDs de la série pour remboursement
      const seriesEvents = await this.prisma.event.findMany({
        where: {
          OR: [{ id: parentId }, { parent_event_id: parentId }],
          organisation_id: organisationId,
          deleted_at: null,
        },
        select: { id: true },
      })
      await this.refundPaidEventPayments(seriesEvents.map(e => e.id), organisationId)

      const deleted = await this.prisma.event.updateMany({
        where: {
          OR: [
            { id: parentId },
            { parent_event_id: parentId },
          ],
          organisation_id: organisationId,
          deleted_at: null,
        },
        data: { deleted_at: now },
      });
      return { message: `Série supprimée (${deleted.count} événement${deleted.count > 1 ? 's' : ''})` };
    }

    // Rembourse les paiements liés avant suppression
    await this.refundPaidEventPayments([eventId], organisationId)

    await this.prisma.event.update({
      where: { id: eventId },
      data: { deleted_at: now },
    });

    return { message: 'Événement supprimé avec succès' };
  }

  /**
   * Gérer la capacité et liste d'attente
   */
  async getEventWaitlist(eventId: string, organisationId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      omit: {
        attendance_checkin_token: true,
        attendance_checkin_token_expires_at: true,
      },
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
    action: 'add' | 'remove' | 'promote',
    membershipId?: string,
    justification?: string,
    reservationId?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      omit: {
        attendance_checkin_token: true,
        attendance_checkin_token_expires_at: true,
      },
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

    if (action === 'promote') {
      if (!reservationId) {
        throw new BadRequestException('reservationId requis pour promouvoir');
      }
      // Vérifier la capacité avant de promouvoir
      if (event.capacity) {
        const confirmedCount = await this.prisma.reservation.count({
          where: { event_id: eventId, status: 'confirmed', deleted_at: null },
        });
        if (confirmedCount >= event.capacity) {
          throw new BadRequestException(
            `Capacité maximale atteinte (${event.capacity} place${event.capacity > 1 ? 's' : ''}). Libérez une place avant de promouvoir.`,
          );
        }
      }
      const reservation = await this.prisma.reservation.findFirst({
        where: { id: reservationId, event_id: eventId, status: 'pending', deleted_at: null },
      });
      if (!reservation) {
        throw new NotFoundException('Réservation en attente introuvable');
      }
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'confirmed' },
      });
      return { message: 'Membre promu avec succès' };
    }

    if (action === 'add') {
      if (!membershipId) throw new BadRequestException('membershipId requis');
      await this.prisma.reservation.create({
        data: {
          event_id: eventId,
          membership_id: membershipId,
          status: 'pending',
          note: justification,
        },
      });
    } else {
      if (!membershipId) throw new BadRequestException('membershipId requis');
      await this.prisma.reservation.updateMany({
        where: {
          event_id: eventId,
          membership_id: membershipId,
          status: 'pending',
        },
        data: { status: 'cancelled' },
      });
    }

    return { message: `Membre ${action === 'add' ? 'ajouté à' : 'retiré de'} la liste d'attente` };
  }

  /**
   * Annuler une réservation spécifique (admin/manager uniquement)
   */
  async cancelReservation(eventId: string, reservationId: string, organisationId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.deleted_at) throw new NotFoundException('Événement non trouvé');
    if (event.organisation_id !== organisationId) throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");

    const membership = await this.prisma.membership.findFirst({
      where: { user_id: userId, organisation_id: organisationId, left_at: null },
      include: { role: true },
    });
    if (!membership) throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    if (!['club_owner', 'club_manager'].includes(membership.role.type)) {
      throw new ForbiddenException('Seuls les admins peuvent annuler des réservations');
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, event_id: eventId, deleted_at: null },
      select: { id: true, status: true, payment_id: true },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');

    // Remboursement si l'event est payant et le paiement est confirmé
    if (event.price > 0 && reservation.payment_id) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: reservation.payment_id },
        select: { id: true, status: true, stripe_session_id: true, stripe_payment_intent_id: true },
      })
      if (payment?.status === 'paid') {
        const org = await this.prisma.organisation.findUnique({
          where: { id: organisationId },
          select: { stripe_account_id: true },
        })
        if (org?.stripe_account_id) {
          await this.issueRefundForPayment(payment, org.stripe_account_id, eventId)
        }
      }
    }

    const wasConfirmed = reservation.status === 'confirmed';

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'cancelled' },
    });

    // BUG 2+3 — auto-promotion du suivant, seulement si event gratuit et place confirmée libérée
    if (wasConfirmed && event.price === 0) {
      const nextPending = await this.prisma.reservation.findFirst({
        where: { event_id: eventId, status: 'pending', deleted_at: null },
        orderBy: { created_at: 'asc' },
      });
      if (nextPending) {
        await this.prisma.reservation.update({
          where: { id: nextPending.id },
          data: { status: 'confirmed' },
        });
        console.log(`[Waitlist] Auto-promoted reservation ${nextPending.id} on event ${eventId}`);
      }
    }

    return { message: reservation.payment_id ? 'Réservation annulée et remboursée' : 'Réservation annulée' };
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

    // Vérifier toute réservation existante, y compris annulées (contrainte unique DB)
    const anyReservation = await this.prisma.reservation.findFirst({
      where: { event_id: eventId, membership_id: membership.id },
    });

    if (anyReservation && (anyReservation.status === 'confirmed' || anyReservation.status === 'pending')) {
      throw new BadRequestException('Vous êtes déjà inscrit à cet événement');
    }

    // Calcul du statut selon la capacité
    const confirmedCount = event.Reservation.filter((r) => r.status === 'confirmed').length;
    const reservationStatus: 'confirmed' | 'pending' =
      event.capacity && event.capacity > 0 && confirmedCount >= event.capacity
        ? 'pending'
        : 'confirmed';

    const include = {
      membership: { include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } } },
      event: { select: { id: true, title: true, start_time: true, end_time: true, capacity: true } },
    };

    // Réactiver une réservation annulée ou en créer une nouvelle
    const reservation = anyReservation
      ? await this.prisma.reservation.update({
          where: { id: anyReservation.id },
          data: { status: reservationStatus, deleted_at: null },
          include,
        })
      : await this.prisma.reservation.create({
          data: { event_id: eventId, membership_id: membership.id, status: reservationStatus },
          include,
        });

    return {
      message: reservationStatus === 'confirmed' ? 'Inscription confirmée' : "Vous êtes sur la liste d'attente",
      reservation: { id: reservation.id, status: reservation.status, event: reservation.event, user: reservation.membership.user },
    };
  }

  /**
   * P3-4b — Événement payant : crée une Stripe Checkout Session sur le compte connecté.
   * Crée une Reservation pending + un Payment pending liés, confirmés via webhook.
   */
  async checkoutEvent(eventId: string, organisationId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        Reservation: { where: { deleted_at: null, status: { in: ['confirmed', 'pending'] } } },
      },
    });

    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement non trouvé');
    }
    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("Cet événement n'appartient pas à cette organisation");
    }
    if (event.price <= 0) {
      throw new BadRequestException('Cet événement est gratuit, aucun paiement requis.');
    }
    if (event.status !== 'published') {
      throw new BadRequestException("Cet événement n'est pas ouvert aux inscriptions.");
    }

    // Membre actif/pending de l'org
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        status: { in: ['active', 'pending'] },
        left_at: null,
        deleted_at: null,
      },
    });
    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    // Pas de double paiement pour cet événement
    const alreadyPaid = await this.prisma.payment.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        target_type: 'event',
        target_id: eventId,
        status: 'paid',
      },
    });
    if (alreadyPaid) {
      throw new ConflictException('Vous avez déjà payé votre place pour cet événement.');
    }

    // Capacité
    const confirmedCount = event.Reservation.filter((r) => r.status === 'confirmed').length;
    if (event.capacity && event.capacity > 0 && confirmedCount >= event.capacity) {
      throw new BadRequestException("Cet événement est complet.");
    }

    // Compte Stripe du club
    const org = await this.prisma.organisation.findUniqueOrThrow({
      where: { id: organisationId },
    });
    if (!org.stripe_account_id) {
      throw new BadRequestException("Ce club n'a pas encore connecté Stripe.");
    }
    if (!org.stripe_charges_enabled) {
      throw new BadRequestException(
        "Le compte Stripe de ce club n'est pas encore activé."
      );
    }

    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL').replace(/\/+$/, '');
    const unitAmount = Math.round(event.price * 100);
    const feeAmount = Math.round(unitAmount * 0.02);

    const session = await this.stripe.client.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur' as const,
              unit_amount: unitAmount,
              product_data: { name: event.title },
            },
            quantity: 1 as const,
          },
        ],
        payment_intent_data: {
          application_fee_amount: feeAmount,
        },
        success_url: `${frontendUrl}/club/${organisationId}/events/${eventId}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/club/events/${eventId}`,
        metadata: {
          event_id: eventId,
          org_id: organisationId,
          user_id: userId,
        },
      },
      { stripeAccount: org.stripe_account_id }
    );

    const paymentIntentId =
      session.payment_intent && typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null;

    // Réservation pending (réutilise une réservation existante si présente)
    const anyReservation = await this.prisma.reservation.findFirst({
      where: { event_id: eventId, membership_id: membership.id },
    });
    const reservation = anyReservation
      ? await this.prisma.reservation.update({
          where: { id: anyReservation.id },
          data: { status: 'pending', deleted_at: null },
        })
      : await this.prisma.reservation.create({
          data: { event_id: eventId, membership_id: membership.id, status: 'pending' },
        });

    const payment = await this.prisma.payment.create({
      data: {
        user_id: userId,
        organisation_id: organisationId,
        membership_id: membership.id,
        amount: event.price,
        currency: 'eur',
        payment_type: 'stripe',
        status: 'pending',
        target_type: 'event',
        target_id: eventId,
        purpose: 'event_participation',
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      },
    });

    // Lie le paiement à la réservation
    await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: { payment_id: payment.id },
    });

    return { checkout_url: session.url };
  }

  /**
   * P3-4b — Retourne le paiement event du membre connecté (ou null).
   */
  async getMyEventPayment(eventId: string, organisationId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        status: { notIn: ['banned'] },
        deleted_at: null,
      },
    });
    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        user_id: userId,
        organisation_id: organisationId,
        target_type: 'event',
        target_id: eventId,
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        status: true,
        amount: true,
        paid_at: true,
        stripe_session_id: true,
      },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: Number(payment.amount),
      paid_at: payment.paid_at,
      stripe_session_id: payment.stripe_session_id,
    };
  }

  async unregisterFromEvent(eventId: string, organisationId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { user_id: userId, organisation_id: organisationId, left_at: null, deleted_at: null },
    });
    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation");
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.deleted_at) {
      throw new NotFoundException('Événement introuvable');
    }

    if (event.cancellation_deadline_hours) {
      const deadline = new Date(event.start_time);
      deadline.setHours(deadline.getHours() - event.cancellation_deadline_hours);
      if (new Date() > deadline) {
        throw new BadRequestException(
          `L'annulation n'est plus possible moins de ${event.cancellation_deadline_hours}h avant l'événement.`
        );
      }
    }

    const allMembershipIds = (
      await this.prisma.membership.findMany({
        where: { user_id: userId, organisation_id: organisationId },
        select: { id: true },
      })
    ).map((m) => m.id);

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        event_id: eventId,
        membership_id: { in: allMembershipIds },
        deleted_at: null,
        status: { in: ['confirmed', 'pending'] },
      },
      select: { id: true, status: true, payment_id: true },
    });
    if (!reservation) {
      // Cas exceptionnel (admin annulé sans rembourser, webhook non reçu en local…)
      // Si un paiement 'paid' existe quand même, on rembourse et on sort proprement.
      if (event.price > 0) {
        const payment = await this.prisma.payment.findFirst({
          where: {
            user_id: userId,
            organisation_id: organisationId,
            target_type: 'event',
            target_id: eventId,
            status: 'paid',
          },
          select: { id: true, stripe_session_id: true, stripe_payment_intent_id: true },
        })
        if (payment) {
          const org = await this.prisma.organisation.findUnique({
            where: { id: organisationId },
            select: { stripe_account_id: true },
          })
          if (org?.stripe_account_id) {
            await this.issueRefundForPayment(payment, org.stripe_account_id, eventId)
          }
          return { message: 'Remboursement effectué' }
        }
      }
      throw new NotFoundException("Aucune inscription active trouvée pour cet événement")
    }

    // Remboursement si event payant et paiement confirmé
    if (event.price > 0 && reservation.payment_id) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: reservation.payment_id },
        select: { id: true, status: true, stripe_session_id: true, stripe_payment_intent_id: true },
      })
      if (payment?.status === 'paid') {
        const org = await this.prisma.organisation.findUnique({
          where: { id: event.organisation_id },
          select: { stripe_account_id: true },
        })
        if (org?.stripe_account_id) {
          await this.issueRefundForPayment(payment, org.stripe_account_id, eventId)
        }
      }
    }

    const wasConfirmed = reservation.status === 'confirmed';

    await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'cancelled', deleted_at: new Date() },
    });

    // BUG 3 — auto-promotion seulement si event gratuit (payant → la place reste libre pour le prochain qui paiera)
    if (wasConfirmed && event.price === 0) {
      const nextPending = await this.prisma.reservation.findFirst({
        where: { event_id: eventId, status: 'pending', deleted_at: null },
        orderBy: { created_at: 'asc' },
      });
      if (nextPending) {
        await this.prisma.reservation.update({
          where: { id: nextPending.id },
          data: { status: 'confirmed' },
        });
        console.log(`[Waitlist] Auto-promoted reservation ${nextPending.id} on event ${eventId}`);
      }
    }

    return { message: 'Désinscription effectuée' };
  }

  /**
   * Vérifier les conflits d'horaire
   */
  // ── Stripe refund helpers ──────────────────────────────────────────────────

  private async issueRefundForPayment(
    payment: { id: string; stripe_session_id: string | null; stripe_payment_intent_id: string | null },
    stripeAccountId: string,
    eventId: string,
  ): Promise<void> {
    try {
      let piId = payment.stripe_payment_intent_id
      if (!piId && payment.stripe_session_id) {
        const sess = await this.stripe.client.checkout.sessions.retrieve(
          payment.stripe_session_id,
          {},
          { stripeAccount: stripeAccountId },
        )
        piId = typeof sess.payment_intent === 'string' ? sess.payment_intent : null
      }
      if (!piId) { return }
      await this.stripe.client.refunds.create(
        { payment_intent: piId },
        { stripeAccount: stripeAccountId },
      )
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      })
      console.log(`[Refund] issued for payment ${payment.id} on event ${eventId}`)
    } catch (err) {
      console.error(`[Refund] Failed for payment ${payment.id}:`, err)
    }
  }

  private async refundPaidEventPayments(eventIds: string[], organisationId: string): Promise<number> {
    const paidPayments = await this.prisma.payment.findMany({
      where: {
        organisation_id: organisationId,
        target_type: 'event',
        target_id: { in: eventIds },
        status: 'paid',
      },
      select: { id: true, stripe_session_id: true, stripe_payment_intent_id: true, target_id: true },
    })
    if (paidPayments.length === 0) { return 0 }
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { stripe_account_id: true },
    })
    if (!org?.stripe_account_id) { return 0 }
    await Promise.all(
      paidPayments.map(p => this.issueRefundForPayment(p, org.stripe_account_id!, p.target_id)),
    )
    return paidPayments.length
  }

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

  private async createRecurringOccurrences(
    parentEventId: string,
    recurrencePattern: string,
  ): Promise<{ created: number }> {
    let pattern: {
      frequency: 'daily' | 'weekly' | 'monthly';
      days_of_week?: number[];
      interval?: number;
      end_type: 'date' | 'count';
      end_date?: string;
      occurrences?: number;
    };

    try {
      pattern = JSON.parse(recurrencePattern) as typeof pattern;
    } catch {
      return { created: 0 };
    }

    const parent = await this.prisma.event.findUnique({ where: { id: parentEventId } });
    if (!parent) { return { created: 0 }; }

    const MAX = 52;
    const interval = Math.max(1, pattern.interval ?? 1);
    const duration = parent.end_time.getTime() - parent.start_time.getTime();
    const endDate = pattern.end_type === 'date' && pattern.end_date
      ? new Date(pattern.end_date + 'T23:59:59')
      : null;
    const maxCount = pattern.end_type === 'count'
      ? Math.min(pattern.occurrences ?? 1, MAX)
      : MAX;

    const dates: Date[] = [];

    if (pattern.frequency === 'daily') {
      let cur = new Date(parent.start_time);
      while (dates.length < maxCount) {
        cur = new Date(cur.getTime() + interval * 86_400_000);
        if (endDate && cur > endDate) { break; }
        dates.push(new Date(cur));
      }
    } else if (pattern.frequency === 'weekly') {
      const days = [...(pattern.days_of_week?.length ? pattern.days_of_week : [parent.start_time.getDay()])].sort((a, b) => a - b);
      const parentDay = parent.start_time.getDay();

      // Same week — only days strictly after the parent's day
      for (const d of days) {
        if (d <= parentDay) { continue; }
        const occ = new Date(parent.start_time.getTime() + (d - parentDay) * 86_400_000);
        if (endDate && occ > endDate) { break; }
        dates.push(occ);
        if (dates.length >= maxCount) { break; }
      }

      // Subsequent week groups
      let weekNum = interval;
      while (dates.length < maxCount) {
        for (const d of days) {
          const diffDays = weekNum * 7 + (d - parentDay);
          const occ = new Date(parent.start_time.getTime() + diffDays * 86_400_000);
          if (endDate && occ > endDate) { return this.persistOccurrences(parent, dates, duration, parentEventId); }
          dates.push(occ);
          if (dates.length >= maxCount) { return this.persistOccurrences(parent, dates, duration, parentEventId); }
        }
        weekNum += interval;
        if (weekNum > 52 * 5) { break; }
      }
    } else if (pattern.frequency === 'monthly') {
      const cur = new Date(parent.start_time);
      while (dates.length < maxCount) {
        cur.setMonth(cur.getMonth() + interval);
        const occ = new Date(cur);
        if (endDate && occ > endDate) { break; }
        dates.push(occ);
      }
    }

    return this.persistOccurrences(parent, dates, duration, parentEventId);
  }

  private async persistOccurrences(
    parent: { organisation_id: string; title: string; description: string | null; event_type: any; location: string | null; visibility: any; capacity: number | null; registration_required: boolean; price: any; cancellation_deadline_hours: number | null; status: any; cover_url: string | null; created_by_id: string },
    dates: Date[],
    duration: number,
    parentEventId: string,
  ): Promise<{ created: number }> {
    if (dates.length === 0) { return { created: 0 }; }
    await this.prisma.event.createMany({
      data: dates.map((start) => ({
        organisation_id: parent.organisation_id,
        parent_event_id: parentEventId,
        title: parent.title,
        description: parent.description,
        event_type: parent.event_type,
        start_time: start,
        end_time: new Date(start.getTime() + duration),
        location: parent.location,
        visibility: parent.visibility,
        capacity: parent.capacity,
        registration_required: parent.registration_required,
        price: Number(parent.price),
        cancellation_deadline_hours: parent.cancellation_deadline_hours,
        is_recurring: false,
        status: parent.status,
        cover_url: parent.cover_url,
        created_by_id: parent.created_by_id,
      })),
    });
    return { created: dates.length };
  }
}
