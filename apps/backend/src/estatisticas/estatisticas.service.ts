import { Injectable } from '@nestjs/common';
import { Prioridade, StatusOS, TipoOS } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const STATUS_VALORES: StatusOS[] = [
  'PEDIDO',
  'EM_ANALISE',
  'APROVADA',
  'EM_EXECUCAO',
  'CONCLUIDA',
  'CANCELADA',
];

const TIPO_VALORES: TipoOS[] = [
  'CONSTRUCAO_CIVIL',
  'ELETRICO',
  'INSTALACAO_AR_CONDICIONADO',
  'MANUTENCAO_AR_CONDICIONADO',
];

const PRIORIDADE_VALORES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];

@Injectable()
export class EstatisticasService {
  constructor(private readonly prisma: PrismaService) {}

  async obter() {
    const [
      totalOs,
      osAbertas,
      osConcluidas,
      grupoStatus,
      grupoTipo,
      grupoPrioridade,
      concluidas,
      ultimasOs,
    ] = await Promise.all([
      this.prisma.ordemServico.count(),
      this.prisma.ordemServico.count({
        where: { status: { notIn: ['CONCLUIDA', 'CANCELADA'] } },
      }),
      this.prisma.ordemServico.count({ where: { status: 'CONCLUIDA' } }),
      this.prisma.ordemServico.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.ordemServico.groupBy({
        by: ['tipo'],
        _count: { _all: true },
      }),
      this.prisma.ordemServico.groupBy({
        by: ['prioridade'],
        _count: { _all: true },
      }),
      this.prisma.ordemServico.findMany({
        where: { status: 'CONCLUIDA', encerradoEm: { not: null } },
        select: { dataHora: true, encerradoEm: true },
      }),
      this.prisma.ordemServico.findMany({
        take: 5,
        orderBy: { dataHora: 'desc' },
      }),
    ]);

    const porStatus = Object.fromEntries(
      STATUS_VALORES.map((s) => [s, 0]),
    ) as Record<StatusOS, number>;
    for (const g of grupoStatus) porStatus[g.status] = g._count._all;

    const porTipo = Object.fromEntries(
      TIPO_VALORES.map((t) => [t, 0]),
    ) as Record<TipoOS, number>;
    for (const g of grupoTipo) porTipo[g.tipo] = g._count._all;

    const porPrioridade = Object.fromEntries(
      PRIORIDADE_VALORES.map((p) => [p, 0]),
    ) as Record<Prioridade, number>;
    for (const g of grupoPrioridade) porPrioridade[g.prioridade] = g._count._all;

    let tempoMedioDias = 0;
    if (concluidas.length > 0) {
      const somaMs = concluidas.reduce((acc, os) => {
        if (!os.encerradoEm) return acc;
        return acc + (os.encerradoEm.getTime() - os.dataHora.getTime());
      }, 0);
      tempoMedioDias =
        Math.round((somaMs / concluidas.length / 86_400_000) * 10) / 10;
    }

    return {
      totalOs,
      osAbertas,
      osConcluidas,
      tempoMedioDias,
      porStatus,
      porTipo,
      porPrioridade,
      ultimasOs,
    };
  }
}
