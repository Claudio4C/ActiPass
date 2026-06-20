import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QrCodeAttendanceDto {
  @IsString()
  qr_code: string;

  /** Utilisateur pointé (ex. enfant) — obligatoire si plusieurs personnes éligibles (réponse `choose_attendee`). */
  @IsOptional()
  @IsUUID()
  for_user_id?: string;
}
