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
  Res,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FacturasService } from './facturas.service';
import { CrearFacturaDto } from './dto/crear-factura.dto';
import { ActualizarFacturaDto } from './dto/actualizar-factura.dto';
import { CambiarEstadoFacturaDto } from './dto/cambiar-estado-factura.dto';
import { CrearConceptoDto, ActualizarConceptoDto, ListarFacturasQuery } from './dto/conceptos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  /**
   * GET /api/facturas — lista paginada
   * Permiso: comercial.facturas.ver
   */
  @RequirePermission('comercial', 'facturas', 'ver')
  @Get('facturas')
  async findAll(@Query() query: ListarFacturasQuery) {
    return this.facturasService.findAll(query);
  }

  /**
   * GET /api/facturas/stats — totales globales para las StatsCards
   * Permiso: comercial.facturas.ver
   */
  @RequirePermission('comercial', 'facturas', 'ver')
  @Get('facturas/stats')
  async stats() {
    return this.facturasService.stats();
  }

  /**
   * GET /api/facturas/exportar — CSV con BOM (debe declararse antes de :id)
   * Permiso: comercial.facturas.exportar
   */
  @RequirePermission('comercial', 'facturas', 'exportar')
  @Get('facturas/exportar')
  async exportar(@Query() query: ListarFacturasQuery, @Res() res: Response) {
    const csv = await this.facturasService.exportar(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facturas-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }

  /**
   * GET /api/facturas/:id — detalle con conceptos
   * Permiso: comercial.facturas.ver
   */
  @RequirePermission('comercial', 'facturas', 'ver')
  @Get('facturas/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facturasService.findOne(id);
  }

  /**
   * POST /api/facturas — crear factura con conceptos
   * Permiso: comercial.facturas.crear
   */
  @RequirePermission('comercial', 'facturas', 'crear')
  @Post('facturas')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CrearFacturaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.facturasService.create(dto, user.id);
  }

  /**
   * PATCH /api/facturas/:id — editar datos generales (solo PENDIENTE)
   * Permiso: comercial.facturas.editar
   */
  @RequirePermission('comercial', 'facturas', 'editar')
  @Patch('facturas/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarFacturaDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.facturasService.update(id, dto, user.id);
  }

  /**
   * PATCH /api/facturas/:id/estado — timbrar (TIMBRADA) o cancelar (CANCELADA)
   * Permiso: comercial.facturas.editar
   */
  @RequirePermission('comercial', 'facturas', 'editar')
  @Patch('facturas/:id/estado')
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoFacturaDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.facturasService.cambiarEstado(id, dto, user.id);
  }

  /**
   * DELETE /api/facturas/:id — eliminación lógica (solo PENDIENTE sin CxC)
   * Permiso: comercial.facturas.eliminar
   */
  @RequirePermission('comercial', 'facturas', 'eliminar')
  @Delete('facturas/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.facturasService.remove(id, user.id);
  }

  // ── Conceptos ──────────────────────────────
  @RequirePermission('comercial', 'facturas', 'editar')
  @Post('facturas/:id/conceptos')
  @HttpCode(HttpStatus.OK)
  async agregarConcepto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearConceptoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.facturasService.agregarConcepto(id, dto, user.id);
  }

  @RequirePermission('comercial', 'facturas', 'editar')
  @Patch('facturas/:id/conceptos/:conceptoId')
  async actualizarConcepto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('conceptoId', ParseUUIDPipe) conceptoId: string,
    @Body() dto: ActualizarConceptoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.facturasService.actualizarConcepto(id, conceptoId, dto, user.id);
  }

  @RequirePermission('comercial', 'facturas', 'editar')
  @Delete('facturas/:id/conceptos/:conceptoId')
  @HttpCode(HttpStatus.OK)
  async eliminarConcepto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('conceptoId', ParseUUIDPipe) conceptoId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.facturasService.eliminarConcepto(id, conceptoId, user.id);
  }
}
