import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { Audit } from '../auth/decorators/audit.decorator';
import { RequireRead, RequireManage } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuditInterceptor } from '../auth/interceptors/audit.interceptor';

import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  CorrectAttendanceDto,
  BulkUpdateAttendanceDto,
  QrCodeAttendanceDto,
} from './dto';

@Controller('organisations/:organisationId/events/:eventId/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @RequireRead('attendance', 'organisation')
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'read', resourceType: 'attendance', logOnSuccess: true })
  async getEventAttendances(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.getEventAttendances(organisationId, eventId, userId);
  }

  @Post()
  @RequireManage('attendance', 'organisation')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'create', resourceType: 'attendance', logOnSuccess: true })
  async createOrUpdateAttendance(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.createOrUpdateAttendance(
      organisationId,
      eventId,
      userId,
      createAttendanceDto
    );
  }

  @Put('bulk')
  @RequireManage('attendance', 'organisation')
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'update', resourceType: 'attendance', logOnSuccess: true })
  async bulkUpdateAttendances(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Body() bulkUpdateDto: BulkUpdateAttendanceDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.bulkUpdateAttendances(
      organisationId,
      eventId,
      userId,
      bulkUpdateDto
    );
  }

  @Post('validate')
  @RequireManage('attendance', 'organisation')
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'validate', resourceType: 'attendance', logOnSuccess: true })
  async validateEventAttendances(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.validateEventAttendances(organisationId, eventId, userId);
  }

  @Put(':attendanceId/correct')
  @RequireManage('attendance', 'organisation')
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'correct', resourceType: 'attendance', logOnSuccess: true })
  async correctAttendance(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Param('attendanceId') attendanceId: string,
    @Body() correctDto: CorrectAttendanceDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.correctAttendance(
      organisationId,
      eventId,
      attendanceId,
      userId,
      correctDto
    );
  }

  @Post('qr-code')
  @RequireManage('attendance', 'organisation')
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'generate_qr', resourceType: 'qr_code', logOnSuccess: true })
  async generateEventQrCode(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.generateEventQrCode(organisationId, eventId, userId);
  }

  @Post('qr-code/validate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'validate_qr', resourceType: 'attendance', logOnSuccess: true })
  async validateAttendanceByQrCode(
    @Param('organisationId') organisationId: string,
    @Param('eventId') eventId: string,
    @Body() qrCodeDto: QrCodeAttendanceDto,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.validateAttendanceByQrCode(
      organisationId,
      eventId,
      userId,
      qrCodeDto
    );
  }
}

@Controller('organisations/:organisationId/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceStatsController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('summaries')
  @RequireRead('attendance', 'organisation')
  async getAttendanceSummaries(
    @Param('organisationId') organisationId: string,
    @Req() req: Request
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');
    return this.attendanceService.getAttendanceSummaries(organisationId, userId);
  }

  @Get('stats')
  @RequireRead('attendance', 'organisation')
  @UseInterceptors(AuditInterceptor)
  @Audit({ action: 'read', resourceType: 'attendance_stats', logOnSuccess: true })
  async getAttendanceStats(
    @Param('organisationId') organisationId: string,
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('coachId') coachId?: string,
    @Query('disciplineId') disciplineId?: string
  ) {
    const userId = req.user?.['sub'] as string;
    if (!userId) throw new Error('Utilisateur non authentifié');

    const filters: { startDate?: Date; endDate?: Date; coachId?: string; disciplineId?: string } = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (coachId) filters.coachId = coachId;
    if (disciplineId) filters.disciplineId = disciplineId;

    return this.attendanceService.getAttendanceStats(organisationId, userId, filters);
  }
}
