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
      grupoExecutor,
      executoresCadastrados,
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
      this.prisma.ordemServico.groupBy({
        by: ['executorId'],
        where: { status: { notIn: ['CONCLUIDA', 'CANCELADA'] } },
        _count: { _all: true },
      }),
      this.prisma.usuario.findMany({
        where: { tipo: 'EXECUTOR' },
        select: { id: true, nome: true },
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

    // carga de OS ativas por executor: todos os EXECUTOR cadastrados (mesmo com 0)
    // + quaisquer outros usuários designados + as OS ainda sem executor
    const contagemPorExecutor = new Map<number | null, number>(
      grupoExecutor.map((g) => [g.executorId, g._count._all]),
    );
    const idsDesignados = grupoExecutor
      .map((g) => g.executorId)
      .filter((id): id is number => id !== null)
      .filter((id) => !executoresCadastrados.some((e) => e.id === id));
    const designadosExtras = idsDesignados.length
      ? await this.prisma.usuario.findMany({
          where: { id: { in: idsDesignados } },
          select: { id: true, nome: true },
        })
      : [];

    const porExecutor = [...executoresCadastrados, ...designadosExtras]
      .map((e) => ({
        id: e.id as number | null,
        nome: e.nome,
        total: contagemPorExecutor.get(e.id) ?? 0,
      }))
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));

    const semExecutor = contagemPorExecutor.get(null) ?? 0;
    if (semExecutor > 0) {
      porExecutor.push({ id: null, nome: 'Sem executor', total: semExecutor });
    }

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
      porExecutor,
      ultimasOs,
    };
  }
}
