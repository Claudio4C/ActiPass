import { IsString } from 'class-validator';

export class QrCodeAttendanceDto {
  @IsString()
  qr_code: string;
}
