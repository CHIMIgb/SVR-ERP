import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('clientes/:clienteId/cotizaciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  /**
   * GET /api/clientes/:clienteId/cotizaciones
   * Historial de cotizaciones de un cliente.
   * Permiso: comercial.cotizaciones.ver
   */
  @RequirePermission('comercial', 'cotizaciones', 'ver')
  @Get()
  async findByCliente(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.cotizacionesService.findByCliente(clienteId);
  }

  /**
   * POST /api/clientes/:clienteId/cotizaciones
   * Crear una cotización para un cliente.
   * Permiso: comercial.cotizaciones.crear
   */
  @RequirePermission('comercial', 'cotizaciones', 'crear')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Body() dto: CreateCotizacionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.cotizacionesService.create(clienteId, dto, user.id);
  }
}
