import { Module } from '@nestjs/common';
import { BloqueoService } from './bloqueo.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [BloqueoService],
  exports: [BloqueoService],
})
export class BloqueoModule {}
