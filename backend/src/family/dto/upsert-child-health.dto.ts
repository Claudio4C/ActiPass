import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class UpsertChildHealthDto {
  @IsOptional()
  @IsString()
  blood_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsBoolean()
  no_known_allergies?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  treatments?: string[];

  @IsOptional()
  @IsBoolean()
  no_known_treatments?: boolean;

  @IsOptional()
  @IsString()
  medical_notes?: string;

  @IsOptional()
  @IsString()
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  emergency_contact_phone?: string;

  @IsOptional()
  @IsString()
  emergency_contact_relation?: string;
}
