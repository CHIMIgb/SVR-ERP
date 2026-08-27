/**
 * Integration tests for FinanzasService audit logging — real DB, no mocks.
 *
 * These tests verify that every transaction operation writes the correct
 * audit records to `registro_auditoria` in PostgreSQL:
 *   TRANSACCION_CREADA, TRANSACCION_ACTUALIZADA, TRANSACCION_ELIMINADA
 *
 * Run with: npm run test:integration
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, TipoTransaccion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { FinanzasService } from './finanzas.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Finanzas Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: FinanzasService;

  // IDs de transacciones creadas durante los tests (para limpieza)
  const createdTransaccionIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, FinanzasService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(FinanzasService);
  });

  afterAll(async () => {
    if (!prisma) return;

    // Cleanup: transacciones de prueba
    // registro_auditoria is IMMUTABLE — leave records
    if (createdTransaccionIds.length > 0) {
      await prisma.transacciones.deleteMany({
        where: { id: { in: createdTransaccionIds } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  // ── Helpers ────────────────────────────────────────────────

  function createDto(overrides: Record<string, unknown> = {}) {
    return {
      tipo: TipoTransaccion.INGRESO,
      categoria: 'Pago de Obra',
      monto: 1500,
      fecha: '2026-08-20',
      descripcion: `Transaccion test ${TEST_ID} ${Math.random().toString(36).slice(2, 6)}`,
      ...overrides,
    };
  }

  async function findAudits(action: AuditAction, entityId?: string) {
    return prisma.registro_auditoria.findMany({
      where: {
        action,
        ...(entityId ? { entity_id: entityId } : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  // ── Tests ──────────────────────────────────────────────────

  describe('TRANSACCION_CREADA', () => {
    it('debe crear transacción y registrar TRANSACCION_CREADA', async () => {
      const dto = createDto();
      const transaccion = await service.create(dto, ACTOR_USER_ID);
      createdTransaccionIds.push(transaccion.id);

      const audits = await findAudits(AuditAction.TRANSACCION_CREADA, transaccion.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);

      const audit = audits[0];
      expect(audit.entity_type).toBe('transacciones');
      expect(audit.entity_id).toBe(transaccion.id);
      expect(audit.actor_user_id).toBe(ACTOR_USER_ID);
      expect(audit.actor_type).toBe('USER');
      expect(audit.result).toBe('SUCCESS');
      expect(audit.previous_value).toBeNull();
      expect(audit.new_value).toBeDefined();
      expect(transaccion.codigo).toMatch(/^TRA-/);
    });
  });

  describe('TRANSACCION_ACTUALIZADA', () => {
    it('debe actualizar y registrar TRANSACCION_ACTUALIZADA', async () => {
      const dto = createDto();
      const transaccion = await service.create(dto, ACTOR_USER_ID);
      createdTransaccionIds.push(transaccion.id);

      await service.update(transaccion.id, { monto: 900 }, ACTOR_USER_ID);

      const audits = await findAudits(AuditAction.TRANSACCION_ACTUALIZADA, transaccion.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
      expect(audits[0].previous_value).toBeDefined();
      expect(audits[0].new_value).toBeDefined();
    });

    it('debe registrar FAIL TRANSACCION_NO_ENCONTRADA al actualizar inexistente', async () => {
      const txId = randomUUID();

      await expect(service.update(txId, { monto: 100 }, ACTOR_USER_ID)).rejects.toThrow();

      const audits = await findAudits(AuditAction.TRANSACCION_ACTUALIZADA);
      const failed = audits.find(
        (a) => a.result === 'FAIL' && a.error_code === 'TRANSACCION_NO_ENCONTRADA',
      );
      expect(failed).toBeDefined();
      expect(failed!.actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('TRANSACCION_ELIMINADA', () => {
    it('debe soft-delete y registrar TRANSACCION_ELIMINADA', async () => {
      const dto = createDto();
      const transaccion = await service.create(dto, ACTOR_USER_ID);
      // No push to createdTransaccionIds — it's been soft-deleted

      await service.remove(transaccion.id, ACTOR_USER_ID);

      const audits = await findAudits(AuditAction.TRANSACCION_ELIMINADA, transaccion.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].previous_value).toBeDefined();
    });

    it('debe registrar FAIL TRANSACCION_NO_ENCONTRADA al eliminar inexistente', async () => {
      const txId = randomUUID();

      await expect(service.remove(txId, ACTOR_USER_ID)).rejects.toThrow();

      const audits = await findAudits(AuditAction.TRANSACCION_ELIMINADA);
      const failed = audits.find(
        (a) => a.result === 'FAIL' && a.error_code === 'TRANSACCION_NO_ENCONTRADA',
      );
      expect(failed).toBeDefined();
      expect(failed!.actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('findStats (Real DB)', () => {
    it('debe calcular balance, totales y cantidad de las transacciones de prueba', async () => {
      const ingreso = await service.create(
        createDto({ tipo: TipoTransaccion.INGRESO, monto: 5000 }),
        ACTOR_USER_ID,
      );
      createdTransaccionIds.push(ingreso.id);

      const egreso = await service.create(
        createDto({ tipo: TipoTransaccion.EGRESO, monto: 1200 }),
        ACTOR_USER_ID,
      );
      createdTransaccionIds.push(egreso.id);

      const stats = await service.findStats();
      expect(stats.balance).toBeGreaterThanOrEqual(3800);
      expect(stats.totalIngresos).toBeGreaterThanOrEqual(5000);
      expect(stats.totalEgresos).toBeGreaterThanOrEqual(1200);
      expect(stats.cantidad).toBeGreaterThanOrEqual(1);
    });
  });
});
