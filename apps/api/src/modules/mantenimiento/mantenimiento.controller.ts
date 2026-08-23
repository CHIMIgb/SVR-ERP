import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('mantenimiento')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @RequirePermission('maquinaria', 'mantenimiento', 'ver')
  @Get()
  async findAll() {
    return this.mantenimientoService.findAll();
  }

  @RequirePermission('maquinaria', 'mantenimiento', 'crear')
  @Post()
  async create(@Body() dto: CreateMantenimientoDto) {
    return this.mantenimientoService.create(dto);
  }
}
