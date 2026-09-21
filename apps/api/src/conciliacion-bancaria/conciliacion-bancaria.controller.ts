import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { ConciliacionBancariaService } from './conciliacion-bancaria.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { ConciliarMovimientoDto } from './dto/conciliar-movimiento.dto';
import { QueryMovimientosDto } from './dto/query-movimientos.dto';
import { CargarLoteDto } from './dto/cargar-lote.dto';

/**
 * Rutas de conciliación bancaria bajo /finanzas.
 * IMPORTANTE: ConciliacionBancariaModule debe registrarse ANTES que
 * FinanzasModule en app.module — las rutas estáticas (bancos, cuentas,
 * movimientos) deben ganar sobre el `@Get(':id')` de FinanzasController.
 */
@Controller('finanzas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConciliacionBancariaController {
  constructor(private readonly service: ConciliacionBancariaService) {}

  // ── Bancos ──
  @Get('bancos')
  @RequirePermission('comercial', 'finanzas', 'ver')
  async listarBancos() {
    return this.service.listarBancos();
  }

  @Post('bancos')
  @RequirePermission('comercial', 'finanzas', 'crear')
  async crearBanco(@Body() dto: CreateBancoDto, @Req() req: Request) {
    return this.service.crearBanco(dto, (req.user as { id: string }).id);
  }

  // ── Cuentas ──
  @Get('bancos/:bancoId/cuentas')
  @RequirePermission('comercial', 'finanzas', 'ver')
  async listarCuentas(@Param('bancoId', ParseUUIDPipe) bancoId: string) {
    return this.service.listarCuentas(bancoId);
  }

  @Post('bancos/:bancoId/cuentas')
  @RequirePermission('comercial', 'finanzas', 'crear')
  async crearCuenta(
    @Param('bancoId', ParseUUIDPipe) bancoId: string,
    @Body() dto: CreateCuentaDto,
    @Req() req: Request,
  ) {
    return this.service.crearCuenta(bancoId, dto, (req.user as { id: string }).id);
  }

  // ── Movimientos ──
  @Get('cuentas/:cuentaId/movimientos')
  @RequirePermission('comercial', 'finanzas', 'ver')
  async listarMovimientos(
    @Param('cuentaId', ParseUUIDPipe) cuentaId: string,
    @Query() query: QueryMovimientosDto,
  ) {
    return this.service.listarMovimientos(cuentaId, query);
  }

  @Get('movimientos/:id/candidatas')
  @RequirePermission('comercial', 'finanzas', 'ver')
  async listarCandidatas(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listarCandidatas(id);
  }

  @Post('cuentas/:cuentaId/movimientos/lote')
  @RequirePermission('comercial', 'finanzas', 'crear')
  async cargarLote(
    @Param('cuentaId', ParseUUIDPipe) cuentaId: string,
    @Body() dto: CargarLoteDto,
    @Req() req: Request,
  ) {
    return this.service.cargarLote(cuentaId, dto, (req.user as { id: string }).id);
  }

  @Post('cuentas/:cuentaId/movimientos')
  @RequirePermission('comercial', 'finanzas', 'crear')
  async crearMovimiento(
    @Param('cuentaId', ParseUUIDPipe) cuentaId: string,
    @Body() dto: CreateMovimientoDto,
    @Req() req: Request,
  ) {
    return this.service.crearMovimiento(cuentaId, dto, (req.user as { id: string }).id);
  }

  // ── Conciliar / desconciliar ──
  @Post('movimientos/:id/conciliar')
  @RequirePermission('comercial', 'finanzas', 'editar')
  async conciliar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConciliarMovimientoDto,
    @Req() req: Request,
  ) {
    return this.service.conciliar(id, dto, (req.user as { id: string }).id);
  }

  @Delete('movimientos/:id/conciliar')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('comercial', 'finanzas', 'editar')
  async desconciliar(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.service.desconciliar(id, (req.user as { id: string }).id);
  }
}