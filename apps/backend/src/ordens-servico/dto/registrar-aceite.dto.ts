import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegistrarAceiteDto {
  @IsBoolean()
  resolvido: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}
