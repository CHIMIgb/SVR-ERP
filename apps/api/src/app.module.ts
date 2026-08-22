import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventarioModule } from './inventario/inventario.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // Rate limiting: SOLO se aplica donde se use @UseGuards(ThrottlerGuard)
    // (AuthController). El resto de la API NO tiene rate limiting.
    ThrottlerModule.forRoot([
      {
        name: 'short',   // Login: 5 intentos / 15 min
        ttl: 900000,
        limit: 5,
      },
      {
        name: 'medium',  // Refresh: 30 requests / 15 min
        ttl: 900000,
        limit: 30,
      },
      {
        name: 'long',    // General (no usado globalmente)
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    InventarioModule,
  ],
  providers: [
    // NO ThrottlerGuard global — solo en AuthController
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
