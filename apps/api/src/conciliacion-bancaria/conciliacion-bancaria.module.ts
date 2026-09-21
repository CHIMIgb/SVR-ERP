import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ConciliacionBancariaController } from './conciliacion-bancaria.controller';
import { ConciliacionBancariaService } from './conciliacion-bancaria.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ConciliacionBancariaController],
  providers: [ConciliacionBancariaService],
})
export class ConciliacionBancariaModule {}