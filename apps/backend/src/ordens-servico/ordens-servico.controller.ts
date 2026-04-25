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
import { StatusOS, TipoOS } from '@prisma/client';
import { OrdensServicoService } from './ordens-servico.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
import { EncerrarOrdemServicoDto } from './dto/encerrar-ordem-servico.dto';

@Controller('ordens-servico')
export class OrdensServicoController {
  constructor(private readonly ordensService: OrdensServicoService) {}

  @Post()
  create(@Body() dto: CreateOrdemServicoDto) {
    return this.ordensService.create(dto);
  }

  @Get()
  findAll(
    @Query('numeroOs') numeroOs?: string,
    @Query('solicitante') solicitante?: string,
    @Query('status') status?: StatusOS,
    @Query('tipo') tipo?: TipoOS,
  ) {
    return this.ordensService.findAll({ numeroOs, solicitante, status, tipo });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordensService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdemServicoDto,
  ) {
    return this.ordensService.update(id, dto);
  }

  @Patch(':id/encerrar')
  encerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EncerrarOrdemServicoDto,
  ) {
    return this.ordensService.encerrar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordensService.remove(id);
  }
}
