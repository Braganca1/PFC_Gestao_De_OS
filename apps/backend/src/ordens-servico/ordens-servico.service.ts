import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusOS, TipoOS } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
import { EncerrarOrdemServicoDto } from './dto/encerrar-ordem-servico.dto';

export interface FindAllFiltros {
  numeroOs?: string;
  solicitante?: string;
  status?: StatusOS;
  tipo?: TipoOS;
}

const includeRelations = {
  osConstrucaoCivil: true,
  osEletrico: true,
  osInstalacaoArCondicionado: true,
  osManutencaoArCondicionado: true,
  executor: { select: { id: true, nome: true, email: true } },
} satisfies Prisma.OrdemServicoInclude;

type OrdemServicoComRelacoes = Prisma.OrdemServicoGetPayload<{
  include: typeof includeRelations;
}>;

type CampoMonitorado =
  | 'status'
  | 'prioridade'
  | 'executorId'
  | 'observacao'
  | 'descricao'
  | 'piso'
  | 'local'
  | 'encerradoPor'
  | 'observacoesFinais';

@Injectable()
export class OrdensServicoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrdemServicoDto) {
    this.validarDadosEspecificos(dto);

    const numeroOs = await this.gerarNumeroOs();

    return this.prisma.$transaction(async (tx) => {
      const os = await tx.ordemServico.create({
        data: {
          numeroOs,
          tipo: dto.tipo,
          prioridade: dto.prioridade,
          emailSolicitante: dto.emailSolicitante,
          secaoSolicitante: dto.secaoSolicitante,
          nomeRepresentante: dto.nomeRepresentante,
          descricao: dto.descricao,
          piso: dto.piso,
          local: dto.local,
        },
      });

      switch (dto.tipo) {
        case TipoOS.CONSTRUCAO_CIVIL:
          await tx.osConstrucaoCivil.create({ data: { osId: os.id } });
          break;
        case TipoOS.ELETRICO:
          await tx.osEletrico.create({ data: { osId: os.id } });
          break;
        case TipoOS.INSTALACAO_AR_CONDICIONADO:
          await tx.osInstalacaoArCondicionado.create({
            data: { osId: os.id, ...dto.dadosInstalacao! },
          });
          break;
        case TipoOS.MANUTENCAO_AR_CONDICIONADO:
          await tx.osManutencaoArCondicionado.create({
            data: { osId: os.id, ...dto.dadosManutencao! },
          });
          break;
      }

      return tx.ordemServico.findUniqueOrThrow({
        where: { id: os.id },
        include: includeRelations,
      });
    });
  }

  async findAll(filtros: FindAllFiltros) {
    const where: Prisma.OrdemServicoWhereInput = {};

    if (filtros.numeroOs) {
      where.numeroOs = { contains: filtros.numeroOs, mode: 'insensitive' };
    }
    if (filtros.solicitante) {
      where.OR = [
        { emailSolicitante: { contains: filtros.solicitante, mode: 'insensitive' } },
        { nomeRepresentante: { contains: filtros.solicitante, mode: 'insensitive' } },
      ];
    }
    if (filtros.status) where.status = filtros.status;
    if (filtros.tipo) where.tipo = filtros.tipo;

    return this.prisma.ordemServico.findMany({
      where,
      include: includeRelations,
      orderBy: { dataHora: 'desc' },
    });
  }

  async findOne(id: number) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!os) {
      throw new NotFoundException(`Ordem de serviço ${id} não encontrada`);
    }
    return os;
  }

  async update(id: number, dto: UpdateOrdemServicoDto) {
    const { usuarioId, ...patch } = dto;
    await this.validarUsuario(usuarioId);
    const antes = await this.findOne(id);

    if (patch.executorId !== undefined && patch.executorId !== null) {
      const executor = await this.prisma.usuario.findUnique({
        where: { id: patch.executorId },
      });
      if (!executor) {
        throw new BadRequestException(`Executor ${patch.executorId} não encontrado`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.ordemServico.update({
        where: { id },
        data: patch,
        include: includeRelations,
      });
      await this.registrarHistorico(tx, id, usuarioId, antes, depois, [
        'status',
        'prioridade',
        'executorId',
        'observacao',
        'descricao',
        'piso',
        'local',
      ]);
      return depois;
    });
  }

  async encerrar(id: number, dto: EncerrarOrdemServicoDto) {
    await this.validarUsuario(dto.usuarioId);
    const antes = await this.findOne(id);

    if (antes.status === StatusOS.CONCLUIDA) {
      throw new BadRequestException('OS já está concluída');
    }
    if (antes.status === StatusOS.CANCELADA) {
      throw new BadRequestException('OS está cancelada e não pode ser encerrada');
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.ordemServico.update({
        where: { id },
        data: {
          status: StatusOS.CONCLUIDA,
          encerradoEm: new Date(),
          encerradoPor: dto.encerradoPor,
          observacoesFinais: dto.observacoesFinais,
        },
        include: includeRelations,
      });
      await this.registrarHistorico(tx, id, dto.usuarioId, antes, depois, [
        'status',
        'encerradoPor',
        'observacoesFinais',
      ]);
      return depois;
    });
  }

  async findHistorico(id: number) {
    await this.findOne(id);
    return this.prisma.historicoOs.findMany({
      where: { osId: id },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { dataHora: 'desc' },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.ordemServico.delete({ where: { id } });
  }

  private async validarUsuario(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new BadRequestException(`Usuário ${usuarioId} não encontrado`);
    }
  }

  private async registrarHistorico(
    tx: Prisma.TransactionClient,
    osId: number,
    usuarioId: number,
    antes: OrdemServicoComRelacoes,
    depois: OrdemServicoComRelacoes,
    campos: CampoMonitorado[],
  ) {
    const dataHora = new Date();
    const entradas: Prisma.HistoricoOsCreateManyInput[] = [];

    for (const campo of campos) {
      const valorAntes = (antes as Record<string, unknown>)[campo];
      const valorDepois = (depois as Record<string, unknown>)[campo];
      if (valorAntes === valorDepois) continue;

      let campoAlterado: string = campo;
      let valorAnterior: string | null;
      let valorNovo: string | null;

      if (campo === 'executorId') {
        campoAlterado = 'executor';
        valorAnterior = antes.executor
          ? `${antes.executor.nome} (${antes.executor.email})`
          : null;
        valorNovo = depois.executor
          ? `${depois.executor.nome} (${depois.executor.email})`
          : null;
      } else {
        valorAnterior = valorAntes == null ? null : String(valorAntes);
        valorNovo = valorDepois == null ? null : String(valorDepois);
      }

      entradas.push({
        osId,
        usuarioId,
        campoAlterado,
        valorAnterior,
        valorNovo,
        dataHora,
      });
    }

    if (entradas.length > 0) {
      await tx.historicoOs.createMany({ data: entradas });
    }
  }

  private validarDadosEspecificos(dto: CreateOrdemServicoDto) {
    if (dto.tipo === TipoOS.INSTALACAO_AR_CONDICIONADO && !dto.dadosInstalacao) {
      throw new BadRequestException(
        'dadosInstalacao é obrigatório para tipo INSTALACAO_AR_CONDICIONADO',
      );
    }
    if (dto.tipo === TipoOS.MANUTENCAO_AR_CONDICIONADO && !dto.dadosManutencao) {
      throw new BadRequestException(
        'dadosManutencao é obrigatório para tipo MANUTENCAO_AR_CONDICIONADO',
      );
    }
  }

  private async gerarNumeroOs(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `OS-${ano}-`;
    const count = await this.prisma.ordemServico.count({
      where: { numeroOs: { startsWith: prefixo } },
    });
    return `${prefixo}${String(count + 1).padStart(4, '0')}`;
  }
}
