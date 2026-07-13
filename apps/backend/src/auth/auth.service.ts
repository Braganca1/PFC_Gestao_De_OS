import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TipoUsuario, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from './current-user.decorator';

export interface LoginResult {
  accessToken: string;
  usuario: Omit<Usuario, 'senha'>;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async login(email: string, senha: string): Promise<LoginResult> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.senha) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    return this.emitirToken(usuario);
  }

  async loginGoogle(idToken: string): Promise<LoginResult> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_ID não configurado no servidor',
      );
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token do Google inválido');
    }

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException(
        'Conta Google sem e-mail verificado',
      );
    }

    let usuario = await this.prisma.usuario.findUnique({
      where: { email: payload.email },
    });
    if (!usuario) {
      usuario = await this.prisma.usuario.create({
        data: {
          nome: this.nomeProprio(payload.name ?? payload.email),
          email: payload.email,
          senha: null,
          tipo: TipoUsuario.CLIENTE,
        },
      });
    }
    return this.emitirToken(usuario);
  }

  private nomeProprio(nome: string): string {
    const particulas = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
    return nome
      .toLocaleLowerCase('pt-BR')
      .split(/\s+/)
      .map((parte, i) =>
        i > 0 && particulas.has(parte)
          ? parte
          : parte.charAt(0).toLocaleUpperCase('pt-BR') + parte.slice(1),
      )
      .join(' ');
  }

  async me(id: number): Promise<Omit<Usuario, 'senha'>> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.semSenha(usuario);
  }

  private async emitirToken(usuario: Usuario): Promise<LoginResult> {
    const payload: UsuarioAutenticado = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      tipo: usuario.tipo,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: this.semSenha(usuario),
    };
  }

  private semSenha(usuario: Usuario): Omit<Usuario, 'senha'> {
    const { senha: _senha, ...resto } = usuario;
    return resto;
  }
}
