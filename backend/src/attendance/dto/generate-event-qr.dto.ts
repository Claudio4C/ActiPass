import { IsBoolean, IsOptional } from 'class-validator';

export class GenerateEventQrDto {
  /** Si vrai, invalide le jeton actuel et en crée un nouveau (nouveau QR pour la même séance). */
  @IsOptional()
  @IsBoolean()
  rotate?: boolean;
}
