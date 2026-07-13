import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsuarioAutenticado } from './current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extrairToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de acesso não informado');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<UsuarioAutenticado>(token);
      (request as Request & { user: UsuarioAutenticado }).user = payload;
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado');
    }
    return true;
  }

  private extrairToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;
    // permite `?token=` para recursos referenciados por URL (ex.: download de anexos)
    const queryToken = request.query?.token;
    return typeof queryToken === 'string' ? queryToken : undefined;
  }
}
