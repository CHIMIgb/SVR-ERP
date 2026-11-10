import { Module } from '@nestjs/common';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { AuditModule } from '../audit/audit.module';
import { MaquinasModule } from '../modules/maquinas/maquinas.module';

@Module({
  imports: [AuditModule, MaquinasModule],
  controllers: [GpsController],
  providers: [GpsService],
})
export class GpsModule {}
