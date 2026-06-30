import { IsString, IsIn, IsOptional, IsArray, MinLength } from 'class-validator';

export type BroadcastTarget = 'all' | 'missing_documents' | 'unpaid' | 'waitlist' | 'manual';
export type BroadcastChannel = 'email' | 'in_app' | 'both';

export class BroadcastDto {
  @IsIn(['all', 'missing_documents', 'unpaid', 'waitlist', 'manual'])
  target: BroadcastTarget;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  member_ids?: string[];

  @IsIn(['email', 'in_app', 'both'])
  channel: BroadcastChannel;

  @IsString()
  @MinLength(1)
  subject: string;

  @IsString()
  @MinLength(10)
  message: string;
}
