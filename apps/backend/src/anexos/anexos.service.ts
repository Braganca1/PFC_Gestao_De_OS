import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoUsuario } from '@prisma/client';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/current-user.decorator';
import { osPertenceAoUsuario } from '../ordens-servico/ordens-servico.service';
import { UPLOADS_ROOT } from './multer.config';

@Injectable()
export class AnexosService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(osId: number, user: UsuarioAutenticado, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
    });
    if (
      !os ||
      (user.tipo === TipoUsuario.CLIENTE && !osPertenceAoUsuario(os, user))
    ) {
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

  async findOne(id: number, user?: UsuarioAutenticado) {
    const anexo = await this.prisma.anexo.findUnique({
      where: { id },
      include: {
        ordemServico: {
          select: { solicitanteId: true, emailSolicitante: true },
        },
      },
    });
    if (
      !anexo ||
      (user &&
        user.tipo === TipoUsuario.CLIENTE &&
        !osPertenceAoUsuario(anexo.ordemServico, user))
    ) {
      throw new NotFoundException(`Anexo ${id} não encontrado`);
    }
    return anexo;
  }

  caminhoAbsoluto(anexo: { osId: number; caminho: string }): string {
    return join(UPLOADS_ROOT, String(anexo.osId), anexo.caminho);
  }

  async remove(id: number, user?: UsuarioAutenticado) {
    const anexo = await this.findOne(id, user);
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
