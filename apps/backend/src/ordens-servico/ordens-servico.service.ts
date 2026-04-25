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
          observacao: dto.observacao,
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
    await this.findOne(id);

    if (dto.executorId !== undefined) {
      const executor = await this.prisma.usuario.findUnique({
        where: { id: dto.executorId },
      });
      if (!executor) {
        throw new BadRequestException(`Executor ${dto.executorId} não encontrado`);
      }
    }

    return this.prisma.ordemServico.update({
      where: { id },
      data: dto,
      include: includeRelations,
    });
  }

  async encerrar(id: number, dto: EncerrarOrdemServicoDto) {
    const os = await this.findOne(id);

    if (os.status === StatusOS.CONCLUIDA) {
      throw new BadRequestException('OS já está concluída');
    }
    if (os.status === StatusOS.CANCELADA) {
      throw new BadRequestException('OS está cancelada e não pode ser encerrada');
    }

    return this.prisma.ordemServico.update({
      where: { id },
      data: {
        status: StatusOS.CONCLUIDA,
        encerradoEm: new Date(),
        encerradoPor: dto.encerradoPor,
        observacoesFinais: dto.observacoesFinais,
      },
      include: includeRelations,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.ordemServico.delete({ where: { id } });
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
