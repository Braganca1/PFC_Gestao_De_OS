import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto) {
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existente) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const senhaHash = await bcrypt.hash(dto.senha, SALT_ROUNDS);
    const usuario = await this.prisma.usuario.create({
      data: { ...dto, senha: senhaHash },
    });
    return this.semSenha(usuario);
  }

  async findAll() {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { id: 'asc' },
    });
    return usuarios.map((u) => this.semSenha(u));
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }
    return this.semSenha(usuario);
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    if (dto.email) {
      const outro = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });
      if (outro && outro.id !== id) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.senha) {
      data.senha = await bcrypt.hash(dto.senha, SALT_ROUNDS);
    }

    const usuario = await this.prisma.usuario.update({ where: { id }, data });
    return this.semSenha(usuario);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.usuario.delete({ where: { id } });
  }

  private semSenha<T extends { senha: string | null }>(u: T): Omit<T, 'senha'> {
    const { senha: _senha, ...resto } = u;
    return resto;
  }
}
