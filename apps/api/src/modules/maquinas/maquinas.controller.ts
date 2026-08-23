import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MaquinasService } from './maquinas.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('maquinas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MaquinasController {
  constructor(private readonly maquinasService: MaquinasService) {}

  @RequirePermission('maquinaria', 'flota', 'ver')
  @Get()
  async findAll() {
    return this.maquinasService.findAll();
  }

  @RequirePermission('maquinaria', 'flota', 'crear')
  @Post()
  async create(@Body() dto: CreateMaquinaDto) {
    return this.maquinasService.create(dto);
  }
}
