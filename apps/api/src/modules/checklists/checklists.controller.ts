import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('checklists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @RequirePermission('maquinaria', 'flota', 'ver')
  @Get()
  async findAll() {
    return this.checklistsService.findAll();
  }

  @RequirePermission('maquinaria', 'flota', 'crear')
  @Post()
  async create(@Body() dto: CreateChecklistDto) {
    return this.checklistsService.create(dto);
  }
}
