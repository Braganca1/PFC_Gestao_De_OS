import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { StatusOS, TipoOS, TipoUsuario } from '@prisma/client';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { OrdensServicoService } from './ordens-servico.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
import { EncerrarOrdemServicoDto } from './dto/encerrar-ordem-servico.dto';
import { RegistrarExecucaoDto } from './dto/registrar-execucao.dto';
import { InformarPrevisaoDto } from './dto/informar-previsao.dto';

@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordensService: OrdensServicoService) {}

  @Post()
  create(
    @Body() dto: CreateOrdemServicoDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: UsuarioAutenticado,
    @Query('numeroOs') numeroOs?: string,
    @Query('solicitante') solicitante?: string,
    @Query('status') status?: StatusOS,
    @Query('tipo') tipo?: TipoOS,
  ) {
    return this.ordensService.findAll(
      { numeroOs, solicitante, status, tipo },
      user,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.findOne(id, user);
  }

  @Get(':id/historico')
  findHistorico(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.findHistorico(id, user);
  }

  @Patch(':id/cancelar')
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.cancelar(id, user);
  }

  @Patch(':id/execucao')
  registrarExecucao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarExecucaoDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.registrarExecucao(id, dto, user);
  }

  @Patch(':id/previsao')
  informarPrevisao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InformarPrevisaoDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.informarPrevisao(id, dto, user);
  }

  @Patch(':id')
  @Roles(TipoUsuario.GESTOR, TipoUsuario.ADMINISTRADOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdemServicoDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.update(id, dto, user.sub);
  }

  @Patch(':id/encerrar')
  @Roles(TipoUsuario.GESTOR, TipoUsuario.ADMINISTRADOR)
  encerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EncerrarOrdemServicoDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.ordensService.encerrar(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordensService.remove(id);
  }
}
