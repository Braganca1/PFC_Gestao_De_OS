import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';
import { AnexosModule } from './anexos/anexos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsuariosModule,
    OrdensServicoModule,
    AnexosModule,
  ],
})
export class AppModule {}
