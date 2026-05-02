import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EncerrarOrdemServicoDto {
  @IsInt()
  usuarioId: number;

  @IsString()
  @IsNotEmpty()
  encerradoPor: string;

  @IsOptional()
  @IsString()
  observacoesFinais?: string;
}
