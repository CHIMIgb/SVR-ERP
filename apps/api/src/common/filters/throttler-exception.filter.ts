import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Extraer ttl y limit del header de throttler
    const retryAfter = exception?.getResponse?.();
    const ttl =
      typeof retryAfter === 'object' && retryAfter !== null
        ? (retryAfter as Record<string, unknown>).ttl
        : undefined;

    const retryAfterSeconds =
      typeof ttl === 'number' ? Math.ceil(ttl / 1000) : 60;

    response.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${retryAfterSeconds} segundo(s).`,
        details: {
          retryAfter: retryAfterSeconds,
        },
      },
    });
  }
}
