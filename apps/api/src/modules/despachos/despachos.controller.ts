import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DespachosService } from './despachos.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('despachos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DespachosController {
  constructor(private readonly despachosService: DespachosService) {}

  @RequirePermission('maquinaria', 'flota', 'ver')
  @Get()
  async findAll() {
    return this.despachosService.findAll();
  }

  @RequirePermission('maquinaria', 'flota', 'crear')
  @Post()
  async create(@Body() dto: CreateDespachoDto) {
    return this.despachosService.create(dto);
  }
}
