import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class RegistrarExecucaoDto {
  @IsString()
  @IsNotEmpty()
  atividadesExecutadas: string;

  @IsDateString()
  dataExecucao: string;
}
