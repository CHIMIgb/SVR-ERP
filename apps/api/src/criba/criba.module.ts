import { Module } from '@nestjs/common';
import { CribaController } from './criba.controller';
import { CribaService } from './criba.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [PrismaModule, AuditModule, InventarioModule],
  controllers: [CribaController],
  providers: [CribaService],
})
export class CribaModule {}
