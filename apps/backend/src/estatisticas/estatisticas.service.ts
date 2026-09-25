import { Injectable } from '@nestjs/common';
import { Prioridade, Prisma, StatusOS, TipoOS } from '@prisma/client';
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

  /**
   * Métricas agregadas das OS. Sem parâmetros considera todas as OS;
   * com `inicio`/`fim` considera apenas as OS criadas no intervalo
   * (base dos relatórios por período — RF10).
   */
  async obter(inicio?: Date, fim?: Date) {
    const noPeriodo: Prisma.OrdemServicoWhereInput = {};
    if (inicio || fim) {
      noPeriodo.dataHora = {
        ...(inicio ? { gte: inicio } : {}),
        ...(fim ? { lte: fim } : {}),
      };
    }

    const [
      totalOs,
      osAbertas,
      osConcluidas,
      grupoStatus,
      grupoTipo,
      grupoPrioridade,
      grupoSecao,
      datasCriacao,
      concluidas,
      ultimasOs,
      grupoExecutor,
      executoresCadastrados,
    ] = await Promise.all([
      this.prisma.ordemServico.count({ where: noPeriodo }),
      this.prisma.ordemServico.count({
        where: { ...noPeriodo, status: { notIn: ['CONCLUIDA', 'CANCELADA'] } },
      }),
      this.prisma.ordemServico.count({
        where: { ...noPeriodo, status: 'CONCLUIDA' },
      }),
      this.prisma.ordemServico.groupBy({
        by: ['status'],
        where: noPeriodo,
        _count: { _all: true },
      }),
      this.prisma.ordemServico.groupBy({
        by: ['tipo'],
        where: noPeriodo,
        _count: { _all: true },
      }),
      this.prisma.ordemServico.groupBy({
        by: ['prioridade'],
        where: noPeriodo,
        _count: { _all: true },
      }),
      // OS por setor (RF10)
      this.prisma.ordemServico.groupBy({
        by: ['secaoSolicitante'],
        where: noPeriodo,
        _count: { _all: true },
      }),
      // base do volume mensal (RF05 — volume de demandas por período)
      this.prisma.ordemServico.findMany({
        where: noPeriodo,
        select: { dataHora: true },
      }),
      this.prisma.ordemServico.findMany({
        where: {
          ...noPeriodo,
          status: 'CONCLUIDA',
          encerradoEm: { not: null },
        },
        select: { dataHora: true, encerradoEm: true },
      }),
      this.prisma.ordemServico.findMany({
        where: noPeriodo,
        take: 5,
        orderBy: { dataHora: 'desc' },
      }),
      // carga por executor é métrica "do agora" (OS ativas) — não usa o período
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

    const porSecao = grupoSecao
      .map((g) => ({ secao: g.secaoSolicitante, total: g._count._all }))
      .sort((a, b) => b.total - a.total || a.secao.localeCompare(b.secao));

    // agrega OS criadas por mês (chave YYYY-MM), em ordem cronológica
    const porMes = new Map<string, number>();
    for (const { dataHora } of datasCriacao) {
      const chave = `${dataHora.getFullYear()}-${String(dataHora.getMonth() + 1).padStart(2, '0')}`;
      porMes.set(chave, (porMes.get(chave) ?? 0) + 1);
    }
    const volumeMensal = [...porMes.entries()]
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

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
      porSecao,
      porExecutor,
      volumeMensal,
      ultimasOs,
    };
  }
}
