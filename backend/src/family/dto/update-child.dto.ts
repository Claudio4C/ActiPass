import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Gender } from '../../generated/prisma/client';

export class UpdateChildDto {
  @IsString()
  @IsOptional()
  firstname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsDateString()
  @IsOptional()
  birthdate?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  phone?: string;
}
