import { Module } from '@nestjs/common';
import { ReportesCampoController } from './reportes-campo.controller';
import { ReportesCampoService } from './reportes-campo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificacionesModule],
  controllers: [ReportesCampoController],
  providers: [ReportesCampoService],
})
export class ReportesCampoModule {}
