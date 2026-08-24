import { Module } from '@nestjs/common';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ProyectosController],
  providers: [ProyectosService],
})
export class ProyectosModule {}
