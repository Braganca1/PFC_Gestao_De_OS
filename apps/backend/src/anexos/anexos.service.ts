import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/current-user.decorator';
import { osPertenceAoUsuario } from '../ordens-servico/ordens-servico.service';

const metadados = {
  id: true,
  osId: true,
  nomeArquivo: true,
  tipoMime: true,
  tamanho: true,
  dataUpload: true,
} as const;

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
    if (
      !os ||
      (user.tipo === TipoUsuario.CLIENTE && !osPertenceAoUsuario(os, user))
    ) {
      throw new NotFoundException(`Ordem de serviço ${osId} não encontrada`);
    }

    return this.prisma.anexo.create({
      data: {
        osId,
        nomeArquivo: file.originalname,
        tipoMime: file.mimetype,
        conteudo: new Uint8Array(file.buffer),
        tamanho: file.size,
      },
      select: metadados,
    });
  }

  async findOne(id: number, user?: UsuarioAutenticado) {
    return this.buscarValidandoDono(id, user, false);
  }

  async obterParaDownload(id: number, user?: UsuarioAutenticado) {
    return this.buscarValidandoDono(id, user, true);
  }

  async remove(id: number, user?: UsuarioAutenticado) {
    await this.findOne(id, user);
    await this.prisma.anexo.delete({ where: { id } });
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
}
