import { Module } from '@nestjs/common';
import { ReportesCampoController } from './reportes-campo.controller';
import { ReportesCampoService } from './reportes-campo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReportesCampoController],
  providers: [ReportesCampoService],
})
export class ReportesCampoModule {}
