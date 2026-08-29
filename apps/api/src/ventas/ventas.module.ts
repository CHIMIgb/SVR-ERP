import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
