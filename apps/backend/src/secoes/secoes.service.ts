import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSecaoDto } from './dto/create-secao.dto';

@Injectable()
export class SecoesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSecaoDto) {
    const nome = dto.nome.trim();
    const existente = await this.prisma.secao.findUnique({ where: { nome } });
    if (existente) {
      throw new ConflictException('Já existe uma seção com este nome');
    }
    return this.prisma.secao.create({ data: { nome } });
  }

  findAll() {
    return this.prisma.secao.findMany({ orderBy: { nome: 'asc' } });
  }

  async update(id: number, dto: CreateSecaoDto) {
    await this.findOne(id);
    const nome = dto.nome.trim();
    const outra = await this.prisma.secao.findUnique({ where: { nome } });
    if (outra && outra.id !== id) {
      throw new ConflictException('Já existe uma seção com este nome');
    }
    return this.prisma.secao.update({ where: { id }, data: { nome } });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.secao.delete({ where: { id } });
  }

  private async findOne(id: number) {
    const secao = await this.prisma.secao.findUnique({ where: { id } });
    if (!secao) {
      throw new NotFoundException(`Seção ${id} não encontrada`);
    }
    return secao;
  }
}
