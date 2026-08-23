import { AuditAction, AuditResult, AuditSeverity, ActorType } from '@prisma/client';

/**
 * DTO para registrar un evento de auditoría.
 *
 * Versión reducida de lo que propone audit-service-guide.md: aquí el
 * contexto HTTP (ip, userAgent, sessionId) se pasa explícito en vez de
 * leerse de un AsyncLocalStorage automático — mismo patrón que ya usa
 * IntentosLoginService.registrar(), para no introducir la maquinaria de
 * CLS/interceptor/decoradores hasta que haya módulos de negocio reales
 * que la necesiten.
 *
 * @example
 * // Caso mínimo:
 * await this.auditService.log({
 *   action: AuditAction.LOGOUT,
 *   entityType: 'sessions',
 *   entityId: userId,
 *   result: AuditResult.SUCCESS,
 * });
 */
export interface AuditLogDto {
  /** Acción realizada — usa el enum de Prisma */
  action: AuditAction;

  /** Nombre del modelo/tabla afectado (ej: 'users', 'sessions') */
  entityType: string;

  /** UUID del registro afectado */
  entityId: string;

  /** Resultado de la operación */
  result: AuditResult;

  /** Severidad (si no se provee, se calcula automáticamente del mapeo action→severity) */
  severity?: AuditSeverity;

  /** Snapshot del registro ANTES de la operación */
  previousValue?: Record<string, unknown> | null;

  /** Snapshot del registro DESPUÉS de la operación */
  newValue?: Record<string, unknown> | null;

  /** Datos adicionales arbitrarios */
  metadata?: Record<string, unknown> | null;

  /** Código de error (para result=FAIL/DENIED) */
  errorCode?: string;

  /** UUID del usuario actor (puede no haber JWT aún, ej. login) */
  actorUserId?: string;

  /** Rol del actor en texto libre (ej. "sin_autenticar", "autenticado") */
  actorRole?: string;

  /** Tipo de actor */
  actorType?: ActorType;

  // --- Contexto HTTP explícito (login/logout no siempre tienen JWT) ---

  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/** Variante de conveniencia para casos de fallo/denegación de acceso. */
export type AuditLogFailureDto = Pick<
  AuditLogDto,
  | 'action'
  | 'entityType'
  | 'entityId'
  | 'errorCode'
  | 'metadata'
  | 'actorUserId'
  | 'actorRole'
  | 'actorType'
  | 'ipAddress'
  | 'userAgent'
> & {
  /** true = DENIED (acceso denegado), false/omitido = FAIL (error de negocio) */
  denied?: boolean;
};
