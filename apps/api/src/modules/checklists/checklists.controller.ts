import { Controller, Get, Post, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { QueryChecklistDto } from './dto/query-checklist.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('checklists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @RequirePermission('maquinaria', 'flota', 'ver')
  @Get()
  async findAll(@Query() query: QueryChecklistDto) {
    return this.checklistsService.findAll(query);
  }

  @RequirePermission('maquinaria', 'flota', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateChecklistDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.checklistsService.create(dto, user.id);
  }
}
