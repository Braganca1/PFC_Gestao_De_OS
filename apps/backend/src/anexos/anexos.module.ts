import { Module } from '@nestjs/common';
import { AnexosController } from './anexos.controller';
import { AnexosService } from './anexos.service';

@Module({
  controllers: [AnexosController],
  providers: [AnexosService],
})
export class AnexosModule {}
