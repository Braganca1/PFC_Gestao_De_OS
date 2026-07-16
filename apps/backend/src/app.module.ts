import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';
import { AnexosModule } from './anexos/anexos.module';
import { EstatisticasModule } from './estatisticas/estatisticas.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { SecoesModule } from './secoes/secoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    UsuariosModule,
    OrdensServicoModule,
    AnexosModule,
    EstatisticasModule,
    NotificacoesModule,
    SecoesModule,
  ],
})
export class AppModule {}
