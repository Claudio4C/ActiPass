import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Gender } from '../../generated/prisma/client';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsDateString()
  birthdate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsOptional()
  phone?: string;
}
