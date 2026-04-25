import { Module } from '@nestjs/common';
import { OrdensServicoController } from './ordens-servico.controller';
import { OrdensServicoService } from './ordens-servico.service';

@Module({
  controllers: [OrdensServicoController],
  providers: [OrdensServicoService],
  exports: [OrdensServicoService],
})
export class OrdensServicoModule {}
