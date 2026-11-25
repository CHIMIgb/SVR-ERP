import { Module } from '@nestjs/common';
import { FlotaCampoController } from './flota-campo.controller';
import { FlotaCampoService } from './flota-campo.service';

/** PWA del Técnico: GET /maquinas/campo. PrismaService es global; no audita (solo lectura). */
@Module({
  controllers: [FlotaCampoController],
  providers: [FlotaCampoService],
})
export class FlotaCampoModule {}
