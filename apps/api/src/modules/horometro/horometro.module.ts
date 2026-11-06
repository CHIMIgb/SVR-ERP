import { Module } from '@nestjs/common';
import { HorometroController } from './horometro.controller';
import { HorometroService } from './horometro.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [HorometroController],
  providers: [HorometroService],
})
export class HorometroModule {}
