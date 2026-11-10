import { Module } from '@nestjs/common';
import { MaquinasController } from './maquinas.controller';
import { MaquinasService } from './maquinas.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MaquinasController],
  providers: [MaquinasService],
  exports: [MaquinasService],
})
export class MaquinasModule {}
