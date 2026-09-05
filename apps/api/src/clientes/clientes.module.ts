import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesGlobalController } from './cotizaciones-global.controller';
import { CotizacionesService } from './cotizaciones.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ClientesController, CotizacionesController, CotizacionesGlobalController],
  providers: [ClientesService, CotizacionesService],
})
export class ClientesModule {}
