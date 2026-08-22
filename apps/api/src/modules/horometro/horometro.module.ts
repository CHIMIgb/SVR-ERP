import { Module } from '@nestjs/common';
import { HorometroController } from './horometro.controller';
import { HorometroService } from './horometro.service';
import { MaquinasModule } from '../maquinas/maquinas.module';

@Module({
  imports: [MaquinasModule],
  controllers: [HorometroController],
  providers: [HorometroService],
})
export class HorometroModule {}
