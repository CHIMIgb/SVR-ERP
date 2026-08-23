import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CombustibleService } from './combustible.service';
import { CreateCargaCombustibleDto } from './dto/create-carga-combustible.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('combustible')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CombustibleController {
  constructor(private readonly combustibleService: CombustibleService) {}

  @RequirePermission('maquinaria', 'combustible', 'ver')
  @Get()
  async findAll() {
    return this.combustibleService.findAll();
  }

  @RequirePermission('maquinaria', 'combustible', 'crear')
  @Post()
  async create(@Body() dto: CreateCargaCombustibleDto) {
    return this.combustibleService.create(dto);
  }
}
