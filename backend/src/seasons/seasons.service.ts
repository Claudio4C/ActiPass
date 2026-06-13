import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateSeasonDto, UpdateSeasonDto, CloseSeasonDto } from './dto/season.dto';

@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Role assertions ──────────────────────────────────────────────────────────

  private async assertIsAdmin(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    });
    if (!m || !['club_owner', 'club_manager'].includes(m.role.type)) {
      throw new ForbiddenException('Accès réservé aux gestionnaires du club.');
    }
  }

  private async assertIsOwner(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    });
    if (!m || m.role.type !== 'club_owner') {
      throw new ForbiddenException('Accès réservé au propriétaire du club.');
    }
  }

  private async assertIsMember(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        status: { notIn: ['resigned', 'banned'] },
        deleted_at: null,
      },
    });
    if (!m) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation.");
    }
  }

  /** Allows any past or current member (including expired) to read their own history. */
  private async assertIsOrWasMember(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        status: { notIn: ['banned'] },
        deleted_at: null,
      },
    });
    if (!m) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation.");
    }
  }

  private async findOrFail(seasonId: string, orgId: string) {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, organisation_id: orgId },
    });
    if (!season) {
      throw new NotFoundException('Saison introuvable.');
    }
    return season;
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async findAll(orgId: string, userId: string) {
    await this.assertIsAdmin(orgId, userId);

    const seasons = await this.prisma.season.findMany({
      where: { organisation_id: orgId },
      orderBy: { starts_at: 'desc' },
    });

    if (seasons.length === 0) {
      return [];
    }

    const activeCounts = await this.prisma.membership.groupBy({
      by: ['season_id'],
      where: {
        organisation_id: orgId,
        season_id: { in: seasons.map((s) => s.id) },
        status: 'active',
        deleted_at: null,
      },
      _count: { _all: true },
    });

    const countMap = new Map(activeCounts.map((c) => [c.season_id, c._count._all]));

    return seasons.map((s) => ({
      ...s,
      active_members_count: countMap.get(s.id) ?? 0,
    }));
  }

  async create(orgId: string, dto: CreateSeasonDto, userId: string) {
    await this.assertIsOwner(orgId, userId);

    const existing = await this.prisma.season.findFirst({
      where: { organisation_id: orgId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Une saison avec ce nom existe déjà.');
    }

    return this.prisma.season.create({
      data: {
        organisation_id: orgId,
        name: dto.name,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        is_active: false,
      },
    });
  }

  async update(orgId: string, seasonId: string, dto: UpdateSeasonDto, userId: string) {
    await this.assertIsOwner(orgId, userId);
    const season = await this.findOrFail(seasonId, orgId);

    const changingDates = dto.starts_at !== undefined || dto.ends_at !== undefined;
    if (season.is_active && changingDates) {
      throw new BadRequestException("Impossible de modifier les dates d'une saison active.");
    }

    const newStarts = dto.starts_at ? new Date(dto.starts_at) : season.starts_at;
    const newEnds = dto.ends_at ? new Date(dto.ends_at) : season.ends_at;
    if (newEnds <= newStarts) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début.');
    }

    return this.prisma.season.update({
      where: { id: seasonId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.starts_at !== undefined && { starts_at: new Date(dto.starts_at) }),
        ...(dto.ends_at !== undefined && { ends_at: new Date(dto.ends_at) }),
      },
    });
  }

  async remove(orgId: string, seasonId: string, userId: string): Promise<void> {
    await this.assertIsOwner(orgId, userId);
    await this.findOrFail(seasonId, orgId);

    const activeMembershipCount = await this.prisma.membership.count({
      where: { season_id: seasonId, status: 'active', deleted_at: null },
    });
    if (activeMembershipCount > 0) {
      throw new ConflictException(
        'Impossible de supprimer cette saison : des membres actifs y sont rattachés.'
      );
    }

    // Détacher les memberships non-actifs avant de supprimer (évite la contrainte FK)
    await this.prisma.membership.updateMany({
      where: { season_id: seasonId, deleted_at: null },
      data: { season_id: null },
    });

    await this.prisma.season.delete({ where: { id: seasonId } });
  }

  // ── Activate ─────────────────────────────────────────────────────────────────

  async activate(orgId: string, seasonId: string, userId: string) {
    await this.assertIsOwner(orgId, userId);
    await this.findOrFail(seasonId, orgId);

    const membershipsLinked = await this.prisma.$transaction(async (tx) => {
      await tx.season.updateMany({
        where: { organisation_id: orgId },
        data: { is_active: false },
      });

      await tx.season.update({
        where: { id: seasonId },
        data: { is_active: true },
      });

      const { count } = await tx.membership.updateMany({
        where: {
          organisation_id: orgId,
          status: 'active',
          season_id: null,
          deleted_at: null,
        },
        data: { season_id: seasonId },
      });

      // Re-link admin/owner/manager memberships to the new season regardless of
      // their current season_id (they are never expired on close, so season_id
      // stays on the old season and active_members_count would show 0).
      const adminIds = await tx.membership.findMany({
        where: {
          organisation_id: orgId,
          status: 'active',
          deleted_at: null,
          role: { type: { in: ['club_owner', 'club_manager', 'treasurer'] } },
        },
        select: { id: true },
      });
      if (adminIds.length > 0) {
        await tx.membership.updateMany({
          where: { id: { in: adminIds.map((m) => m.id) } },
          data: { season_id: seasonId },
        });
      }

      return count;
    });

    return { activated: seasonId, memberships_linked: membershipsLinked };
  }

  // ── Close ─────────────────────────────────────────────────────────────────────

  async close(orgId: string, seasonId: string, dto: CloseSeasonDto, userId: string) {
    await this.assertIsOwner(orgId, userId);
    const season = await this.findOrFail(seasonId, orgId);

    if (!season.is_active) {
      throw new BadRequestException("Cette saison n'est pas active.");
    }

    const membershipsExpired = await this.prisma.$transaction(async (tx) => {
      // N'expirer que member/coach — les admins/owners gardent leur adhésion active
      const toExpire = await tx.membership.findMany({
        where: {
          organisation_id: orgId,
          season_id: seasonId,
          status: 'active',
          deleted_at: null,
          role: { type: { in: ['member', 'coach'] } },
        },
        select: { id: true },
      });

      const { count } = await tx.membership.updateMany({
        where: { id: { in: toExpire.map((m) => m.id) } },
        data: { status: 'expired' },
      });

      await tx.season.update({
        where: { id: seasonId },
        data: { is_active: false },
      });

      return count;
    });

    if (dto.send_renewal_email) {
      console.log(
        `[Season ${seasonId}] Renewal email would be sent to ${membershipsExpired} members.`
      );
    }

    return { closed: seasonId, memberships_expired: membershipsExpired };
  }

  // ── Current (any member) ─────────────────────────────────────────────────────

  async getCurrent(orgId: string, userId: string) {
    await this.assertIsMember(orgId, userId);

    const season = await this.prisma.season.findFirst({
      where: { organisation_id: orgId, is_active: true },
    });

    return season ?? null;
  }

  // ── Mine (membership history) ─────────────────────────────────────────────────

  async getMine(orgId: string, userId: string) {
    await this.assertIsOrWasMember(orgId, userId);

    const memberships = await this.prisma.membership.findMany({
      where: {
        organisation_id: orgId,
        user_id: userId,
        deleted_at: null,
      },
      include: {
        season: {
          select: { id: true, name: true, starts_at: true, ends_at: true },
        },
      },
      orderBy: [{ season: { starts_at: 'desc' } }, { joined_at: 'desc' }],
    });

    return memberships.map((m) => ({
      id: m.id,
      status: m.status,
      joined_at: m.joined_at,
      season: m.season ?? null,
    }));
  }
}
