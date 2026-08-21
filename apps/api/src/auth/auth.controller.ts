import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Rate limit: 5 intentos por 15 minutos por IP (anti brute-force).
   */
  @Throttle({ short: { limit: 5, ttl: 900000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  /**
   * POST /api/auth/register
   * Rate limit: 3 registros por hora por IP (anti spam).
   */
  @Throttle({ short: { limit: 3, ttl: 3600000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, ip, userAgent);
  }

  /**
   * POST /api/auth/refresh
   * Rate limit: 30 requests por 15 minutos (rotación normal de tokens).
   * Requiere refresh token válido.
   */
  @Throttle({ medium: { limit: 30, ttl: 900000 } })
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string; jti: string };
    return this.authService.refresh(user.id, user.jti);
  }

  /**
   * POST /api/auth/logout
   * Usa rate limit global: 60 req/min.
   * Requiere access token válido.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const user = req.user as { id: string };
    await this.authService.logout(user.id, '');
    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * GET /api/auth/profile
   * Usa rate limit global: 60 req/min.
   * Requiere access token válido.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.getProfile(user.id);
  }
}
