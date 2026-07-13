import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TipoUsuario } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { UsuarioAutenticado } from './current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<TipoUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();
    const user = request.user;
    if (!user || !roles.includes(user.tipo)) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação',
      );
    }
    return true;
  }
}
