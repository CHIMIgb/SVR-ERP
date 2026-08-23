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
import { IncidentesService } from './incidentes.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';
import { QueryIncidentesDto } from './dto/query-incidentes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('incidentes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IncidentesController {
  constructor(private readonly incidentesService: IncidentesService) {}

  /**
   * GET /api/incidentes
   * Lista incidentes con búsqueda, filtros y paginación.
   * Permiso: operaciones.incidentes.ver
   */
  @RequirePermission('operaciones', 'incidentes', 'ver')
  @Get()
  async findAll(@Query() query: QueryIncidentesDto) {
    return this.incidentesService.findAll(query);
  }

  /**
   * GET /api/incidentes/stats
   * Estadísticas de incidentes (total, abiertos, críticos).
   * Permiso: operaciones.incidentes.ver
   */
  @RequirePermission('operaciones', 'incidentes', 'ver')
  @Get('stats')
  async findStats() {
    return this.incidentesService.findStats();
  }

  /**
   * GET /api/incidentes/catalogos
   * Catálogos para selects: máquinas y obras.
   * Permiso: operaciones.incidentes.ver
   */
  @RequirePermission('operaciones', 'incidentes', 'ver')
  @Get('catalogos')
  async findCatalogos() {
    return this.incidentesService.findCatalogos();
  }

  /**
   * GET /api/incidentes/:id
   * Obtener un incidente por ID.
   * Permiso: operaciones.incidentes.ver
   */
  @RequirePermission('operaciones', 'incidentes', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.incidentesService.findOne(id);
  }

  /**
   * POST /api/incidentes
   * Crear un nuevo incidente.
   * Permiso: operaciones.incidentes.crear
   */
  @RequirePermission('operaciones', 'incidentes', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateIncidenteDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.incidentesService.create(dto, user.id);
  }

  /**
   * PATCH /api/incidentes/:id
   * Actualizar un incidente existente.
   * Permiso: operaciones.incidentes.editar
   */
  @RequirePermission('operaciones', 'incidentes', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidenteDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.incidentesService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/incidentes/:id
   * Eliminar (soft delete) un incidente.
   * Permiso: operaciones.incidentes.eliminar
   */
  @RequirePermission('operaciones', 'incidentes', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.incidentesService.remove(id, user.id);
  }
}
