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
import { InventarioService } from './inventario.service';
import { CreateArticuloDto } from './dto/create-articulo.dto';
import { UpdateArticuloDto } from './dto/update-articulo.dto';
import { QueryArticulosDto } from './dto/query-articulos.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('inventario')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * GET /api/inventario
   * Lista artículos con búsqueda, filtros y paginación.
   * Permiso: operaciones.inventario.ver
   */
  @RequirePermission('operaciones', 'inventario', 'ver')
  @Get()
  async findAll(@Query() query: QueryArticulosDto) {
    return this.inventarioService.findAll(query);
  }

  /**
   * GET /api/inventario/stats
   * Estadísticas del inventario (total, stock bajo, valor).
   * Permiso: operaciones.inventario.ver
   */
  @RequirePermission('operaciones', 'inventario', 'ver')
  @Get('stats')
  async findStats() {
    return this.inventarioService.findStats();
  }

  /**
   * GET /api/inventario/catalogos
   * Catálogos para selects: categorías, proveedores, unidades.
   * Permiso: operaciones.inventario.ver
   */
  @RequirePermission('operaciones', 'inventario', 'ver')
  @Get('catalogos')
  async findCatalogos() {
    return this.inventarioService.findCatalogos();
  }

  /**
   * GET /api/inventario/:id
   * Obtener un artículo por ID.
   * Permiso: operaciones.inventario.ver
   */
  @RequirePermission('operaciones', 'inventario', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventarioService.findOne(id);
  }

  /**
   * POST /api/inventario
   * Crear un nuevo artículo.
   * Permiso: operaciones.inventario.crear
   */
  @RequirePermission('operaciones', 'inventario', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateArticuloDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.inventarioService.create(dto, user.id);
  }

  /**
   * PATCH /api/inventario/:id
   * Actualizar un artículo existente.
   * Permiso: operaciones.inventario.editar
   */
  @RequirePermission('operaciones', 'inventario', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticuloDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.inventarioService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/inventario/:id
   * Eliminar (soft delete) un artículo.
   * Permiso: operaciones.inventario.eliminar
   */
  @RequirePermission('operaciones', 'inventario', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.inventarioService.remove(id, user.id);
  }

  /**
   * POST /api/inventario/movimiento
   * Registrar movimiento de stock (entrada/salida).
   * Permiso: operaciones.inventario.editar
   */
  @RequirePermission('operaciones', 'inventario', 'editar')
  @Post('movimiento')
  @HttpCode(HttpStatus.CREATED)
  async crearMovimiento(
    @Body() dto: CreateMovimientoDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.inventarioService.crearMovimiento(dto, user.id);
  }
}
