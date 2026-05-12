import { IsArray, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMemberTagDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name: string;
}

export class SetMemberTagsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds: string[];
}
