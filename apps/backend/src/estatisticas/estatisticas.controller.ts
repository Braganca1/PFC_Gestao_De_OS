import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { TipoUsuario } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { EstatisticasService } from './estatisticas.service';

@Controller('estatisticas')
@Roles(TipoUsuario.GESTOR, TipoUsuario.ADMINISTRADOR)
export class EstatisticasController {
  constructor(private readonly estatisticasService: EstatisticasService) {}

  @Get()
  obter(@Query('inicio') inicio?: string, @Query('fim') fim?: string) {
    const dataInicio = this.parseData(inicio, 'inicio');
    const dataFim = this.parseData(fim, 'fim');
    if (dataFim) {
      // intervalo inclusivo: considera o dia final inteiro
      dataFim.setHours(23, 59, 59, 999);
    }
    if (dataInicio && dataFim && dataInicio > dataFim) {
      throw new BadRequestException(
        'Data inicial não pode ser posterior à data final',
      );
    }
    return this.estatisticasService.obter(dataInicio, dataFim);
  }

  private parseData(valor: string | undefined, campo: string): Date | undefined {
    if (!valor) return undefined;
    const data = new Date(`${valor}T00:00:00`);
    if (Number.isNaN(data.getTime())) {
      throw new BadRequestException(`Data inválida em "${campo}" (use AAAA-MM-DD)`);
    }
    return data;
  }
}
