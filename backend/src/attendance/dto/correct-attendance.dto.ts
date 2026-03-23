import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CorrectAttendanceDto {
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  correction_note: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
