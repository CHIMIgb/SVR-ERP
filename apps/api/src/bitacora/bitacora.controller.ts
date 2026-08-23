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
import { BitacoraService } from './bitacora.service';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { UpdateBitacoraDto } from './dto/update-bitacora.dto';
import { QueryBitacorasDto } from './dto/query-bitacoras.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('bitacora')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  /**
   * GET /api/bitacora
   * Lista registros de bitácora con búsqueda, filtros y paginación.
   * Permiso: operaciones.operaciones.ver
   */
  @RequirePermission('operaciones', 'operaciones', 'ver')
  @Get()
  async findAll(@Query() query: QueryBitacorasDto) {
    return this.bitacoraService.findAll(query);
  }

  /**
   * GET /api/bitacora/stats
   * Estadísticas de la bitácora (total registros, horas totales, máquinas activas).
   * Permiso: operaciones.operaciones.ver
   */
  @RequirePermission('operaciones', 'operaciones', 'ver')
  @Get('stats')
  async findStats() {
    return this.bitacoraService.findStats();
  }

  /**
   * GET /api/bitacora/catalogos
   * Catálogos para selects: máquinas y obras.
   * Permiso: operaciones.operaciones.ver
   */
  @RequirePermission('operaciones', 'operaciones', 'ver')
  @Get('catalogos')
  async findCatalogos() {
    return this.bitacoraService.findCatalogos();
  }

  /**
   * GET /api/bitacora/:id
   * Obtener un registro de bitácora por ID.
   * Permiso: operaciones.operaciones.ver
   */
  @RequirePermission('operaciones', 'operaciones', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bitacoraService.findOne(id);
  }

  /**
   * POST /api/bitacora
   * Crear un nuevo registro de bitácora.
   * Permiso: operaciones.operaciones.crear
   */
  @RequirePermission('operaciones', 'operaciones', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateBitacoraDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.bitacoraService.create(dto, user.id);
  }

  /**
   * PATCH /api/bitacora/:id
   * Actualizar un registro de bitácora existente.
   * Permiso: operaciones.operaciones.editar
   */
  @RequirePermission('operaciones', 'operaciones', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBitacoraDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.bitacoraService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/bitacora/:id
   * Eliminar (soft delete) un registro de bitácora.
   * Permiso: operaciones.operaciones.eliminar
   */
  @RequirePermission('operaciones', 'operaciones', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.bitacoraService.remove(id, user.id);
  }
}
