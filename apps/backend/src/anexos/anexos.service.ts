import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UPLOADS_ROOT } from './multer.config';

@Injectable()
export class AnexosService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(osId: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
    });
    if (!os) {
      try {
        rmSync(file.path, { force: true });
      } catch {
        // ignore
      }
      throw new NotFoundException(`Ordem de serviço ${osId} não encontrada`);
    }

    return this.prisma.anexo.create({
      data: {
        osId,
        nomeArquivo: file.originalname,
        tipoMime: file.mimetype,
        caminho: file.filename,
        tamanho: file.size,
      },
    });
  }

  async findOne(id: number) {
    const anexo = await this.prisma.anexo.findUnique({ where: { id } });
    if (!anexo) {
      throw new NotFoundException(`Anexo ${id} não encontrado`);
    }
    return anexo;
  }

  caminhoAbsoluto(anexo: { osId: number; caminho: string }): string {
    return join(UPLOADS_ROOT, String(anexo.osId), anexo.caminho);
  }

  async remove(id: number) {
    const anexo = await this.findOne(id);
    const caminho = this.caminhoAbsoluto(anexo);
    await this.prisma.anexo.delete({ where: { id } });
    if (existsSync(caminho)) {
      try {
        rmSync(caminho, { force: true });
      } catch {
        // ignora erro de IO; registro já foi removido
      }
    }
  }
}
