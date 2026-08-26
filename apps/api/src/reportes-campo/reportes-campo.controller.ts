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
import { ReportesCampoService } from './reportes-campo.service';
import { CreateReporteCampoDto } from './dto/create-reporte-campo.dto';
import { UpdateReporteCampoDto } from './dto/update-reporte-campo.dto';
import { QueryReportesCampoDto } from './dto/query-reportes-campo.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('reportes-campo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportesCampoController {
  constructor(private readonly service: ReportesCampoService) {}

  /**
   * GET /api/reportes-campo
   * Lista reportes con búsqueda, filtros y paginación.
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get()
  async findAll(@Query() query: QueryReportesCampoDto) {
    return this.service.findAll(query);
  }

  /**
   * GET /api/reportes-campo/stats
   * Conteos por estado + incidentes críticos activos (tarjetas y banner).
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get('stats')
  async findStats() {
    return this.service.findStats();
  }

  /**
   * GET /api/reportes-campo/:id
   * Obtener un reporte por ID.
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /**
   * POST /api/reportes-campo
   * Registrar un nuevo reporte de campo (nace PENDIENTE).
   * Permiso: operaciones.reportes_campo.crear
   */
  @RequirePermission('operaciones', 'reportes_campo', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateReporteCampoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.create(dto, user.id);
  }

  /**
   * PATCH /api/reportes-campo/:id/estado
   * Avanza el flujo del reporte (transiciones válidas estrictas).
   * Permiso: operaciones.reportes_campo.editar
   */
  @RequirePermission('operaciones', 'reportes_campo', 'editar')
  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.cambiarEstado(id, dto, user.id);
  }

  /**
   * PATCH /api/reportes-campo/:id
   * Actualizar contenido — solo permitido mientras PENDIENTE.
   * Permiso: operaciones.reportes_campo.editar
   */
  @RequirePermission('operaciones', 'reportes_campo', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReporteCampoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.update(id, dto, user.id);
  }

  /**
   * DELETE /api/reportes-campo/:id
   * Eliminar (soft delete) un reporte.
   * Permiso: operaciones.reportes_campo.eliminar
   */
  @RequirePermission('operaciones', 'reportes_campo', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.remove(id, user.id);
  }
}
