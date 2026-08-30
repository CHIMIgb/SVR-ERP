import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CribaService } from './criba.service';
import { CreateRegistroCribaDto } from './dto/create-registro-criba.dto';
import { UpdateRegistroCribaDto } from './dto/update-registro-criba.dto';
import { QueryRegistrosCribaDto } from './dto/query-registros-criba.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('criba')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CribaController {
  constructor(private readonly cribaService: CribaService) {}

  /**
   * GET /api/criba
   * Lista registros de criba con búsqueda, filtros y paginación.
   * Permiso: operaciones.criba.ver
   */
  @RequirePermission('operaciones', 'criba', 'ver')
  @Get()
  async findAll(@Query() query: QueryRegistrosCribaDto) {
    return this.cribaService.findAll(query);
  }

  /**
   * GET /api/criba/stats
   * Estadísticas para las tarjetas (producido, al banco, horas, eficiencia, por material).
   * Permiso: operaciones.criba.ver
   */
  @RequirePermission('operaciones', 'criba', 'ver')
  @Get('stats')
  async findStats() {
    return this.cribaService.findStats();
  }

  /**
   * GET /api/criba/catalogos
   * Catálogo de trabajadores operadores para el formulario.
   * Permiso: operaciones.criba.ver
   */
  @RequirePermission('operaciones', 'criba', 'ver')
  @Get('catalogos')
  async findCatalogos() {
    return this.cribaService.findCatalogos();
  }

  /**
   * GET /api/criba/:id
   * Obtener un registro por ID.
   * Permiso: operaciones.criba.ver
   */
  @RequirePermission('operaciones', 'criba', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cribaService.findOne(id);
  }

  /**
   * POST /api/criba
   * Registrar un turno de criba.
   * Permiso: operaciones.criba.crear
   */
  @RequirePermission('operaciones', 'criba', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateRegistroCribaDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cribaService.create(dto, user.id);
  }

  /**
   * PATCH /api/criba/:id
   * Actualizar un registro de criba.
   * Permiso: operaciones.criba.editar
   */
  @RequirePermission('operaciones', 'criba', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegistroCribaDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cribaService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/criba/:id
   * Eliminar (soft delete) un registro de criba.
   * Permiso: operaciones.criba.eliminar
   */
  @RequirePermission('operaciones', 'criba', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cribaService.remove(id, user.id);
  }
}
