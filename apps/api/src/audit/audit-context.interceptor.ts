import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { AuditContextService, AuditRequestContext } from './audit-context.service';
import { AUDIT_SENSITIVE_FIELDS } from './audit.constants';

/**
 * Interceptor global que popula el AuditRequestContext en cada request autenticada.
 *
 * Se ejecuta DESPUÉS de los guards (JwtAuthGuard, PermissionsGuard), así que
 * req.user ya tiene { id, email, nombre, jti, iat, sessionId } disponibles y
 * request['auditRoles'] los roles que PermissionsGuard resolvió.
 *
 * Propaga el contexto vía AsyncLocalStorage para que AuditService.log() lo lea
 * automáticamente — ningún service/controller necesita pasar metadata manual.
 */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(private readonly auditContext: AuditContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse?.() as { statusCode?: number } | undefined;
    const user = req.user as
      | { id?: string; email?: string; nombre?: string; sessionId?: string; jti?: string; iat?: number }
      | undefined;

    // Un solo ID por request HTTP: todos los logs de este request lo comparten.
    // X-Request-Id permite que un gateway/frontend propague su propio trace.
    const requestId =
      (req.headers['x-request-id'] as string | undefined) || randomUUID();
    const correlationId =
      (req.headers['x-correlation-id'] as string | undefined) || requestId;

    // Query params de GETs — útiles para saber qué buscaba el usuario.
    const query = this.sanitizeQuery(req);

    // Origen: header explícito del frontend (Capacitor podrá mandar X-App-Platform)
    // o inferido del user-agent como fallback automático.
    const userAgentHeader = (req.headers['user-agent'] as string) || '';
    const plataforma =
      (req.headers['x-app-platform'] as string | undefined) ||
      (/capacitor|cordova/i.test(userAgentHeader) ? 'movil' : userAgentHeader ? 'web' : undefined);

    const store: AuditRequestContext = {
      ipAddress: req.ip ?? req.socket?.remoteAddress ?? undefined,
      userAgent: req.headers['user-agent'] ?? undefined,
      sessionId: user?.sessionId ?? undefined,
      endpoint: req.originalUrl ?? req.url,
      method: req.method,
      jwtUserId: user?.id,
      jwtEmail: user?.email,
      jwtNombre: user?.nombre,
      jti: user?.jti,
      jwtIat: user?.iat,
      requestId,
      correlationId,
      statusCode: typeof res?.statusCode === 'number' ? res.statusCode : undefined,
      startedAt: Date.now(),
      query,
      roles: Array.isArray(req['auditRoles']) ? (req['auditRoles'] as string[]) : undefined,
      origen:
        plataforma || (req.headers['x-app-version'] as string | undefined)
          ? {
              plataforma,
              appVersion: req.headers['x-app-version'] as string | undefined,
            }
          : undefined,
    };

    return new Observable((subscriber) => {
      this.auditContext.run(store, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  /**
   * Copia JSON-safe de los query params, redactando campos sensibles.
   * Solo valores primitivos y arreglos de strings — los objetos anidados
   * de querystrings complejas se marcan como [objeto] para no inflar el log.
   */
  private sanitizeQuery(req: Record<string, unknown>): Record<string, unknown> | undefined {
    if (req.method !== 'GET' || !req.query) return undefined;
    const raw = req.query as Record<string, unknown>;
    if (Object.keys(raw).length === 0) return undefined;

    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (AUDIT_SENSITIVE_FIELDS.includes(key as never)) {
        clean[key] = '[REDACTED]';
        continue;
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        clean[key] = value;
      } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        clean[key] = value;
      } else {
        clean[key] = '[objeto]';
      }
    }
    return Object.keys(clean).length > 0 ? clean : undefined;
  }
}
