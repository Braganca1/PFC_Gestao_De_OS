import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/current-user.decorator';
import { NotificacoesService } from './notificacoes.service';

@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  listar(@CurrentUser() user: UsuarioAutenticado) {
    return this.notificacoesService.listar(user);
  }

  @Get('nao-lidas')
  contarNaoLidas(@CurrentUser() user: UsuarioAutenticado) {
    return this.notificacoesService.contarNaoLidas(user);
  }

  @Patch('lidas')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarTodasLidas(@CurrentUser() user: UsuarioAutenticado) {
    return this.notificacoesService.marcarTodasLidas(user);
  }

  @Patch(':id/lida')
  marcarLida(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.notificacoesService.marcarLida(id, user);
  }
}
