import { IsDateString } from 'class-validator';

export class InformarPrevisaoDto {
  @IsDateString()
  previsaoConclusao: string;
}
