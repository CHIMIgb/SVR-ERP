import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditContextService } from './audit-context.service';
import { AuditContextInterceptor } from './audit-context.interceptor';

/**
 * Módulo de auditoría. Provee:
 * - AuditService: logging de eventos de auditoría (registro_auditoria)
 * - AuditContextService: AsyncLocalStorage para contexto HTTP automático
 * - AuditContextInterceptor: interceptor global que popula el contexto en cada request
 *
 * Cualquier módulo que importe AuditModule obtiene automáticamente la auditoría
 * con ip/userAgent/sessionId — sin necesidad de pasarlos manualmente.
 */
@Module({
  providers: [
    AuditService,
    AuditContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
  exports: [AuditService, AuditContextService],
})
export class AuditModule {}
