import { IsInt, IsString, Min } from 'class-validator';

export class DadosManutencaoArDto {
  @IsString()
  tipoManutencao: string;

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
