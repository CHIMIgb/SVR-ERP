import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MaquinasModule } from './modules/maquinas/maquinas.module';
import { HorometroModule } from './modules/horometro/horometro.module';
import { DespachosModule } from './modules/despachos/despachos.module';
import { ChecklistsModule } from './modules/checklists/checklists.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { MantenimientoModule } from './modules/mantenimiento/mantenimiento.module';
import { CombustibleModule } from './modules/combustible/combustible.module';
import { CribaModule } from './criba/criba.module';
import { ReportesCampoModule } from './reportes-campo/reportes-campo.module';
import { InventarioModule } from './inventario/inventario.module';
import { BitacoraModule } from './bitacora/bitacora.module';
import { IncidentesModule } from './incidentes/incidentes.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { TrabajadoresModule } from './trabajadores/trabajadores.module';
import { BitacorasRentaModule } from './bitacoras-renta/bitacoras-renta.module';
import { AsistenciaModule } from './asistencia/asistencia.module';
import { NominaModule } from './nomina/nomina.module';
import { FinanzasModule } from './finanzas/finanzas.module';
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
    MaquinasModule,
    HorometroModule,
    DespachosModule,
    ChecklistsModule,
    CatalogosModule,
    MantenimientoModule,
    CombustibleModule,
    CribaModule,
    ReportesCampoModule,
    InventarioModule,
    BitacoraModule,
    IncidentesModule,
    ProyectosModule,
    TrabajadoresModule,
    BitacorasRentaModule,
    AsistenciaModule,
    NominaModule,
    FinanzasModule,
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
