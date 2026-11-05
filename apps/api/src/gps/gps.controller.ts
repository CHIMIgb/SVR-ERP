import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { GpsService } from './gps.service';
import { CreateGeocercaDto } from './dto/create-geocerca.dto';
import { UpdateGeocercaDto } from './dto/update-geocerca.dto';
import { QueryGeocercasDto } from './dto/query-geocercas.dto';
import { QueryHistorialDto } from './dto/query-historial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

/**
 * Rastreo GPS de maquinaria. El recurso `maquinaria.gps` sólo tiene sembradas
 * las acciones `ver` y `editar` ("Configurar geocercas"), así que toda
 * mutación —incluido eliminar una geocerca— va detrás de `editar`.
 */
@Controller('gps')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  // ── Rastreo ──────────────────────────────────
  @RequirePermission('maquinaria', 'gps', 'ver')
  @Get('maquinas')
  async findMaquinasEnVivo() {
    return this.gpsService.findMaquinasEnVivo();
  }

  @RequirePermission('maquinaria', 'gps', 'ver')
  @Get('maquinas/:maquinaId/historial')
  async findHistorial(@Param('maquinaId') maquinaId: string, @Query() query: QueryHistorialDto) {
    return this.gpsService.findHistorialMaquina(maquinaId, query);
  }

  // ── Geocercas ────────────────────────────────
  @RequirePermission('maquinaria', 'gps', 'ver')
  @Get('geocercas')
  async findAllGeocercas(@Query() query: QueryGeocercasDto) {
    return this.gpsService.findAllGeocercas(query);
  }

  @RequirePermission('maquinaria', 'gps', 'ver')
  @Get('geocercas/:id')
  async findOneGeocerca(@Param('id', ParseUUIDPipe) id: string) {
    return this.gpsService.findOneGeocerca(id);
  }

  @RequirePermission('maquinaria', 'gps', 'editar')
  @Post('geocercas')
  @HttpCode(HttpStatus.CREATED)
  async createGeocerca(@Body() dto: CreateGeocercaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.gpsService.createGeocerca(dto, user.id);
  }

  @RequirePermission('maquinaria', 'gps', 'editar')
  @Patch('geocercas/:id')
  async updateGeocerca(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGeocercaDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.gpsService.updateGeocerca(id, dto, user.id);
  }

  @RequirePermission('maquinaria', 'gps', 'editar')
  @Delete('geocercas/:id')
  @HttpCode(HttpStatus.OK)
  async removeGeocerca(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.gpsService.removeGeocerca(id, user.id);
  }

  // ── Simulación (sustituye al feed del proveedor mientras no hay acceso) ──
  @RequirePermission('maquinaria', 'gps', 'editar')
  @Post('simular')
  @HttpCode(HttpStatus.OK)
  async simular(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.gpsService.simularMovimiento(user.id);
  }
}
