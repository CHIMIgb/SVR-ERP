import { Module } from '@nestjs/common';
import { NominaService } from './nomina.service';
import { NominaController } from './nomina.controller';
import { AuditModule } from '../audit/audit.module';
import { AsistenciaModule } from '../asistencia/asistencia.module';

@Module({
  imports: [AuditModule, AsistenciaModule],
  controllers: [NominaController],
  providers: [NominaService],
  exports: [NominaService],
})
export class NominaModule {}
