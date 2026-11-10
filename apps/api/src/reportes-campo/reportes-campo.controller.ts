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
import { AsignarReporteDto } from './dto/asignar-reporte.dto';
import { ActividadDto } from './dto/actividad.dto';
import { AdjuntoDto } from './dto/adjunto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('reportes-campo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportesCampoController {
  constructor(private readonly service: ReportesCampoService) {}

  /**
   * GET /api/reportes-campo
   * Lista incidentes con búsqueda, filtros y paginación.
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get()
  async findAll(@Query() query: QueryReportesCampoDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.service.findAll(query, user.id);
  }

  /**
   * GET /api/reportes-campo/stats
   * Conteos por estado + incidentes críticos activos (tarjetas y banner).
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get('stats')
  async findStats(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.service.findStats(user.id);
  }

  /**
   * GET /api/reportes-campo/subcategorias
   * Catálogo maestro de subcategorías por torre (sin paginar — datos maestros).
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get('subcategorias')
  async subcategorias() {
    return this.service.subcategorias();
  }

  /**
   * GET /api/reportes-campo/proyectos-en-proceso
   * Proyectos activos en proceso (select "Ubicación — Proyecto"), con el
   * permiso de esta vista para que cualquier rol que use /reportes lo cargue.
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get('proyectos-en-proceso')
  async proyectosEnProceso() {
    return this.service.proyectosEnProceso();
  }

  /**
   * GET /api/reportes-campo/:id
   * Detalle del incidente: reporte + actividades + adjuntos.
   * Permiso: operaciones.reportes_campo.ver
   */
  @RequirePermission('operaciones', 'reportes_campo', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.service.findOne(id, user.id);
  }

  /**
   * POST /api/reportes-campo
   * Registrar un nuevo incidente (nace NUEVO).
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
   * PATCH /api/reportes-campo/:id/asignar
   * Define "quién le cae" (responsable) — trabajador o nombre libre.
   * Permiso: operaciones.reportes_campo.editar
   */
  @RequirePermission('operaciones', 'reportes_campo', 'editar')
  @Patch(':id/asignar')
  async asignar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarReporteDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.asignar(id, dto, user.id);
  }

  /**
   * PATCH /api/reportes-campo/:id/estado
   * Iniciar (EN_CURSO) o Cerrar (CERRADO) el incidente.
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
   * POST /api/reportes-campo/:id/actividades
   * Publica una actividad en la bitácora del incidente.
   * Permiso: operaciones.reportes_campo.editar
   */
  @RequirePermission('operaciones', 'reportes_campo', 'editar')
  @Post(':id/actividades')
  @HttpCode(HttpStatus.CREATED)
  async comentar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActividadDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.comentar(id, dto, user.id);
  }

  /**
   * POST /api/reportes-campo/:id/adjuntos
   * Adjunta una imagen al incidente (base64, máx 2 MB).
   * Permiso: operaciones.reportes_campo.editar
   */
  @RequirePermission('operaciones', 'reportes_campo', 'editar')
  @Post(':id/adjuntos')
  @HttpCode(HttpStatus.CREATED)
  async adjuntar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjuntoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.adjuntar(id, dto, user.id);
  }

  /**
   * POST /api/reportes-campo/:id/aceptar
   * La torre toma el incidente: RESPONSABLE = quien lo acepta.
   * Permiso: operaciones.reportes_campo.editar
   */
  @RequirePermission('operaciones', 'reportes_campo', 'editar')
  @Post(':id/aceptar')
  @HttpCode(HttpStatus.OK)
  async aceptar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.service.aceptar(id, user.id);
  }

  /**
   * PATCH /api/reportes-campo/:id
   * Actualizar contenido — bloqueado si está Cerrado.
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
   * Eliminar (soft delete) un incidente.
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
