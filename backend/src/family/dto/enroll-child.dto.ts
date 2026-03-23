import { IsString, IsNotEmpty } from 'class-validator';

export class EnrollChildDto {
  @IsString()
  @IsNotEmpty()
  organisation_id: string;
}
