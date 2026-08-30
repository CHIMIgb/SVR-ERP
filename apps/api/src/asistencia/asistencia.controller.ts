import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { Request } from 'express';
import { AsistenciaService } from './asistencia.service';
import { MarcarEntradaDto } from './dto/marcar-entrada.dto';
import { MarcarSalidaDto } from './dto/marcar-salida.dto';
import { MarcarCuadrillaDto } from './dto/marcar-cuadrilla.dto';
import { RegistrarFaltaDto } from './dto/registrar-falta.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { RegistrarHorasExtraDto } from './dto/registrar-horas-extra.dto';
import { QueryAsistenciaDto } from './dto/query-asistencia.dto';
import { QuerySemanalDto } from './dto/query-semanal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('asistencia')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @RequirePermission('rrhh', 'asistencia', 'ver')
  @Get()
  async findAll(@Query() query: QueryAsistenciaDto) {
    return this.asistenciaService.findAll(query);
  }

  @RequirePermission('rrhh', 'asistencia', 'ver')
  @Get('semanal')
  async findSemanal(@Query() query: QuerySemanalDto) {
    return this.asistenciaService.findSemanal(query);
  }

  @RequirePermission('rrhh', 'asistencia', 'ver')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.asistenciaService.findOne(id);
  }

  @RequirePermission('rrhh', 'asistencia', 'crear')
  @Post('entrada')
  @HttpCode(HttpStatus.CREATED)
  async marcarEntrada(@Body() dto: MarcarEntradaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.asistenciaService.marcarEntrada(dto, user.id);
  }

  @RequirePermission('rrhh', 'asistencia', 'crear')
  @Post('salida')
  @HttpCode(HttpStatus.OK)
  async marcarSalida(@Body() dto: MarcarSalidaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.asistenciaService.marcarSalida(dto, user.id);
  }

  @RequirePermission('rrhh', 'asistencia', 'crear')
  @Post('cuadrilla')
  @HttpCode(HttpStatus.CREATED)
  async marcarCuadrilla(@Body() dto: MarcarCuadrillaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.asistenciaService.marcarCuadrilla(dto, user.id);
  }

  @RequirePermission('rrhh', 'asistencia', 'crear')
  @Post('faltas')
  @HttpCode(HttpStatus.CREATED)
  async registrarFalta(@Body() dto: RegistrarFaltaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.asistenciaService.registrarFalta(dto, user.id);
  }

  @RequirePermission('rrhh', 'asistencia', 'editar')
  @Patch(':id/estado')
  async actualizarEstado(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarEstadoDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.asistenciaService.actualizarEstado(id, dto, user.id);
  }

  @RequirePermission('rrhh', 'asistencia', 'crear')
  @Post(':id/horas-extra')
  @HttpCode(HttpStatus.CREATED)
  async registrarHorasExtra(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarHorasExtraDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.asistenciaService.registrarHorasExtra(id, dto, user.id);
  }

  @RequirePermission('rrhh', 'asistencia', 'editar')
  @Patch('horas-extra/:id/aprobar')
  async aprobarHorasExtra(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.asistenciaService.aprobarHorasExtra(id, user.id);
  }

  @RequirePermission('rrhh', 'asistencia', 'editar')
  @Patch('horas-extra/:id/rechazar')
  async rechazarHorasExtra(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.asistenciaService.rechazarHorasExtra(id, user.id);
  }
}
