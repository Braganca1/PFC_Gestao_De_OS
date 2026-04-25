import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DadosInstalacaoArDto {
  @IsBoolean()
  existeInfraestrutura: boolean;

  @IsOptional()
  @IsString()
  dadosEquipamentoSubstituido?: string;

  @IsInt()
  @Min(1)
  quantidadePessoas: number;

  @IsString()
  tipoAparelho: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsString()
  capacidadeRefrigeracao: string;
}
