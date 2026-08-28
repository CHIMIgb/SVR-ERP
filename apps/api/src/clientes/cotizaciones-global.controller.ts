import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { CotizacionesService } from './cotizaciones.service';
import { QueryCotizacionesGlobalDto } from './dto/query-cotizaciones-global.dto';
import { CambiarEstadoCotizacionDto } from './dto/cambiar-estado-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';

/**
 * Endpoints GLOBALES de cotizaciones (vista /cotizaciones).
 * Los endpoints por cliente viven en `cotizaciones.controller.ts`.
 *
 * Ruta base: /api/cotizaciones
 */
@Controller('cotizaciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CotizacionesGlobalController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  /**
   * GET /api/cotizaciones
   * Listado global de cotizaciones (búsqueda, filtro por estado/cliente, paginado).
   * Permiso: comercial.cotizaciones.ver
   */
  @RequirePermission('comercial', 'cotizaciones', 'ver')
  @Get()
  findAll(@Query() query: QueryCotizacionesGlobalDto) {
    return this.cotizacionesService.findAll(query);
  }

  /**
   * GET /api/cotizaciones/stats
   * Métricas para tarjetas de la vista.
   * Permiso: comercial.cotizaciones.ver
   */
  @RequirePermission('comercial', 'cotizaciones', 'ver')
  @Get('stats')
  findStats() {
    return this.cotizacionesService.findStats();
  }

  /**
   * GET /api/cotizaciones/:id
   * Detalle de una cotización con datos del cliente.
   * Permiso: comercial.cotizaciones.ver
   */
  @RequirePermission('comercial', 'cotizaciones', 'ver')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cotizacionesService.findOne(id);
  }

  /**
   * PATCH /api/cotizaciones/:id
   * Editar campos de la cotización (descripción, monto, fecha, cliente).
   * Permiso: comercial.cotizaciones.editar
   */
  @RequirePermission('comercial', 'cotizaciones', 'editar')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCotizacionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cotizacionesService.update(id, dto, user.id);
  }

  /**
   * PATCH /api/cotizaciones/:id/estado
   * Cambiar estado (Aceptada / Rechazada).
   * Permiso: comercial.cotizaciones.editar
   */
  @RequirePermission('comercial', 'cotizaciones', 'editar')
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoCotizacionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cotizacionesService.cambiarEstado(id, dto, user.id);
  }
}
