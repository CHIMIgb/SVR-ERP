import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventarioModule } from './inventario/inventario.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // Rate limiting global con 3 niveles configurables
    ThrottlerModule.forRoot([
      {
        name: 'short',   // Para endpoints sensibles (login, register)
        ttl: 900000,     // 15 minutos
        limit: 5,        // 5 intentos por 15 min
      },
      {
        name: 'medium',  // Para refresh y operaciones normales
        ttl: 900000,     // 15 minutos
        limit: 30,       // 30 requests por 15 min
      },
      {
        name: 'long',    // Default para toda la API
        ttl: 60000,      // 1 minuto
        limit: 60,       // 60 requests por minuto
      },
    ]),
    PrismaModule,
    AuthModule,
    InventarioModule,
  ],
  providers: [
    // Guard global de rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
