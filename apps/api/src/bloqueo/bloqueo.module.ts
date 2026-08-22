import { Module } from '@nestjs/common';
import { BloqueoService } from './bloqueo.service';

@Module({
  providers: [BloqueoService],
  exports: [BloqueoService],
})
export class BloqueoModule {}
