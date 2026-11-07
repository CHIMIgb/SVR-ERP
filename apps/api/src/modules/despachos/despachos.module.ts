import { Module } from '@nestjs/common';
import { DespachosController } from './despachos.controller';
import { DespachosService } from './despachos.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DespachosController],
  providers: [DespachosService],
})
export class DespachosModule {}
