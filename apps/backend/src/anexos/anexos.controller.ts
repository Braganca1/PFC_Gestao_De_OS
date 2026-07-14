import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  CurrentUser,
  UsuarioAutenticado,
} from '../auth/current-user.decorator';
import { AnexosService } from './anexos.service';
import { multerConfig } from './multer.config';

@Controller()
export class AnexosController {
  constructor(private readonly anexosService: AnexosService) {}

  @Post('ordens-servico/:osId/anexos')
  @UseInterceptors(FileInterceptor('arquivo', multerConfig))
  upload(
    @Param('osId', ParseIntPipe) osId: number,
    @CurrentUser() user: UsuarioAutenticado,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.anexosService.upload(osId, user, file);
  }

  @Get('anexos/:id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
    @Res() res: Response,
  ) {
    const anexo = await this.anexosService.obterParaDownload(id, user);
    res.setHeader('Content-Type', anexo.tipoMime);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(anexo.nomeArquivo)}"`,
    );
    res.send(Buffer.from(anexo.conteudo!));
  }

  @Delete('anexos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.anexosService.remove(id, user);
  }
}
