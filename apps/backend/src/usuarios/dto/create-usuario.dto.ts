import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { TipoUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsEnum(TipoUsuario)
  tipo: TipoUsuario;
}
