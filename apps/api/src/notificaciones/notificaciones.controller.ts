import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { BajaSuscripcionPushDto, SuscripcionPushDto } from './dto/push.dto';

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

  /**
   * POST /notificaciones/push-suscripcion — fase a del plan de push:
   * registra/actualiza la suscripción Web Push del dispositivo autenticado
   * (el user_id SIEMPRE viene del JWT, nunca del body).
   */
  @Post('push-suscripcion')
  @HttpCode(HttpStatus.CREATED)
  suscribirPush(@Body() dto: SuscripcionPushDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificacionesService.suscribirPush(user.id, dto);
  }

  /** DELETE /notificaciones/push-suscripcion — baja por endpoint (solo la propia). */
  @Delete('push-suscripcion')
  cancelarPush(@Body() dto: BajaSuscripcionPushDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.notificacionesService.cancelarSuscripcionPush(user.id, dto.endpoint);
  }
}

