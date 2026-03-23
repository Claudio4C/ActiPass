import * as crypto from 'crypto';

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceStatus, AttendanceType } from '@prisma/client';

import { AuditService } from '../auth/audit.service';
import { PermissionsService } from '../auth/permissions.service';
import { PrismaService } from '../prisma/prisma.service';

import {
  CreateAttendanceDto,
  CorrectAttendanceDto,
  BulkUpdateAttendanceDto,
  QrCodeAttendanceDto,
} from './dto';

@Injectable()
export class AttendanceService {
  private readonly COACH_MODIFICATION_WINDOW = 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly auditService: AuditService
  ) {}

  private async checkOrganisationAccess(
    userId: string,
    organisationId: string
  ): Promise<{
    membership: { id: string; role: { id: string; type: string } };
    role: { id: string; type: string };
  }> {
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

    return { membership, role: membership.role };
  }

  private canCoachModify(eventEndDate: Date | null, validatedAt: Date | null): boolean {
    if (!eventEndDate) return true;

    const referenceDate = validatedAt || eventEndDate;
    const now = new Date();
    const timeDiff = now.getTime() - referenceDate.getTime();

    return timeDiff <= this.COACH_MODIFICATION_WINDOW;
  }

  async getEventAttendances(organisationId: string, eventId: string, userId: string) {
    const { role } = await this.checkOrganisationAccess(userId, organisationId);

    const hasReadPermission = await this.permissionsService.hasPermission(
      userId,
      { resource: 'attendance', action: 'read', scope: 'organisation' },
      organisationId
    );

    if (!hasReadPermission) {
      throw new ForbiddenException("Vous n'avez pas la permission de lire les présences");
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organisation: true },
    });

    if (!event) {
      throw new NotFoundException("L'événement n'existe pas");
    }

    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("L'événement n'appartient pas à cette organisation");
    }

    const reservations = await this.prisma.reservation.findMany({
      where: {
        event_id: eventId,
        status: { in: ['confirmed', 'attended'] },
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
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    const attendances = await this.prisma.attendance.findMany({
      where: { event_id: eventId },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            avatar_url: true,
          },
        },
        checker: {
          select: { id: true, firstname: true, lastname: true },
        },
        corrector: {
          select: { id: true, firstname: true, lastname: true },
        },
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.user_id, a]));

    const result = reservations.map((reservation) => {
      const memberId = reservation.membership.user_id;
      const attendance = attendanceMap.get(memberId);
      return {
        user: reservation.membership.user,
        reservation_id: reservation.id,
        attendance: attendance
          ? {
              id: attendance.id,
              status: attendance.status,
              type: attendance.type,
              comment: attendance.comment,
              validated_at: attendance.validated_at,
              correction_note: attendance.correction_note,
              correction_date: attendance.correction_date,
              corrected_by: attendance.corrector
                ? {
                    id: attendance.corrector.id,
                    firstname: attendance.corrector.firstname,
                    lastname: attendance.corrector.lastname,
                  }
                : null,
              checked_by: attendance.checker
                ? {
                    id: attendance.checker.id,
                    firstname: attendance.checker.firstname,
                    lastname: attendance.checker.lastname,
                  }
                : null,
              created_at: attendance.created_at,
              updated_at: attendance.updated_at,
            }
          : null,
      };
    });

    return {
      event: {
        id: event.id,
        title: event.title,
        start_date: event.start_time,
        end_date: event.end_time,
        status: event.status,
      },
      attendances: result,
      can_modify:
        role.type === 'club_owner' || role.type === 'club_manager'
          ? true
          : this.canCoachModify(event.end_time, null),
      past_24h: !this.canCoachModify(event.end_time, null),
    };
  }

  async createOrUpdateAttendance(
    organisationId: string,
    eventId: string,
    userId: string,
    createAttendanceDto: CreateAttendanceDto
  ) {
    const { role } = await this.checkOrganisationAccess(userId, organisationId);

    const hasManagePermission = await this.permissionsService.hasPermission(
      userId,
      { resource: 'attendance', action: 'manage', scope: 'organisation' },
      organisationId
    );

    if (!hasManagePermission) {
      throw new ForbiddenException("Vous n'avez pas la permission de gérer les présences");
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event) throw new NotFoundException("L'événement n'existe pas");
    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("L'événement n'appartient pas à cette organisation");
    }

    const isCoach = role.type === 'coach';
    if (isCoach && !this.canCoachModify(event.end_time, null)) {
      throw new ForbiddenException(
        'Le délai de modification (24h) est dépassé. Seul un administrateur peut modifier cette présence.'
      );
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        event_id: eventId,
        membership: { user_id: createAttendanceDto.user_id },
        status: { in: ['confirmed', 'attended'] },
      },
    });

    if (!reservation) {
      throw new BadRequestException("L'utilisateur n'a pas de réservation pour cet événement");
    }

    const attendance = await this.prisma.attendance.upsert({
      where: {
        user_id_event_id: {
          user_id: createAttendanceDto.user_id,
          event_id: eventId,
        },
      },
      create: {
        user_id: createAttendanceDto.user_id,
        event_id: eventId,
        status: createAttendanceDto.status || AttendanceStatus.present,
        type: createAttendanceDto.type || AttendanceType.manual,
        comment: createAttendanceDto.comment,
        checked_in_by: userId,
      },
      update: {
        status: createAttendanceDto.status,
        type: createAttendanceDto.type,
        comment: createAttendanceDto.comment,
        checked_in_by: userId,
        updated_at: new Date(),
      },
    });

    await this.auditService.logUpdate(
      userId,
      'attendance',
      attendance.id,
      {},
      { user_id: createAttendanceDto.user_id, event_id: eventId, status: attendance.status, type: attendance.type },
      { organisationId }
    );

    return attendance;
  }

  async bulkUpdateAttendances(
    organisationId: string,
    eventId: string,
    userId: string,
    bulkUpdateDto: BulkUpdateAttendanceDto
  ) {
    const { role } = await this.checkOrganisationAccess(userId, organisationId);

    const hasManagePermission = await this.permissionsService.hasPermission(
      userId,
      { resource: 'attendance', action: 'manage', scope: 'organisation' },
      organisationId
    );

    if (!hasManagePermission) {
      throw new ForbiddenException("Vous n'avez pas la permission de gérer les présences");
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event) throw new NotFoundException("L'événement n'existe pas");
    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("L'événement n'appartient pas à cette organisation");
    }

    const isCoach = role.type === 'coach';
    if (isCoach && !this.canCoachModify(event.end_time, null)) {
      throw new ForbiddenException(
        'Le délai de modification (24h) est dépassé. Seul un administrateur peut modifier ces présences.'
      );
    }

    const results: Array<{
      id: string;
      user_id: string;
      event_id: string;
      status: AttendanceStatus;
      type: AttendanceType;
      created_at: Date;
      updated_at: Date;
    }> = [];

    for (const attendanceUpdate of bulkUpdateDto.attendances) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          event_id: eventId,
          membership: { user_id: attendanceUpdate.user_id },
          status: { in: ['confirmed', 'attended'] },
        },
      });

      if (!reservation) continue;

      const attendance = await this.prisma.attendance.upsert({
        where: {
          user_id_event_id: {
            user_id: attendanceUpdate.user_id,
            event_id: eventId,
          },
        },
        create: {
          user_id: attendanceUpdate.user_id,
          event_id: eventId,
          status: attendanceUpdate.status,
          comment: attendanceUpdate.comment,
          checked_in_by: userId,
          type: AttendanceType.manual,
        },
        update: {
          status: attendanceUpdate.status,
          comment: attendanceUpdate.comment,
          checked_in_by: userId,
          updated_at: new Date(),
        },
      });

      results.push(attendance);
    }

    await this.auditService.logUpdate(
      userId,
      'attendance',
      eventId,
      {},
      {
        action: 'bulk_update',
        count: results.length,
        attendances: bulkUpdateDto.attendances.map((a) => ({ user_id: a.user_id, status: a.status })),
      },
      { organisationId }
    );

    return { updated: results.length, attendances: results };
  }

  async validateEventAttendances(organisationId: string, eventId: string, userId: string) {
    await this.checkOrganisationAccess(userId, organisationId);

    const hasManagePermission = await this.permissionsService.hasPermission(
      userId,
      { resource: 'attendance', action: 'manage', scope: 'organisation' },
      organisationId
    );

    if (!hasManagePermission) {
      throw new ForbiddenException("Vous n'avez pas la permission de gérer les présences");
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event) throw new NotFoundException("L'événement n'existe pas");
    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("L'événement n'appartient pas à cette organisation");
    }

    const now = new Date();

    await this.prisma.attendance.updateMany({
      where: { event_id: eventId, validated_at: null },
      data: { validated_at: now },
    });

    await this.auditService.logUpdate(
      userId,
      'attendance',
      eventId,
      {},
      { action: 'validate_all', validated_at: now },
      { organisationId }
    );

    return { message: 'Présences validées avec succès', validated_at: now };
  }

  async correctAttendance(
    organisationId: string,
    eventId: string,
    attendanceId: string,
    userId: string,
    correctDto: CorrectAttendanceDto
  ) {
    const { role } = await this.checkOrganisationAccess(userId, organisationId);

    const isAdmin =
      role.type === 'club_owner' || role.type === 'club_manager' || role.type === 'municipal_admin';

    if (!isAdmin) {
      throw new ForbiddenException(
        'Seuls les administrateurs peuvent corriger les présences après 24h'
      );
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("L'événement n'existe pas");

    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { event: true },
    });

    if (!attendance) throw new NotFoundException("La présence n'existe pas");
    if (attendance.event_id !== eventId) {
      throw new BadRequestException("La présence n'appartient pas à cet événement");
    }

    const oldStatus = attendance.status;

    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: correctDto.status,
        correction_note: correctDto.correction_note,
        correction_date: new Date(),
        correction_by: userId,
        comment: correctDto.comment || attendance.comment,
        updated_at: new Date(),
      },
    });

    await this.auditService.logUpdate(
      userId,
      'attendance',
      attendanceId,
      { status: oldStatus },
      { status: correctDto.status, correction_note: correctDto.correction_note, correction_date: new Date() },
      { organisationId }
    );

    return updated;
  }

  async generateEventQrCode(organisationId: string, eventId: string, userId: string) {
    await this.checkOrganisationAccess(userId, organisationId);

    const hasManagePermission = await this.permissionsService.hasPermission(
      userId,
      { resource: 'attendance', action: 'manage', scope: 'organisation' },
      organisationId
    );

    if (!hasManagePermission) {
      throw new ForbiddenException("Vous n'avez pas la permission de gérer les présences");
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event) throw new NotFoundException("L'événement n'existe pas");
    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("L'événement n'appartient pas à cette organisation");
    }

    const qrCode = crypto
      .createHash('sha256')
      .update(`${eventId}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')
      .substring(0, 32);

    await this.auditService.logCreate(
      userId,
      'qr_code',
      qrCode,
      { event_id: eventId, action: 'generate' },
      { organisationId }
    );

    return {
      qr_code: qrCode,
      event_id: eventId,
      expires_at: event.end_time || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async validateAttendanceByQrCode(
    organisationId: string,
    eventId: string,
    userId: string,
    qrCodeDto: QrCodeAttendanceDto
  ) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event) throw new NotFoundException("L'événement n'existe pas");
    if (event.organisation_id !== organisationId) {
      throw new ForbiddenException("L'événement n'appartient pas à cette organisation");
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        event_id: eventId,
        membership: { user_id: userId },
        status: { in: ['confirmed', 'attended'] },
      },
    });

    if (!reservation) {
      throw new BadRequestException("Vous n'avez pas de réservation pour cet événement");
    }

    const attendance = await this.prisma.attendance.upsert({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId,
        },
      },
      create: {
        user_id: userId,
        event_id: eventId,
        status: AttendanceStatus.present,
        type: AttendanceType.self,
        qr_code: qrCodeDto.qr_code,
        checked_in_by: userId,
      },
      update: {
        status: AttendanceStatus.present,
        type: AttendanceType.self,
        qr_code: qrCodeDto.qr_code,
        updated_at: new Date(),
      },
    });

    await this.auditService.logCreate(
      userId,
      'attendance',
      attendance.id,
      { method: 'qr_code', qr_code: qrCodeDto.qr_code },
      { organisationId }
    );

    return attendance;
  }

  async getAttendanceSummaries(organisationId: string, userId: string) {
    await this.checkOrganisationAccess(userId, organisationId);

    const hasPermission = await this.permissionsService.hasPermission(
      userId,
      { resource: 'attendance', action: 'read', scope: 'organisation' },
      organisationId
    );
    if (!hasPermission) {
      throw new ForbiddenException("Vous n'avez pas la permission de lire les présences");
    }

    const attendances = await this.prisma.attendance.findMany({
      where: { event: { organisation_id: organisationId } },
      select: { event_id: true, status: true, validated_at: true },
    });

    const summaryMap = new Map<
      string,
      { total: number; present: number; absent: number; late: number; validated: boolean }
    >();

    for (const a of attendances) {
      const s = summaryMap.get(a.event_id) ?? {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        validated: false,
      };
      s.total++;
      if (a.status === 'present') s.present++;
      else if (a.status === 'absent' || a.status === 'excused') s.absent++;
      else if (a.status === 'late') s.late++;
      if (a.validated_at) s.validated = true;
      summaryMap.set(a.event_id, s);
    }

    return Array.from(summaryMap.entries()).map(([event_id, data]) => ({
      event_id,
      ...data,
    }));
  }

  async getAttendanceStats(
    organisationId: string,
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      coachId?: string;
      disciplineId?: string;
    }
  ) {
    await this.checkOrganisationAccess(userId, organisationId);

    const hasReadPermission = await this.permissionsService.hasPermission(
      userId,
      { resource: 'attendance', action: 'read', scope: 'organisation' },
      organisationId
    );

    if (!hasReadPermission) {
      throw new ForbiddenException("Vous n'avez pas la permission de lire les statistiques");
    }

    const where: {
      event: {
        organisation_id: string;
        start_time?: { gte?: Date; lte?: Date };
        created_by_id?: string;
      };
    } = {
      event: { organisation_id: organisationId },
    };

    if (filters?.startDate || filters?.endDate) {
      where.event.start_time = {};
      if (filters.startDate) where.event.start_time.gte = filters.startDate;
      if (filters.endDate) where.event.start_time.lte = filters.endDate;
    }

    if (filters?.coachId) {
      where.event.created_by_id = filters.coachId;
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        event: {
          include: {
            created_by: {
              select: { id: true, firstname: true, lastname: true },
            },
          },
        },
        user: {
          select: { id: true, firstname: true, lastname: true },
        },
      },
    });

    const totalAttendances = attendances.length;
    const presentCount = attendances.filter((a) => a.status === AttendanceStatus.present).length;
    const globalRate = totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0;

    const eventAttendanceCount = new Map<string, number>();
    attendances.forEach((a) => {
      const count = eventAttendanceCount.get(a.event_id) || 0;
      eventAttendanceCount.set(a.event_id, count + 1);
    });

    const topEvents = Array.from(eventAttendanceCount.entries())
      .map(([eventId, count]) => {
        const attendanceItem = attendances.find((a) => a.event_id === eventId);
        const event = attendanceItem?.event;
        return {
          event_id: eventId,
          title: event?.title || 'Événement inconnu',
          count,
          date: event?.start_time || null,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const userAttendanceCount = new Map<string, number>();
    attendances
      .filter((a) => a.status === AttendanceStatus.present)
      .forEach((a) => {
        const count = userAttendanceCount.get(a.user_id) || 0;
        userAttendanceCount.set(a.user_id, count + 1);
      });

    const userIds = Array.from(userAttendanceCount.keys());
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstname: true, lastname: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const topMembers = Array.from(userAttendanceCount.entries())
      .map(([uid, count]) => {
        const user = userMap.get(uid);
        return {
          user_id: uid,
          name: user ? `${user.firstname} ${user.lastname}` : 'Utilisateur inconnu',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const eventIdsForNoShow = [...new Set(attendances.map((a) => a.event_id))];
    const eventsForNoShow = await this.prisma.event.findMany({
      where: { id: { in: eventIdsForNoShow } },
      select: { id: true, start_time: true },
    });
    const eventMapForNoShow = new Map(eventsForNoShow.map((e) => [e.id, e]));

    const monthlyNoShow = new Map<string, { total: number; absent: number }>();
    attendances.forEach((a) => {
      const event = eventMapForNoShow.get(a.event_id);
      if (event?.start_time) {
        const month = new Date(event.start_time).toISOString().substring(0, 7);
        const current = monthlyNoShow.get(month) || { total: 0, absent: 0 };
        current.total++;
        if (a.status === AttendanceStatus.absent || a.status === AttendanceStatus.excused) {
          current.absent++;
        }
        monthlyNoShow.set(month, current);
      }
    });

    const monthlyNoShowRate = Array.from(monthlyNoShow.entries())
      .map(([month, data]) => ({
        month,
        rate: data.total > 0 ? (data.absent / data.total) * 100 : 0,
        total: data.total,
        absent: data.absent,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      global_rate: Math.round(globalRate * 100) / 100,
      total_attendances: totalAttendances,
      present_count: presentCount,
      top_events: topEvents,
      top_members: topMembers,
      monthly_no_show_rate: monthlyNoShowRate,
    };
  }
}
