import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional()
  @IsString()
  roleType?: string; // 'club_manager' | 'treasurer' | 'coach' | 'member'

  @IsOptional()
  @IsString()
  message?: string; // Message personnalisé dans l'invitation
}

