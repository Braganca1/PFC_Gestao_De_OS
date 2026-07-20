import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import convert = require('heic-convert');
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/current-user.decorator';
import { usuarioPodeAcessarOs } from '../ordens-servico/ordens-servico.service';

const metadados = {
  id: true,
  osId: true,
  nomeArquivo: true,
  tipoMime: true,
  tamanho: true,
  dataUpload: true,
} as const;

const MIMES_HEIC = new Set(['image/heic', 'image/heif']);

@Injectable()
export class AnexosService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    osId: number,
    user: UsuarioAutenticado,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
    });
    if (!os || !usuarioPodeAcessarOs(os, user)) {
      throw new NotFoundException(`Ordem de serviço ${osId} não encontrada`);
    }

    let conteudo = new Uint8Array(file.buffer);
    let tipoMime = file.mimetype;
    let nomeArquivo = file.originalname;

    if (MIMES_HEIC.has(tipoMime)) {
      try {
        const jpeg = await convert({
          buffer: file.buffer,
          format: 'JPEG',
          quality: 0.9,
        });
        conteudo = new Uint8Array(jpeg);
        tipoMime = 'image/jpeg';
        nomeArquivo = `${nomeArquivo.replace(/\.(heic|heif)$/i, '')}.jpg`;
      } catch {
        throw new BadRequestException('Arquivo HEIC inválido ou corrompido');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const anexo = await tx.anexo.create({
        data: {
          osId,
          nomeArquivo,
          tipoMime,
          conteudo,
          tamanho: conteudo.length,
        },
        select: metadados,
      });
      await tx.historicoOs.create({
        data: {
          osId,
          usuarioId: user.sub,
          campoAlterado: 'anexo',
          valorNovo: nomeArquivo,
        },
      });
      return anexo;
    });
  }

  async findOne(id: number, user?: UsuarioAutenticado) {
    return this.buscarValidandoDono(id, user, false);
  }

  async obterParaDownload(id: number, user?: UsuarioAutenticado) {
    return this.buscarValidandoDono(id, user, true);
  }

  async remove(id: number, user: UsuarioAutenticado) {
    const anexo = await this.findOne(id, user);
    await this.prisma.$transaction(async (tx) => {
      await tx.anexo.delete({ where: { id } });
      await tx.historicoOs.create({
        data: {
          osId: anexo.osId,
          usuarioId: user.sub,
          campoAlterado: 'anexo',
          valorAnterior: anexo.nomeArquivo,
        },
      });
    });
  }

  private async buscarValidandoDono(
    id: number,
    user: UsuarioAutenticado | undefined,
    comConteudo: boolean,
  ) {
    const anexo = await this.prisma.anexo.findUnique({
      where: { id },
      select: {
        ...metadados,
        conteudo: comConteudo,
        ordemServico: {
          select: {
            solicitanteId: true,
            emailSolicitante: true,
            executorId: true,
          },
        },
      },
    });
    if (!anexo || (user && !usuarioPodeAcessarOs(anexo.ordemServico, user))) {
      throw new NotFoundException(`Anexo ${id} não encontrado`);
    }
    return anexo;
  }
}
