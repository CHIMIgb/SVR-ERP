import { Module } from '@nestjs/common';
import { MantenimientoController } from './mantenimiento.controller';
import { MantenimientoService } from './mantenimiento.service';
import { MaquinasModule } from '../maquinas/maquinas.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [MaquinasModule, AuditModule],
  controllers: [MantenimientoController],
  providers: [MantenimientoService],
})
export class MantenimientoModule {}
