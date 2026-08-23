import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { BitacoraService } from './bitacora.service';
import { BitacoraController } from './bitacora.controller';

@Module({
  imports: [AuditModule],
  controllers: [BitacoraController],
  providers: [BitacoraService],
  exports: [BitacoraService],
})
export class BitacoraModule {}
