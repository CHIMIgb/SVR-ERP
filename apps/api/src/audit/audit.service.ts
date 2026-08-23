import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogDto, AuditLogFailureDto } from './audit.types';
import { ACTION_SEVERITY_MAP, AUDIT_SENSITIVE_FIELDS } from './audit.constants';

const SYSTEM_ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento de auditoría. NUNCA lanza errores — si falla el
   * INSERT, solo se loguea el error; la operación de negocio (login,
   * logout, etc.) no debe verse afectada por un fallo de auditoría.
   *
   * @example
   * await this.auditService.log({
   *   action: AuditAction.LOGIN_EXITOSO,
   *   entityType: 'sessions',
   *   entityId: session.id,
   *   result: AuditResult.SUCCESS,
   *   actorUserId: user.id,
   *   actorRole: 'autenticado',
   * });
   */
  async log(dto: AuditLogDto): Promise<void> {
    try {
      const severity = dto.severity ?? ACTION_SEVERITY_MAP[dto.action] ?? 'INFO';
      const previousValue = dto.previousValue ? this.sanitize(dto.previousValue) : undefined;
      const newValue = dto.newValue ? this.sanitize(dto.newValue) : undefined;

      await this.prisma.registro_auditoria.create({
        data: {
          event_id: randomUUID(),
          timestamp: new Date(),
          actor_user_id: dto.actorUserId ?? null,
          actor_role: dto.actorRole ?? 'SYSTEM',
          actor_type: dto.actorType ?? 'SYSTEM',
          action: dto.action,
          entity_type: dto.entityType,
          entity_id: dto.entityId,
          result: dto.result,
          severity,
          ip_address: dto.ipAddress ?? 'unknown',
          user_agent: dto.userAgent ?? 'unknown',
          session_id: dto.sessionId ?? null,
          request_id: randomUUID(),
          correlation_id: randomUUID(),
          error_code: dto.errorCode ?? null,
          previous_value: (previousValue as Prisma.InputJsonValue) ?? undefined,
          new_value: (newValue as Prisma.InputJsonValue) ?? undefined,
          metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
        },
      });

      this.logger.debug(
        `Auditoría: [${dto.actorType ?? 'SYSTEM'}] ${dto.action} → ${dto.entityType}/${dto.entityId} = ${dto.result}`,
      );
    } catch (error) {
      // Nunca propagar: la auditoría es secundaria a la operación de negocio.
      this.logger.error(
        `AUDIT_FAIL [${dto.action}] entity=${dto.entityType}/${dto.entityId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Shortcut para registrar fallos/accesos denegados con menos campos.
   * Usa el placeholder de entityId cuando aún no se conoce (ej. usuario
   * no encontrado en login).
   */
  async logFailure(dto: AuditLogFailureDto): Promise<void> {
    await this.log({
      ...dto,
      entityId: dto.entityId || SYSTEM_ENTITY_PLACEHOLDER,
      result: dto.denied ? 'DENIED' : 'FAIL',
      severity: dto.denied ? 'WARNING' : 'CRITICAL',
    });
  }

  /** Elimina campos sensibles antes de guardar previous_value/new_value. */
  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };
    for (const field of AUDIT_SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
