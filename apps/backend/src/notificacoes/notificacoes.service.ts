import { Injectable, NotFoundException } from '@nestjs/common';
import { CanalNotificacao, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/current-user.decorator';

export const TIPO_NOTIFICACAO = {
  NOVA_OS: 'NOVA_OS',
  OS_ATRIBUIDA: 'OS_ATRIBUIDA',
  MUDANCA_STATUS: 'MUDANCA_STATUS',
  OS_CONCLUIDA: 'OS_CONCLUIDA',
  OS_CANCELADA: 'OS_CANCELADA',
  REGISTRO_EXECUCAO: 'REGISTRO_EXECUCAO',
  PREVISAO_CONCLUSAO: 'PREVISAO_CONCLUSAO',
} as const;

export interface NovaNotificacao {
  osId: number;
  destinatarioId: number;
  tipo: string;
  titulo: string;
}

@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(tx: Prisma.TransactionClient, dados: NovaNotificacao) {
    return tx.notificacao.create({
      data: { ...dados, canal: CanalNotificacao.INTERNO },
    });
  }

  async criarVarias(
    tx: Prisma.TransactionClient,
    destinatarioIds: number[],
    dados: Omit<NovaNotificacao, 'destinatarioId'>,
  ) {
    if (destinatarioIds.length === 0) return;
    await tx.notificacao.createMany({
      data: destinatarioIds.map((destinatarioId) => ({
        ...dados,
        destinatarioId,
        canal: CanalNotificacao.INTERNO,
      })),
    });
  }

  listar(user: UsuarioAutenticado) {
    return this.prisma.notificacao.findMany({
      where: { destinatarioId: user.sub },
      include: { ordemServico: { select: { id: true, numeroOs: true } } },
      orderBy: { dataHora: 'desc' },
      take: 50,
    });
  }

  async contarNaoLidas(user: UsuarioAutenticado) {
    const total = await this.prisma.notificacao.count({
      where: { destinatarioId: user.sub, lida: false },
    });
    return { total };
  }

  async marcarLida(id: number, user: UsuarioAutenticado) {
    const notificacao = await this.prisma.notificacao.findUnique({
      where: { id },
    });
    if (!notificacao || notificacao.destinatarioId !== user.sub) {
      throw new NotFoundException(`Notificação ${id} não encontrada`);
    }
    return this.prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  async marcarTodasLidas(user: UsuarioAutenticado) {
    await this.prisma.notificacao.updateMany({
      where: { destinatarioId: user.sub, lida: false },
      data: { lida: true },
    });
  }
}
