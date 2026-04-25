import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Prioridade, TipoOS } from '@prisma/client';
import { DadosInstalacaoArDto } from './dados-instalacao-ar.dto';
import { DadosManutencaoArDto } from './dados-manutencao-ar.dto';

export class CreateOrdemServicoDto {
  @IsEnum(TipoOS)
  tipo: TipoOS;

  @IsOptional()
  @IsEnum(Prioridade)
  prioridade?: Prioridade;

  @IsEmail()
  emailSolicitante: string;

  @IsString()
  @IsNotEmpty()
  secaoSolicitante: string;

  @IsString()
  @IsNotEmpty()
  nomeRepresentante: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsNotEmpty()
  piso: string;

  @IsString()
  @IsNotEmpty()
  local: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @ValidateIf((o: CreateOrdemServicoDto) => o.tipo === TipoOS.INSTALACAO_AR_CONDICIONADO)
  @ValidateNested()
  @Type(() => DadosInstalacaoArDto)
  dadosInstalacao?: DadosInstalacaoArDto;

  @ValidateIf((o: CreateOrdemServicoDto) => o.tipo === TipoOS.MANUTENCAO_AR_CONDICIONADO)
  @ValidateNested()
  @Type(() => DadosManutencaoArDto)
  dadosManutencao?: DadosManutencaoArDto;
}
