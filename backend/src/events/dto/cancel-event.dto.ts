import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CancelEventDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  refund_automatically?: boolean; // Remboursement automatique

  @IsOptional()
  @IsBoolean()
  apply_to_all_occurrences?: boolean; // Pour les séries récurrentes

  @IsOptional()
  @IsBoolean()
  notify_participants?: boolean; // Notifier les participants
}
