import { Module } from '@nestjs/common';
import { SecoesController } from './secoes.controller';
import { SecoesService } from './secoes.service';

@Module({
  controllers: [SecoesController],
  providers: [SecoesService],
})
export class SecoesModule {}
