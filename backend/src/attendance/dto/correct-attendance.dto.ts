import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CorrectAttendanceDto {
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  correction_note: string; // Obligatoire pour les corrections après 24h

  @IsString()
  @IsOptional()
  comment?: string;
}
