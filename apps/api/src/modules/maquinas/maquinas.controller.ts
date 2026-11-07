import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { MaquinasService } from './maquinas.service';
import { CreateMaquinaDto } from './dto/create-maquina.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/guards/require-permission.decorator';

@Controller('maquinas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MaquinasController {
  constructor(private readonly maquinasService: MaquinasService) {}

  /** Catálogo de la flota (datos maestros): lo consumen los selects de Horómetro, Mantenimiento, Combustible y GPS. */
  @RequirePermission('maquinaria', 'flota', 'ver')
  @Get()
  async findAll() {
    return this.maquinasService.findAll();
  }

  @RequirePermission('maquinaria', 'flota', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMaquinaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.maquinasService.create(dto, user.id);
  }
}
