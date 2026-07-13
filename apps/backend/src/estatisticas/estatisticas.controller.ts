import { Controller, Get } from '@nestjs/common';
import { TipoUsuario } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { EstatisticasService } from './estatisticas.service';

@Controller('estatisticas')
@Roles(TipoUsuario.GESTOR, TipoUsuario.ADMINISTRADOR)
export class EstatisticasController {
  constructor(private readonly estatisticasService: EstatisticasService) {}

  @Get()
  obter() {
    return this.estatisticasService.obter();
  }
}
