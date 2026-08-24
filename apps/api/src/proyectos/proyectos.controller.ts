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
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectosDto } from './dto/query-proyectos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('proyectos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  /**
   * GET /api/proyectos
   * Lista proyectos con búsqueda, filtros y paginación.
   * Permiso: operaciones.proyectos.ver
   */
  @RequirePermission('operaciones', 'proyectos', 'ver')
  @Get()
  async findAll(@Query() query: QueryProyectosDto) {
    return this.proyectosService.findAll(query);
  }

  /**
   * GET /api/proyectos/stats
   * Estadísticas de proyectos (total, en proceso, finalizados, presupuesto).
   * Permiso: operaciones.proyectos.ver
   */
  @RequirePermission('operaciones', 'proyectos', 'ver')
  @Get('stats')
  async findStats() {
    return this.proyectosService.findStats();
  }

  /**
   * GET /api/proyectos/catalogos
   * Catálogo de clientes para los selects.
   * Permiso: operaciones.proyectos.ver
   */
  @RequirePermission('operaciones', 'proyectos', 'ver')
  @Get('catalogos')
  async findCatalogos() {
    return this.proyectosService.findCatalogos();
  }

  /**
   * GET /api/proyectos/:id
   * Obtener un proyecto por ID.
   * Permiso: operaciones.proyectos.ver
   */
  @RequirePermission('operaciones', 'proyectos', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.proyectosService.findOne(id);
  }

  /**
   * POST /api/proyectos
   * Crear un nuevo proyecto.
   * Permiso: operaciones.proyectos.crear
   */
  @RequirePermission('operaciones', 'proyectos', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateProyectoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.proyectosService.create(dto, user.id);
  }

  /**
   * PATCH /api/proyectos/:id
   * Actualizar un proyecto existente.
   * Permiso: operaciones.proyectos.editar
   */
  @RequirePermission('operaciones', 'proyectos', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProyectoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.proyectosService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/proyectos/:id
   * Eliminar (soft delete) un proyecto.
   * Permiso: operaciones.proyectos.eliminar
   */
  @RequirePermission('operaciones', 'proyectos', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.proyectosService.remove(id, user.id);
  }
}
