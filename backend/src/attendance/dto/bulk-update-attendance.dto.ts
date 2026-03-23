import { AttendanceStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class AttendanceUpdateItem {
  @IsUUID()
  user_id: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class BulkUpdateAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceUpdateItem)
  attendances: AttendanceUpdateItem[];
}
