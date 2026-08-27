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
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClientesDto } from './dto/query-clientes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('clientes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  /**
   * GET /api/clientes
   * Lista clientes con búsqueda y paginación.
   * Permiso: comercial.clientes.ver
   */
  @RequirePermission('comercial', 'clientes', 'ver')
  @Get()
  async findAll(@Query() query: QueryClientesDto) {
    return this.clientesService.findAll(query);
  }

  /**
   * GET /api/clientes/stats
   * Estadísticas para las tarjetas (total, activos, empresas).
   * Permiso: comercial.clientes.ver
   */
  @RequirePermission('comercial', 'clientes', 'ver')
  @Get('stats')
  async findStats() {
    return this.clientesService.findStats();
  }

  /**
   * GET /api/clientes/:id
   * Obtener un cliente por ID.
   * Permiso: comercial.clientes.ver
   */
  @RequirePermission('comercial', 'clientes', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientesService.findOne(id);
  }

  /**
   * POST /api/clientes
   * Crear un cliente.
   * Permiso: comercial.clientes.crear
   */
  @RequirePermission('comercial', 'clientes', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateClienteDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.clientesService.create(dto, user.id);
  }

  /**
   * PATCH /api/clientes/:id
   * Actualizar un cliente.
   * Permiso: comercial.clientes.editar
   */
  @RequirePermission('comercial', 'clientes', 'editar')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClienteDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.clientesService.update(id, dto, user.id);
  }

  /**
   * DELETE /api/clientes/:id
   * Eliminar (soft delete) un cliente.
   * Permiso: comercial.clientes.eliminar
   */
  @RequirePermission('comercial', 'clientes', 'eliminar')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.clientesService.remove(id, user.id);
  }
}
