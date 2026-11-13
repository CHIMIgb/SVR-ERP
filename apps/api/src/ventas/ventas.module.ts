import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [PrismaModule, AuditModule, NotificacionesModule],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
