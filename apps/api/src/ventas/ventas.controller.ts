import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import {
  CreateCierreDto,
  CreateAperturaDto,
  CreateRetiroDto,
  RechazarCierreDto,
  QueryCierresDto,
  UpdateConfigDto,
} from './dto/create-retiro-cierre.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('ventas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  /**
   * GET /api/ventas/catalogos
   * Catálogo de materiales del POS (materiales + medidas + precios + stock).
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Get('catalogos')
  findCatalogos() {
    return this.ventasService.findCatalogos();
  }

  /**
   * GET /api/ventas/hoy
   * Ventas del día + estadísticas por método de pago.
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Get('hoy')
  findHoy() {
    return this.ventasService.findHoy();
  }

  /**
   * POST /api/ventas
   * Registrar una venta (valida stock/medida, descuenta stock, genera folio).
   */
  @RequirePermission('comercial', 'ventas', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVentaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.ventasService.create(dto, user.id);
  }

  /**
   * GET /api/ventas/retiros
   * Retiros de efectivo del día.
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Get('retiros')
  findRetiros() {
    return this.ventasService.findRetiros();
  }

  /**
   * POST /api/ventas/retiros
   * Registrar un retiro de efectivo del día.
   */
  @RequirePermission('comercial', 'ventas', 'crear')
  @Post('retiros')
  @HttpCode(HttpStatus.CREATED)
  createRetiro(@Body() dto: CreateRetiroDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const cajero = this.cajeroDe(req);
    return this.ventasService.createRetiro(dto, user.id, cajero);
  }

  /**
   * GET /api/ventas/cierres/hoy
   * Estado del cierre de caja del día (existe o no).
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Get('cierres/hoy')
  findCierreHoy() {
    return this.ventasService.findCierreHoy();
  }

  /**
   * POST /api/ventas/cierres
   * Registrar el cierre de caja del día (arqueo).
   */
  @RequirePermission('comercial', 'ventas', 'crear')
  @Post('cierres')
  @HttpCode(HttpStatus.CREATED)
  createCierre(@Body() dto: CreateCierreDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const cajero = this.cajeroDe(req);
    return this.ventasService.createCierre(dto, user.id, cajero);
  }

  /**
   * PATCH /api/ventas/cierres/:id/aprobar
   * Aprueba un cierre de caja (solo Administrador).
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Patch('cierres/:id/aprobar')
  aprobarCierre(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.ventasService.aprobarCierre(id, user.id);
  }

  /**
   * PATCH /api/ventas/cierres/:id/rechazar
   * Rechaza un cierre de caja con motivo (solo Administrador).
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Patch('cierres/:id/rechazar')
  rechazarCierre(
    @Param('id') id: string,
    @Body() dto: RechazarCierreDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.ventasService.rechazarCierre(id, dto, user.id);
  }

  /**
   * GET /api/ventas/config
   * Configuración del turno (apertura/cierre 24h + tolerancia).
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Get('config')
  findConfig() {
    return this.ventasService.findConfig();
  }

  /**
   * PATCH /api/ventas/config
   * Actualiza configuración del turno (solo Administrador).
   */
  @RequirePermission('comercial', 'ventas', 'editar')
  @Patch('config')
  updateConfig(@Body() dto: UpdateConfigDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.ventasService.updateConfig(dto, user.id);
  }

  /**
   * GET /api/ventas/apertura/hoy
   * Estado de la apertura de turno del día (existe o no).
   */
  @RequirePermission('comercial', 'ventas', 'ver')
  @Get('apertura/hoy')
  findAperturaHoy() {
    return this.ventasService.findAperturaHoy();
  }

  /**
   * POST /api/ventas/apertura
   * Registrar la apertura del turno (fondo inicial).
   */
  @RequirePermission('comercial', 'ventas', 'crear')
  @Post('apertura')
  @HttpCode(HttpStatus.CREATED)
  createApertura(@Body() dto: CreateAperturaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const cajero = this.cajeroDe(req);
    return this.ventasService.createApertura(dto, user.id, cajero);
  }

  /** Nombre del cajero si viene en el JWT; cae a un placeholder amigable. */
  private cajeroDe(req: Request): string {
    const user = req.user as { id: string; nombre?: string } | undefined;
    return user?.nombre?.trim() || 'Cajero';
  }
}
