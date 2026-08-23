import { Module } from '@nestjs/common';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { MaquinasModule } from '../maquinas/maquinas.module';

@Module({
  imports: [MaquinasModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
})
export class ChecklistsModule {}
