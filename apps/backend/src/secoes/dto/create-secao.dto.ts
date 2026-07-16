import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSecaoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome: string;
}
