import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { PinService } from './pin.service';
import { LoginPinDto, PinCambioDto, PinReinicioDto, PinDesbloqueoDto } from './dto/pin.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermission } from '../guards/require-permission.decorator';

@Controller('auth')
export class PinController {
  constructor(private readonly pinService: PinService) {}

  /**
   * POST /api/auth/login-pin
   * Login móvil: número de empleado + PIN (spec §6.4-6.5).
   * Rate limit: 5 por 15 min por IP — ThrottlerGuard REAL (review PR #18 #3:
   * el @Throttle solo era decoración sin el guard) + bloqueo por IP y por
   * cuenta en PinService, como pide el spec §6.7.
   */
  @Throttle({ short: { limit: 5, ttl: 900000 } })
  @UseGuards(ThrottlerGuard)
  @Post('login-pin')
  @HttpCode(HttpStatus.OK)
  async loginPin(@Body() dto: LoginPinDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.pinService.loginPin(dto, ip, userAgent);
  }

  /**
   * POST /api/auth/pin/cambio
   * Cambio de PIN propio: reautentica con el PIN actual y cierra las OTRAS
   * sesiones (spec §6.6-6).
   */
  @UseGuards(JwtAuthGuard)
  @Post('pin/cambio')
  @HttpCode(HttpStatus.OK)
  async cambiar(@Body() dto: PinCambioDto, @Req() req: Request) {
    const user = req.user as { id: string; sessionId?: string };
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.pinService.cambiarPin(dto, user.id, user.sessionId!, ip, userAgent);
  }

  /**
   * POST /api/auth/pin/reinicio
   * Mesa de ayuda (escritorio): reinicio con temporal de 24 h (spec §6.8).
   * El temporal se entrega UNA VEZ al ejecutante.
   */
  @RequirePermission('sistema', 'usuarios', 'editar')
  @UseGuards(JwtAuthGuard)
  @Post('pin/reinicio')
  @HttpCode(HttpStatus.OK)
  async reiniciar(@Body() dto: PinReinicioDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.pinService.reiniciarPin(dto.userId, user.id, ip, userAgent);
  }

  /**
   * POST /api/auth/pin/desbloqueo
   * Mesa de ayuda (escritorio): desbloquea la cuenta tras 5 intentos.
   */
  @RequirePermission('sistema', 'usuarios', 'editar')
  @UseGuards(JwtAuthGuard)
  @Post('pin/desbloqueo')
  @HttpCode(HttpStatus.OK)
  async desbloquear(@Body() dto: PinDesbloqueoDto, @Req() req: Request) {
    const user = req.user as { id: string };
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.pinService.desbloquear(dto.userId, user.id, ip, userAgent);
  }

  /**
   * GET /api/auth/pin/estado
   * Estado del PIN propio: aviso a los 25 días, bloqueo si venció, temporal.
   */
  @UseGuards(JwtAuthGuard)
  @Get('pin/estado')
  async estado(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.pinService.estado(user.id);
  }
}
