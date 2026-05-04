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
import { AnexosService } from './anexos.service';
import { multerConfig } from './multer.config';

@Controller()
export class AnexosController {
  constructor(private readonly anexosService: AnexosService) {}

  @Post('ordens-servico/:osId/anexos')
  @UseInterceptors(FileInterceptor('arquivo', multerConfig))
  upload(
    @Param('osId', ParseIntPipe) osId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.anexosService.upload(osId, file);
  }

  @Get('anexos/:id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const anexo = await this.anexosService.findOne(id);
    const caminho = this.anexosService.caminhoAbsoluto(anexo);
    res.setHeader('Content-Type', anexo.tipoMime);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(anexo.nomeArquivo)}"`,
    );
    res.sendFile(caminho);
  }

  @Delete('anexos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.anexosService.remove(id);
  }
}
