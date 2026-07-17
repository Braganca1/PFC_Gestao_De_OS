import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegistrarExecucaoDto {
  @IsString()
  @IsNotEmpty()
  atividadesExecutadas: string;

  @IsDateString()
  dataExecucao: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  materiaisUtilizados?: string;
}
