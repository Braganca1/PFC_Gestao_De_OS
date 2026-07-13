import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TipoUsuario } from '@prisma/client';

export interface UsuarioAutenticado {
  sub: number;
  email: string;
  nome: string;
  tipo: TipoUsuario;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
