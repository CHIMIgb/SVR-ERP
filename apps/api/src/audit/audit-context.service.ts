import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Contexto HTTP de auditoría que se propaga automáticamente vía AsyncLocalStorage.
 * Se llena en cada request por el AuditContextInterceptor y se lee en AuditService.log().
 *
 * Ventaja: ningún service o controller necesita pasar ip/userAgent/sessionId
 * manualmente — el AuditService lo obtiene solo.
 */
export interface AuditRequestContext {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditRequestContext>();

  /**
   * Ejecuta un callback dentro de un contexto de auditoría.
   * Todo código asíncrono dentro del callback hereda el contexto.
   */
  run<T>(context: AuditRequestContext, callback: () => T | Promise<T>): T | Promise<T> {
    return this.storage.run(context, callback);
  }

  /** Lee el contexto de la request actual (o undefined si no hay request activa). */
  getContext(): AuditRequestContext | undefined {
    return this.storage.getStore();
  }
}
