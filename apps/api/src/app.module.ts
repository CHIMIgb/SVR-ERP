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
import { ClientesModule } from './clientes/clientes.module';
import { ReportesCampoModule } from './reportes-campo/reportes-campo.module';
import { InventarioModule } from './inventario/inventario.module';
import { BitacoraModule } from './bitacora/bitacora.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { TrabajadoresModule } from './trabajadores/trabajadores.module';
import { BitacorasRentaModule } from './bitacoras-renta/bitacoras-renta.module';
import { AsistenciaModule } from './asistencia/asistencia.module';
import { NominaModule } from './nomina/nomina.module';
import { GpsModule } from './gps/gps.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { ConciliacionBancariaModule } from './conciliacion-bancaria/conciliacion-bancaria.module';
import { VentasModule } from './ventas/ventas.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { CobranzaModule } from './cobranza/cobranza.module';
import { FacturasModule } from './facturas/facturas.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/** int de env con default (mismo patrón de bloqueo.service). */
function envInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

@Module({
  imports: [
    // Rate limiting: SOLO se aplica donde se use @UseGuards(ThrottlerGuard)
    // (auth/login, login-pin, register, refresh). Límites configurables por
    // env — en dev se suben para no bloquear las pruebas (el anti fuerza
    // bruta real lo llevan el bloqueo escalonado por cuenta y el por IP).
    ThrottlerModule.forRoot([
      {
        name: 'short',   // Login: THROTTLE_SHORT_LIMIT (default 5) / 15 min
        ttl: envInt('THROTTLE_SHORT_TTL_MIN', 15) * 60_000,
        limit: envInt('THROTTLE_SHORT_LIMIT', 5),
      },
      {
        name: 'medium',  // Refresh: 30 requests / 15 min
        ttl: 900000,
        limit: 30,
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
    ClientesModule,
    ReportesCampoModule,
    InventarioModule,
    BitacoraModule,
    ProyectosModule,
    TrabajadoresModule,
    BitacorasRentaModule,
    AsistenciaModule,
    NominaModule,
    GpsModule,
    // Antes que FinanzasModule: /finanzas/bancos|cuentas|movimientos estáticos
    // deben ganar sobre @Get(':id') de FinanzasController.
    ConciliacionBancariaModule,
    FinanzasModule,
    VentasModule,
    ProveedoresModule,
    CobranzaModule,
    FacturasModule,
    NotificacionesModule,
    UsuariosModule,
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
