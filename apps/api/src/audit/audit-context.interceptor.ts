import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditContextService, AuditRequestContext } from './audit-context.service';

/**
 * Interceptor global que popula el AuditRequestContext en cada request autenticada.
 *
 * Se ejecuta DESPUÉS de los guards (JwtAuthGuard, PermissionsGuard), así que
 * req.user ya tiene { id, email, jti, sessionId } disponibles.
 *
 * Propaga el contexto vía AsyncLocalStorage para que AuditService.log() lo lea
 * automáticamente — ningún service/controller necesita pasar ip/userAgent/sessionId.
 */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(private readonly auditContext: AuditContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as
      | { id?: string; email?: string; nombre?: string; sessionId?: string; jti?: string; iat?: number }
      | undefined;

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
}
