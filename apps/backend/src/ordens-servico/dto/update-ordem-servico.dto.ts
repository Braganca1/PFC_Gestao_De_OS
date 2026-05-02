import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Prioridade, StatusOS } from '@prisma/client';

export class UpdateOrdemServicoDto {
  @IsInt()
  usuarioId: number;

  @IsOptional()
  @IsEnum(StatusOS)
  status?: StatusOS;

  @IsOptional()
  @IsEnum(Prioridade)
  prioridade?: Prioridade;

  @IsOptional()
  @IsInt()
  executorId?: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  piso?: string;

  @IsOptional()
  @IsString()
  local?: string;
}
