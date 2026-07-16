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
} from '@nestjs/common';
import { TipoUsuario } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { SecoesService } from './secoes.service';
import { CreateSecaoDto } from './dto/create-secao.dto';

@Controller('secoes')
export class SecoesController {
  constructor(private readonly secoesService: SecoesService) {}

  @Post()
  @Roles(TipoUsuario.ADMINISTRADOR)
  create(@Body() dto: CreateSecaoDto) {
    return this.secoesService.create(dto);
  }

  @Get()
  findAll() {
    return this.secoesService.findAll();
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMINISTRADOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSecaoDto) {
    return this.secoesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.secoesService.remove(id);
  }
}
