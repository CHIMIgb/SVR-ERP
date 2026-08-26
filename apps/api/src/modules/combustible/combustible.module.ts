import { Module } from '@nestjs/common';
import { CombustibleController } from './combustible.controller';
import { CombustibleService } from './combustible.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [CombustibleController],
  providers: [CombustibleService],
})
export class CombustibleModule {}
