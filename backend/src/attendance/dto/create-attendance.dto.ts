import { AttendanceStatus, AttendanceType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAttendanceDto {
  @IsUUID()
  user_id: string;

  @IsUUID()
  event_id: string;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @IsEnum(AttendanceType)
  @IsOptional()
  type?: AttendanceType;

  @IsString()
  @IsOptional()
  comment?: string;
}
