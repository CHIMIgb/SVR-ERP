import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { Request } from 'express';
import { NominaService } from './nomina.service';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto';
import { ActualizarEstadoNominaDto } from './dto/actualizar-estado-nomina.dto';
import { QueryPeriodoDto } from './dto/query-periodo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('nomina')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NominaController {
  constructor(private readonly nominaService: NominaService) {}

  @RequirePermission('rrhh', 'nomina', 'ver')
  @Get('actual')
  async findActual(@Query() query: QueryPeriodoDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.nominaService.findActual(query, user.id);
  }

  @RequirePermission('rrhh', 'nomina', 'procesar')
  @Post(':periodoId/sincronizar')
  @HttpCode(HttpStatus.OK)
  async sincronizarAsistencia(@Param('periodoId', ParseUUIDPipe) periodoId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.nominaService.sincronizarAsistencia(periodoId, user.id);
  }

  @RequirePermission('rrhh', 'nomina', 'crear')
  @Post(':id/ajuste')
  @HttpCode(HttpStatus.CREATED)
  async registrarAjuste(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RegistrarAjusteDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.nominaService.registrarAjuste(id, dto, user.id);
  }

  @RequirePermission('rrhh', 'nomina', 'editar')
  @Patch(':id/estado')
  async actualizarEstado(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarEstadoNominaDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.nominaService.actualizarEstado(id, dto, user.id);
  }

  @RequirePermission('rrhh', 'nomina', 'editar')
  @Post(':periodoId/pagar-todos')
  @HttpCode(HttpStatus.OK)
  async pagarTodos(@Param('periodoId', ParseUUIDPipe) periodoId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.nominaService.pagarTodos(periodoId, user.id);
  }
}
