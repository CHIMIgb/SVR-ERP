import { Module } from '@nestjs/common';
import { DespachosController } from './despachos.controller';
import { DespachosService } from './despachos.service';
import { MaquinasModule } from '../maquinas/maquinas.module';
import { CatalogosModule } from '../catalogos/catalogos.module';

@Module({
  imports: [MaquinasModule, CatalogosModule],
  controllers: [DespachosController],
  providers: [DespachosService],
})
export class DespachosModule {}
