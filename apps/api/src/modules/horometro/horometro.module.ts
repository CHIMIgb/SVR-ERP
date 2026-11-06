import { Module } from '@nestjs/common';
import { HorometroController } from './horometro.controller';
import { HorometroService } from './horometro.service';
import { AuditModule } from '../../audit/audit.module';
import { MaquinasModule } from '../maquinas/maquinas.module';

@Module({
  imports: [AuditModule, MaquinasModule],
  controllers: [HorometroController],
  providers: [HorometroService],
})
export class HorometroModule {}
