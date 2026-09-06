import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Header,
} from '@nestjs/common';
import { Request } from 'express';
import { CobranzaService } from './cobranza.service';
import { CrearCuentaDto } from './dto/crear-cuenta.dto';
import { ActualizarCuentaDto } from './dto/actualizar-cuenta.dto';
import { RegistrarCobroDto } from './dto/registrar-cobro.dto';
import { ListarCuentasQuery } from './dto/listar-cuentas.query';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CobranzaController {
  constructor(private readonly cobranzaService: CobranzaService) {}

  /**
   * GET /api/cobranza
   * Lista paginada de cuentas por cobrar con filtros.
   * Permiso: comercial.cobranza.ver
   */
  @RequirePermission('comercial', 'cobranza', 'ver')
  @Get('cobranza')
  async findAll(@Query() query: ListarCuentasQuery) {
    return this.cobranzaService.findAll(query);
  }

  /**
   * GET /api/cobranza/stats
   * totalPorCobrar, vencido, cobradoMes, clientesConSaldo.
   * Permiso: comercial.cobranza.ver
   */
  @RequirePermission('comercial', 'cobranza', 'ver')
  @Get('cobranza/stats')
  async stats() {
    return this.cobranzaService.stats();
  }

  /**
   * GET /api/cobranza/exportar
   * CSV de la cartera (mismo shape que el frontend), con BOM UTF-8.
   * Permiso: comercial.cobranza.exportar
   */
  @RequirePermission('comercial', 'cobranza', 'exportar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cobranza.csv"')
  @Get('cobranza/exportar')
  async exportar(@Query() query: ListarCuentasQuery): Promise<string> {
    return this.cobranzaService.exportar(query);
  }

  /**
   * GET /api/cobranza/:id
   * Detalle de la cuenta (cliente + factura + últimos cobros).
   * Permiso: comercial.cobranza.ver
   */
  @RequirePermission('comercial', 'cobranza', 'ver')
  @Get('cobranza/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cobranzaService.findOne(id);
  }

  /**
   * GET /api/cobranza/:id/cobros
   * Ledger de movimientos de la cuenta.
   * Permiso: comercial.cobranza.ver
   */
  @RequirePermission('comercial', 'cobranza', 'ver')
  @Get('cobranza/:id/cobros')
  async cobrosDeCuenta(@Param('id', ParseUUIDPipe) id: string) {
    return this.cobranzaService.cobrosDeCuenta(id);
  }

  /**
   * POST /api/cobranza
   * Crea una cuenta por cobrar (manual o desde factura).
   * Permiso: comercial.cobranza.crear
   */
  @RequirePermission('comercial', 'cobranza', 'crear')
  @Post('cobranza')
  @HttpCode(HttpStatus.CREATED)
  async crearCuenta(@Body() dto: CrearCuentaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.cobranzaService.crearCuenta(dto, user.id);
  }

  /**
   * PATCH /api/cobranza/:id
   * Editar monto/vencimiento (prohibido si la cuenta ya tiene cobros).
   * Permiso: comercial.cobranza.editar
   */
  @RequirePermission('comercial', 'cobranza', 'editar')
  @Patch('cobranza/:id')
  async actualizarCuenta(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarCuentaDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cobranzaService.actualizarCuenta(id, dto, user.id);
  }

  /**
   * POST /api/cobranza/:id/cobros
   * Registra un cobro: pago + CxC + ingreso en finanzas, en $transaction.
   * Permiso: comercial.cobranza.crear
   */
  @RequirePermission('comercial', 'cobranza', 'crear')
  @Post('cobranza/:id/cobros')
  @HttpCode(HttpStatus.CREATED)
  async registrarCobro(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarCobroDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cobranzaService.registrarCobro(id, dto, user.id);
  }
}