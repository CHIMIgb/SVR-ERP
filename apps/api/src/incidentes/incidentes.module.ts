import { Module } from '@nestjs/common';
import { IncidentesService } from './incidentes.service';
import { IncidentesController } from './incidentes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [IncidentesController],
  providers: [IncidentesService],
})
export class IncidentesModule {}
