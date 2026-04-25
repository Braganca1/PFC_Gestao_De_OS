import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EncerrarOrdemServicoDto {
  @IsString()
  @IsNotEmpty()
  encerradoPor: string;

  @IsOptional()
  @IsString()
  observacoesFinais?: string;
}
