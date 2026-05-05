import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';
import { AnexosModule } from './anexos/anexos.module';
import { EstatisticasModule } from './estatisticas/estatisticas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsuariosModule,
    OrdensServicoModule,
    AnexosModule,
    EstatisticasModule,
  ],
})
export class AppModule {}
