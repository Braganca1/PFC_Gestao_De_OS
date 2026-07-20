import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusOS, TipoOS, TipoUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/current-user.decorator';
import {
  NotificacoesService,
  TIPO_NOTIFICACAO,
} from '../notificacoes/notificacoes.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
import { EncerrarOrdemServicoDto } from './dto/encerrar-ordem-servico.dto';
import { RegistrarExecucaoDto } from './dto/registrar-execucao.dto';
import { InformarPrevisaoDto } from './dto/informar-previsao.dto';

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
  solicitante: { select: { id: true, nome: true, email: true } },
  anexos: {
    orderBy: { dataUpload: 'desc' },
    // apenas metadados — nunca carregar os bytes do conteúdo nas listagens
    select: {
      id: true,
      osId: true,
      nomeArquivo: true,
      tipoMime: true,
      tamanho: true,
      dataUpload: true,
    },
  },
} satisfies Prisma.OrdemServicoInclude;

/** Verifica se a OS pertence ao usuário (vínculo direto ou e-mail de solicitante legado). */
export function osPertenceAoUsuario(
  os: { solicitanteId: number | null; emailSolicitante: string },
  user: UsuarioAutenticado,
): boolean {
  return (
    os.solicitanteId === user.sub ||
    os.emailSolicitante.toLowerCase() === user.email.toLowerCase()
  );
}

export function usuarioPodeAcessarOs(
  os: {
    solicitanteId: number | null;
    emailSolicitante: string;
    executorId: number | null;
  },
  user: UsuarioAutenticado,
): boolean {
  switch (user.tipo) {
    case TipoUsuario.CLIENTE:
      return osPertenceAoUsuario(os, user);
    case TipoUsuario.EXECUTOR:
      return osPertenceAoUsuario(os, user) || os.executorId === user.sub;
    default:
      return true;
  }
}

type OrdemServicoComRelacoes = Prisma.OrdemServicoGetPayload<{
  include: typeof includeRelations;
}>;

const STATUS_LABEL: Record<StatusOS, string> = {
  PEDIDO: 'Pedido',
  EM_ANALISE: 'Em análise',
  APROVADA: 'Aprovada',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

type CampoMonitorado =
  | 'status'
  | 'prioridade'
  | 'executorId'
  | 'observacao'
  | 'descricao'
  | 'piso'
  | 'local'
  | 'encerradoPor'
  | 'observacoesFinais'
  | 'atividadesExecutadas'
  | 'dataExecucao'
  | 'materiaisUtilizados'
  | 'previsaoConclusao';

@Injectable()
export class OrdensServicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  /** IDs de todos os gestores/administradores, exceto o autor da ação. */
  private async idsGestores(
    tx: Prisma.TransactionClient,
    exceto: number,
  ): Promise<number[]> {
    const gestores = await tx.usuario.findMany({
      where: {
        tipo: { in: [TipoUsuario.GESTOR, TipoUsuario.ADMINISTRADOR] },
        id: { not: exceto },
      },
      select: { id: true },
    });
    return gestores.map((g) => g.id);
  }

  async create(dto: CreateOrdemServicoDto, user: UsuarioAutenticado) {
    this.validarDadosEspecificos(dto);

    const numeroOs = await this.gerarNumeroOs();
    const emailSolicitante =
      user.tipo === TipoUsuario.CLIENTE || user.tipo === TipoUsuario.EXECUTOR
        ? user.email
        : dto.emailSolicitante;

    return this.prisma.$transaction(async (tx) => {
      const os = await tx.ordemServico.create({
        data: {
          numeroOs,
          tipo: dto.tipo,
          prioridade: dto.prioridade,
          solicitanteId: user.sub,
          emailSolicitante,
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

      await this.notificacoes.criarVarias(
        tx,
        await this.idsGestores(tx, user.sub),
        {
          osId: os.id,
          tipo: TIPO_NOTIFICACAO.NOVA_OS,
          titulo: `Nova OS ${numeroOs} aberta por ${user.nome}`,
        },
      );

      return tx.ordemServico.findUniqueOrThrow({
        where: { id: os.id },
        include: includeRelations,
      });
    });
  }

  async findAll(filtros: FindAllFiltros, user: UsuarioAutenticado) {
    const where: Prisma.OrdemServicoWhereInput = {
      AND: [this.whereVisivelPara(user)],
    };

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

  async findOne(id: number, user?: UsuarioAutenticado) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!os || (user && !usuarioPodeAcessarOs(os, user))) {
      throw new NotFoundException(`Ordem de serviço ${id} não encontrada`);
    }
    return os;
  }

  async update(id: number, dto: UpdateOrdemServicoDto, usuarioId: number) {
    const patch = dto;
    await this.validarUsuario(usuarioId);
    const antes = await this.findOne(id);
    this.validarNaoTerminal(antes.status);

    if (patch.status === StatusOS.CONCLUIDA) {
      throw new BadRequestException(
        'Para concluir a OS utilize o encerramento formal',
      );
    }

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

      if (
        depois.executorId !== antes.executorId &&
        depois.executorId != null &&
        depois.executorId !== usuarioId
      ) {
        await this.notificacoes.criar(tx, {
          osId: id,
          destinatarioId: depois.executorId,
          tipo: TIPO_NOTIFICACAO.OS_ATRIBUIDA,
          titulo: `Você foi designado executor da OS ${depois.numeroOs}`,
        });
      }
      if (
        depois.status !== antes.status &&
        antes.solicitanteId != null &&
        antes.solicitanteId !== usuarioId
      ) {
        await this.notificacoes.criar(tx, {
          osId: id,
          destinatarioId: antes.solicitanteId,
          tipo: TIPO_NOTIFICACAO.MUDANCA_STATUS,
          titulo: `OS ${depois.numeroOs}: ${STATUS_LABEL[antes.status]} → ${STATUS_LABEL[depois.status]}`,
        });
      }

      return depois;
    });
  }

  async encerrar(
    id: number,
    dto: EncerrarOrdemServicoDto,
    usuarioId: number,
  ) {
    await this.validarUsuario(usuarioId);
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
      await this.registrarHistorico(tx, id, usuarioId, antes, depois, [
        'status',
        'encerradoPor',
        'observacoesFinais',
      ]);

      if (antes.solicitanteId != null && antes.solicitanteId !== usuarioId) {
        await this.notificacoes.criar(tx, {
          osId: id,
          destinatarioId: antes.solicitanteId,
          tipo: TIPO_NOTIFICACAO.OS_CONCLUIDA,
          titulo: `OS ${depois.numeroOs} concluída`,
        });
      }

      return depois;
    });
  }

  async cancelar(id: number, user: UsuarioAutenticado) {
    const antes = await this.findOne(id, user);

    if (
      user.tipo === TipoUsuario.CLIENTE &&
      antes.status !== StatusOS.PEDIDO
    ) {
      throw new BadRequestException(
        'A solicitação só pode ser cancelada enquanto estiver com status Pedido',
      );
    }
    if (
      antes.status === StatusOS.CANCELADA ||
      antes.status === StatusOS.CONCLUIDA
    ) {
      throw new BadRequestException('OS já está encerrada');
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.ordemServico.update({
        where: { id },
        data: { status: StatusOS.CANCELADA },
        include: includeRelations,
      });
      await this.registrarHistorico(tx, id, user.sub, antes, depois, [
        'status',
      ]);

      await this.notificacoes.criarVarias(
        tx,
        await this.idsGestores(tx, user.sub),
        {
          osId: id,
          tipo: TIPO_NOTIFICACAO.OS_CANCELADA,
          titulo: `Solicitação ${depois.numeroOs} cancelada por ${user.nome}`,
        },
      );

      return depois;
    });
  }

  async registrarExecucao(
    id: number,
    dto: RegistrarExecucaoDto,
    user: UsuarioAutenticado,
  ) {
    const antes = await this.findOne(id, user);

    if (
      user.tipo === TipoUsuario.CLIENTE ||
      (user.tipo === TipoUsuario.EXECUTOR && antes.executorId !== user.sub)
    ) {
      throw new NotFoundException(`Ordem de serviço ${id} não encontrada`);
    }
    this.validarNaoTerminal(antes.status);

    const dataExecucao = new Date(dto.dataExecucao);
    const fimDeHoje = new Date();
    fimDeHoje.setHours(23, 59, 59, 999);
    if (dataExecucao > fimDeHoje) {
      throw new BadRequestException('Data da execução não pode ser futura');
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.ordemServico.update({
        where: { id },
        data: {
          atividadesExecutadas: dto.atividadesExecutadas,
          dataExecucao,
          materiaisUtilizados: dto.materiaisUtilizados,
        },
        include: includeRelations,
      });
      await this.registrarHistorico(tx, id, user.sub, antes, depois, [
        'atividadesExecutadas',
        'dataExecucao',
        'materiaisUtilizados',
      ]);
      await this.notificacoes.criarVarias(
        tx,
        await this.idsGestores(tx, user.sub),
        {
          osId: id,
          tipo: TIPO_NOTIFICACAO.REGISTRO_EXECUCAO,
          titulo: `Execução registrada na OS ${depois.numeroOs} por ${user.nome}`,
        },
      );
      return depois;
    });
  }

  async informarPrevisao(
    id: number,
    dto: InformarPrevisaoDto,
    user: UsuarioAutenticado,
  ) {
    const antes = await this.findOne(id, user);

    // cliente não informa previsão; executor só nas OS atribuídas a ele
    if (
      user.tipo === TipoUsuario.CLIENTE ||
      (user.tipo === TipoUsuario.EXECUTOR && antes.executorId !== user.sub)
    ) {
      throw new NotFoundException(`Ordem de serviço ${id} não encontrada`);
    }
    this.validarNaoTerminal(antes.status);

    const previsao = new Date(dto.previsaoConclusao);
    const inicioDeHoje = new Date();
    inicioDeHoje.setHours(0, 0, 0, 0);
    if (previsao < inicioDeHoje) {
      throw new BadRequestException(
        'Previsão de conclusão não pode ser uma data passada',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.ordemServico.update({
        where: { id },
        data: { previsaoConclusao: previsao },
        include: includeRelations,
      });
      await this.registrarHistorico(tx, id, user.sub, antes, depois, [
        'previsaoConclusao',
      ]);
      if (
        antes.solicitanteId != null &&
        antes.solicitanteId !== user.sub &&
        antes.previsaoConclusao?.getTime() !== previsao.getTime()
      ) {
        await this.notificacoes.criar(tx, {
          osId: id,
          destinatarioId: antes.solicitanteId,
          tipo: TIPO_NOTIFICACAO.PREVISAO_CONCLUSAO,
          titulo: `OS ${depois.numeroOs}: previsão de conclusão ${previsao.toLocaleDateString('pt-BR')}`,
        });
      }
      return depois;
    });
  }

  private validarNaoTerminal(status: StatusOS) {
    if (status === StatusOS.CONCLUIDA || status === StatusOS.CANCELADA) {
      throw new BadRequestException(
        'OS concluída ou cancelada não pode mais ser alterada',
      );
    }
  }

  async findHistorico(id: number, user?: UsuarioAutenticado) {
    await this.findOne(id, user);
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

  private whereVisivelPara(
    user: UsuarioAutenticado,
  ): Prisma.OrdemServicoWhereInput {
    const dono: Prisma.OrdemServicoWhereInput[] = [
      { solicitanteId: user.sub },
      { emailSolicitante: { equals: user.email, mode: 'insensitive' } },
    ];
    switch (user.tipo) {
      case TipoUsuario.CLIENTE:
        return { OR: dono };
      case TipoUsuario.EXECUTOR:
        return { OR: [...dono, { executorId: user.sub }] };
      default:
        return {};
    }
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
