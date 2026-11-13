import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('sistema', 'notificaciones', 'ver')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  findMine(
    @Query() query: { page?: string; limit?: string },
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.notificacionesService.findMine(user.id, {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  /** Rutas fijas ANTES que :id/leer para que no las capture el parámetro. */
  @Patch('leer-todas')
  marcarTodas(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificacionesService.marcarTodas(user.id);
  }

  @Patch('descartar-todas')
  descartarTodas(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificacionesService.descartarTodas(user.id);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificacionesService.marcarLeida(id, user.id);
  }
}

