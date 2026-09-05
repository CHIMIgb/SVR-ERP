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
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { QueryProveedoresDto } from './dto/query-proveedores.dto';
import { CreateOrdenCompraDto } from './dto/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from './dto/update-orden-compra.dto';
import { CambiarEstadoOrdenDto } from './dto/cambiar-estado-orden.dto';
import { RegistrarAbonoDto } from './dto/registrar-abono.dto';
import { QueryOrdenesCompraDto } from './dto/query-ordenes-compra.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  // ── Proveedores ──────────────────────────────
  /**
   * GET /api/proveedores
   * Permiso: comercial.proveedores.ver
   */
  @RequirePermission('comercial', 'proveedores', 'ver')
  @Get('proveedores')
  async findAll(@Query() query: QueryProveedoresDto) {
    return this.proveedoresService.findAll(query);
  }

  /**
   * GET /api/proveedores/estados-cuenta
   * Resumen por proveedor (operaciones, total, pagado, saldo).
   * Permiso: comercial.proveedores.ver
   */
  @RequirePermission('comercial', 'proveedores', 'ver')
  @Get('proveedores/estados-cuenta')
  async findEstadoCuentaResumen() {
    return this.proveedoresService.findEstadoCuentaResumen();
  }

  /**
   * GET /api/proveedores/:id/estado-cuenta
   * Ledger con saldo corrido por proveedor.
   * Permiso: comercial.proveedores.ver
   */
  @RequirePermission('comercial', 'proveedores', 'ver')
  @Get('proveedores/:id/estado-cuenta')
  async findLedgerPorProveedor(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedoresService.findLedgerPorProveedor(id);
  }

  /**
   * GET /api/proveedores/:id
   * Permiso: comercial.proveedores.ver
   */
  @RequirePermission('comercial', 'proveedores', 'ver')
  @Get('proveedores/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedoresService.findOne(id);
  }

  /**
   * POST /api/proveedores
   * Permiso: comercial.proveedores.crear
   */
  @RequirePermission('comercial', 'proveedores', 'crear')
  @Post('proveedores')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProveedorDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.proveedoresService.create(dto, user.id);
  }

  /**
   * PATCH /api/proveedores/:id
   * Permiso: comercial.proveedores.editar
   */
  @RequirePermission('comercial', 'proveedores', 'editar')
  @Patch('proveedores/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProveedorDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.proveedoresService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/proveedores/:id
   * Soft delete (bloqueado si hay CxP pendiente).
   * Permiso: comercial.proveedores.eliminar
   */
  @RequirePermission('comercial', 'proveedores', 'eliminar')
  @Delete('proveedores/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.proveedoresService.remove(id, user.id);
  }

  /**
   * POST /api/proveedores/:id/abonos
   * Registrar abono a una orden de compra del proveedor.
   * Permiso: comercial.proveedores.editar
   */
  @RequirePermission('comercial', 'proveedores', 'editar')
  @Post('proveedores/:id/abonos')
  @HttpCode(HttpStatus.CREATED)
  async registrarAbono(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarAbonoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.proveedoresService.registrarAbono(id, dto, user.id);
  }

  // ── Órdenes de compra ────────────────────────
  /**
   * GET /api/ordenes-compra
   * Permiso: comercial.proveedores.ver
   */
  @RequirePermission('comercial', 'proveedores', 'ver')
  @Get('ordenes-compra')
  async findAllOrdenes(@Query() query: QueryOrdenesCompraDto) {
    return this.proveedoresService.findAllOrdenes(query);
  }

  /**
   * GET /api/ordenes-compra/:id
   * Detalle + abonos.
   * Permiso: comercial.proveedores.ver
   */
  @RequirePermission('comercial', 'proveedores', 'ver')
  @Get('ordenes-compra/:id')
  async findOneOrden(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedoresService.findOneOrden(id);
  }

  /**
   * POST /api/ordenes-compra
   * Crea OC + CxP en $transaction.
   * Permiso: comercial.proveedores.crear
   */
  @RequirePermission('comercial', 'proveedores', 'crear')
  @Post('ordenes-compra')
  @HttpCode(HttpStatus.CREATED)
  async createOrden(@Body() dto: CreateOrdenCompraDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.proveedoresService.createOrden(dto, user.id);
  }

  /**
   * PATCH /api/ordenes-compra/:id
   * Editar descripción/monto (solo PENDIENTE/APROBADA).
   * Permiso: comercial.proveedores.editar
   */
  @RequirePermission('comercial', 'proveedores', 'editar')
  @Patch('ordenes-compra/:id')
  async updateOrden(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrdenCompraDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.proveedoresService.updateOrden(id, dto, user.id);
  }

  /**
   * DELETE /api/ordenes-compra/:id
   * Soft delete (solo sin pagos).
   * Permiso: comercial.proveedores.eliminar
   */
  @RequirePermission('comercial', 'proveedores', 'eliminar')
  @Delete('ordenes-compra/:id')
  @HttpCode(HttpStatus.OK)
  async removeOrden(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.proveedoresService.removeOrden(id, user.id);
  }

  /**
   * POST /api/ordenes-compra/:id/cambiar-estado
   * Aprobar / recibir / cancelar.
   * Permiso: comercial.proveedores.editar
   */
  @RequirePermission('comercial', 'proveedores', 'editar')
  @Post('ordenes-compra/:id/cambiar-estado')
  async cambiarEstadoOrden(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoOrdenDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };

    // Valida que no llegue un estado no soportado por el DTO (defensa extra).
    if (!dto.estado) {
      throw new BadRequestException('El estado es requerido');
    }
    return this.proveedoresService.cambiarEstadoOrden(id, dto, user.id);
  }
}