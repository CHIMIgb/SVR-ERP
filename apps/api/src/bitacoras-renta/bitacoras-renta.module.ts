import { Module } from '@nestjs/common';
import { BitacorasRentaController } from './bitacoras-renta.controller';
import { BitacorasRentaService } from './bitacoras-renta.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BitacorasRentaController],
  providers: [BitacorasRentaService],
})
export class BitacorasRentaModule {}
