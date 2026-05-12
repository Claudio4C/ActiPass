import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto, UpdateChildDto, EnrollChildDto, UpsertChildHealthDto } from './dto';

const AUTHORIZATION_META: Record<string, { title: string; description: string }> = {
  photo_rights: { title: 'Droit à l\'image', description: 'Autorisation d\'utiliser photos et vidéos de l\'enfant lors des activités du club.' },
  excursion:    { title: 'Autorisation de sortie', description: 'Autorisation de participer aux sorties, déplacements et voyages organisés par le club.' },
  medical_waiver: { title: 'Décharge médicale', description: 'Autorisation de prise en charge médicale d\'urgence en cas d\'accident ou d\'indisposition.' },
};

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async createChild(parentId: string, dto: CreateChildDto) {
    const username = `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const email = `${username}@family.internal`;

    const child = await this.prisma.user.create({
      data: {
        firstname: dto.firstname,
        lastname: dto.lastname,
        birthdate: new Date(dto.birthdate + 'T00:00:00.000Z'),
        gender: dto.gender,
        phone: dto.phone ?? null,
        email,
        username,
        is_minor: true,
        is_email_verified: true,
        status: 'active',
      },
    });

    await this.prisma.familyLink.create({
      data: {
        parent_id: parentId,
        child_id: child.id,
        relationship: 'parent',
        is_primary_contact: true,
      },
    });

    return this.formatChild(child, 'parent', true);
  }

  async getChildren(parentId: string) {
    const links = await this.prisma.familyLink.findMany({
      where: { parent_id: parentId },
      include: {
        child: {
          include: {
            memberships: {
              where: { left_at: null, deleted_at: null },
              include: {
                organisation: { select: { id: true, name: true, type: true } },
                role: { select: { name: true, type: true } },
              },
            },
          },
        },
      },
    });

    return links.map((link) => this.formatChild(link.child, link.relationship, link.is_primary_contact));
  }

  async updateChild(parentId: string, childId: string, dto: UpdateChildDto) {
    await this.assertParentOwnsChild(parentId, childId);

    const child = await this.prisma.user.update({
      where: { id: childId },
      data: {
        ...(dto.firstname && { firstname: dto.firstname }),
        ...(dto.lastname && { lastname: dto.lastname }),
        ...(dto.birthdate && { birthdate: new Date(dto.birthdate + 'T00:00:00.000Z') }),
        ...(dto.gender && { gender: dto.gender }),
        phone: dto.phone ?? undefined,
        ...(dto.avatar_url !== undefined && { avatar_url: dto.avatar_url }),
      },
    });

    return this.formatChild(child, 'parent', true);
  }

  async removeChild(parentId: string, childId: string) {
    await this.assertParentOwnsChild(parentId, childId);

    await this.prisma.familyLink.delete({
      where: { parent_id_child_id: { parent_id: parentId, child_id: childId } },
    });

    return { message: 'Lien familial supprimé' };
  }

  async enrollChild(parentId: string, childId: string, dto: EnrollChildDto) {
    await this.assertParentOwnsChild(parentId, childId);

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: dto.organisation_id },
    });
    if (!organisation) {
      throw new NotFoundException('Organisation introuvable');
    }

    const existingMembership = await this.prisma.membership.findFirst({
      where: { user_id: childId, organisation_id: dto.organisation_id, left_at: null },
    });
    if (existingMembership) {
      throw new ConflictException("L'enfant est déjà inscrit dans cette organisation");
    }

    const memberRole = await this.prisma.role.findFirst({
      where: { type: 'member' },
    });
    if (!memberRole) {
      throw new BadRequestException('Rôle membre introuvable');
    }

    const membership = await this.prisma.membership.create({
      data: {
        user_id: childId,
        organisation_id: dto.organisation_id,
        role_id: memberRole.id,
        status: 'pending',
      },
      include: {
        organisation: { select: { id: true, name: true, type: true } },
        role: { select: { name: true, type: true } },
      },
    });

    return {
      message: 'Enfant inscrit avec succès',
      membership: {
        id: membership.id,
        organisation: membership.organisation,
        role: membership.role,
        status: membership.status,
        joined_at: membership.joined_at,
      },
    };
  }

  async getFamilyDashboard(parentId: string) {
    const links = await this.prisma.familyLink.findMany({
      where: { parent_id: parentId },
      include: {
        child: {
          include: {
            memberships: {
              where: { left_at: null, deleted_at: null },
              include: {
                organisation: { select: { id: true, name: true } },
                Reservation: {
                  where: {
                    status: { in: ['confirmed', 'pending'] },
                    deleted_at: null,
                  },
                  select: { event_id: true },
                },
              },
            },
          },
        },
      },
    });

    if (links.length === 0) return { children: [] };

    // Récupérer toutes les orgs où au moins un enfant est inscrit
    const orgIds = [
      ...new Set(
        links.flatMap((l) => l.child.memberships.map((m) => m.organisation.id))
      ),
    ];

    // Charger les événements à venir de ces orgs en une seule requête
    const now = new Date();
    const upcomingEvents = await this.prisma.event.findMany({
      where: {
        organisation_id: { in: orgIds },
        start_time: { gte: now },
        status: 'published',
        deleted_at: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        start_time: true,
        end_time: true,
        location: true,
        registration_required: true,
        capacity: true,
        organisation: { select: { id: true, name: true } },
      },
      orderBy: { start_time: 'asc' },
      take: 50,
    });

    return {
      children: links.map((link) => {
        // IDs des réservations confirmées/pending de cet enfant
        const registeredEventIds = new Set(
          link.child.memberships.flatMap((m) => m.Reservation.map((r) => r.event_id))
        );

        // Organisations de l'enfant
        const childOrgIds = new Set(link.child.memberships.map((m) => m.organisation.id));

        // Membership ID par organisation (pour pouvoir inscrire)
        const membershipByOrg = Object.fromEntries(
          link.child.memberships.map((m) => [m.organisation.id, m.id])
        );

        // Événements des clubs de cet enfant avec flag is_registered
        const events = upcomingEvents
          .filter((e) => childOrgIds.has(e.organisation.id))
          .map((e) => ({
            ...e,
            is_registered: registeredEventIds.has(e.id),
            membership_id: membershipByOrg[e.organisation.id],
          }));

        return {
          id: link.child.id,
          firstname: link.child.firstname,
          lastname: link.child.lastname,
          birthdate: link.child.birthdate,
          avatar_url: link.child.avatar_url ?? null,
          relationship: link.relationship,
          organisations: link.child.memberships.map((m) => m.organisation),
          events,
        };
      }),
    };
  }

  /**
   * Inscrit un enfant à un événement via son membership
   */
  async registerChildToEvent(parentId: string, childId: string, eventId: string) {
    await this.assertParentOwnsChild(parentId, childId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        Reservation: {
          where: { status: { in: ['confirmed', 'pending'] }, deleted_at: null },
        },
      },
    });

    if (!event) throw new NotFoundException("Événement introuvable");
    if (event.status !== 'published') throw new BadRequestException("Cet événement n'est pas publié");

    const membership = await this.prisma.membership.findFirst({
      where: {
        user_id: childId,
        organisation_id: event.organisation_id,
        left_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException("L'enfant n'est pas membre de l'organisation de cet événement");
    }

    // Chercher TOUTE réservation existante (y compris cancelled)
    const existing = await this.prisma.reservation.findUnique({
      where: { membership_id_event_id: { membership_id: membership.id, event_id: eventId } },
    });

    if (existing && ['confirmed', 'pending'].includes(existing.status) && !existing.deleted_at) {
      throw new ConflictException("L'enfant est déjà inscrit à cet événement");
    }

    const confirmedCount = event.Reservation.filter((r) => r.status === 'confirmed').length;
    const newStatus =
      event.capacity && event.capacity > 0 && confirmedCount >= event.capacity
        ? 'pending'
        : 'confirmed';

    // Réactiver la réservation annulée ou en créer une nouvelle
    const reservation = await this.prisma.reservation.upsert({
      where: { membership_id_event_id: { membership_id: membership.id, event_id: eventId } },
      update: { status: newStatus, deleted_at: null },
      create: { event_id: eventId, membership_id: membership.id, status: newStatus },
    });

    return { message: 'Enfant inscrit avec succès', reservation_id: reservation.id, status: newStatus };
  }

  /**
   * Désinscrit un enfant d'un événement
   */
  async unregisterChildFromEvent(parentId: string, childId: string, eventId: string) {
    await this.assertParentOwnsChild(parentId, childId);

    const membership = await this.prisma.membership.findFirst({
      where: { user_id: childId, left_at: null, deleted_at: null },
    });

    if (!membership) throw new NotFoundException("Membership introuvable");

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        event_id: eventId,
        membership_id: membership.id,
        status: { in: ['confirmed', 'pending'] },
        deleted_at: null,
      },
    });

    if (!reservation) throw new NotFoundException("Inscription introuvable");

    await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'cancelled', deleted_at: new Date() },
    });

    return { message: 'Inscription annulée' };
  }

  // ─── Health info ──────────────────────────────────────────────────────────

  async getChildHealth(parentId: string, childId: string) {
    await this.assertParentOwnsChild(parentId, childId);
    const health = await this.prisma.childHealthInfo.findUnique({ where: { child_id: childId } });
    return health ?? { child_id: childId, blood_type: null, allergies: [], treatments: [], medical_notes: null, emergency_contact_name: null, emergency_contact_phone: null, emergency_contact_relation: null };
  }

  async upsertChildHealth(parentId: string, childId: string, dto: UpsertChildHealthDto) {
    await this.assertParentOwnsChild(parentId, childId);
    return this.prisma.childHealthInfo.upsert({
      where: { child_id: childId },
      update: {
        ...(dto.blood_type !== undefined && { blood_type: dto.blood_type }),
        ...(dto.allergies !== undefined && { allergies: dto.allergies }),
        ...(dto.no_known_allergies !== undefined && { no_known_allergies: dto.no_known_allergies }),
        ...(dto.treatments !== undefined && { treatments: dto.treatments }),
        ...(dto.no_known_treatments !== undefined && { no_known_treatments: dto.no_known_treatments }),
        ...(dto.medical_notes !== undefined && { medical_notes: dto.medical_notes }),
        ...(dto.emergency_contact_name !== undefined && { emergency_contact_name: dto.emergency_contact_name }),
        ...(dto.emergency_contact_phone !== undefined && { emergency_contact_phone: dto.emergency_contact_phone }),
        ...(dto.emergency_contact_relation !== undefined && { emergency_contact_relation: dto.emergency_contact_relation }),
      },
      create: {
        child_id: childId,
        blood_type: dto.blood_type ?? null,
        allergies: dto.allergies ?? [],
        no_known_allergies: dto.no_known_allergies ?? false,
        treatments: dto.treatments ?? [],
        no_known_treatments: dto.no_known_treatments ?? false,
        medical_notes: dto.medical_notes ?? null,
        emergency_contact_name: dto.emergency_contact_name ?? null,
        emergency_contact_phone: dto.emergency_contact_phone ?? null,
        emergency_contact_relation: dto.emergency_contact_relation ?? null,
      },
    });
  }

  // ─── Authorizations ───────────────────────────────────────────────────────

  async getChildAuthorizations(parentId: string, childId: string) {
    await this.assertParentOwnsChild(parentId, childId);
    const existing = await this.prisma.childAuthorization.findMany({ where: { child_id: childId } });
    const existingMap = new Map(existing.map((a) => [a.type, a]));

    return (['photo_rights', 'excursion', 'medical_waiver'] as const).map((type) => {
      const record = existingMap.get(type);
      const meta = AUTHORIZATION_META[type];
      return {
        type,
        title: meta.title,
        description: meta.description,
        id: record?.id ?? null,
        is_signed: record?.is_signed ?? false,
        signed_at: record?.signed_at ?? null,
      };
    });
  }

  async signAuthorization(parentId: string, childId: string, type: string) {
    await this.assertParentOwnsChild(parentId, childId);
    const meta = AUTHORIZATION_META[type];
    if (!meta) { throw new BadRequestException('Type d\'autorisation invalide'); }

    return this.prisma.childAuthorization.upsert({
      where: { child_id_type: { child_id: childId, type: type as any } },
      update: { is_signed: true, signed_at: new Date() },
      create: { child_id: childId, parent_id: parentId, type: type as any, title: meta.title, description: meta.description, is_signed: true, signed_at: new Date() },
    });
  }

  async unsignAuthorization(parentId: string, childId: string, type: string) {
    await this.assertParentOwnsChild(parentId, childId);
    if (!AUTHORIZATION_META[type]) { throw new BadRequestException('Type d\'autorisation invalide'); }

    return this.prisma.childAuthorization.upsert({
      where: { child_id_type: { child_id: childId, type: type as any } },
      update: { is_signed: false, signed_at: null },
      create: { child_id: childId, parent_id: parentId, type: type as any, title: AUTHORIZATION_META[type].title, description: AUTHORIZATION_META[type].description, is_signed: false },
    });
  }

  private async assertParentOwnsChild(parentId: string, childId: string) {
    const link = await this.prisma.familyLink.findUnique({
      where: { parent_id_child_id: { parent_id: parentId, child_id: childId } },
    });
    if (!link) {
      throw new ForbiddenException("Cet enfant n'est pas rattaché à votre compte");
    }
    return link;
  }

  private formatChild(child: any, relationship: string, is_primary_contact: boolean) {
    return {
      id: child.id,
      firstname: child.firstname,
      lastname: child.lastname,
      birthdate: child.birthdate,
      gender: child.gender,
      phone: child.phone,
      avatar_url: child.avatar_url ?? null,
      relationship,
      is_primary_contact,
      memberships: child.memberships ?? [],
    };
  }
}
