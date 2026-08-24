import { Module } from '@nestjs/common';
import { CribaController } from './criba.controller';
import { CribaService } from './criba.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CribaController],
  providers: [CribaService],
})
export class CribaModule {}
