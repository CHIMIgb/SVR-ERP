/**
 * Integration tests for CribaService audit logging — real DB, no mocks.
 *
 * Verifies that cada operación CRUD de registros de criba escribe el audit
 * correcto en `registro_auditoria`:
 *   REGISTRO_CRIBA_CREADO, REGISTRO_CRIBA_ACTUALIZADO, REGISTRO_CRIBA_ELIMINADO
 *
 * Run with: npm run test:integration -- --testPathPattern="criba"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, Turno } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { CribaService } from './criba.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Criba Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: CribaService;

  const createdRegistroIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, CribaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(CribaService);
    // Sin FK a trabajadores en estos tests (operador_id nullable) — la validación
    // del operador se cubre en unitarios.
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdRegistroIds.length > 0) {
      await prisma.registros_criba.deleteMany({
        where: { id: { in: createdRegistroIds } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    fecha: '2026-08-20',
    turno: Turno.MATUTINO,
    tipoMaterial: `Arena lavada`,
    materialProducido: 500,
    horasTrabajadas: 8,
    materialAlBanco: 450,
    ...overrides,
  });

  // Marca única para no mezclar stats con datos de otros tests/días
  const marcaUnica = () => `Test-${TEST_ID}-${randomUUID().slice(0, 4)}`;

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('REGISTRO_CRIBA_CREADO', () => {
    it('debe crear registro y registrar REGISTRO_CRIBA_CREADO en registro_auditoria', async () => {
      const dto = createDto();
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      expect(registro.turno).toBe('Matutino');
      expect(registro.materialProducido).toBe(500);

      const audits = await findAudits(AuditAction.REGISTRO_CRIBA_CREADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.tipoMaterial).toBe(dto.tipoMaterial);

      // Metadata mínima automática presente
      const metadata = audits[0].metadata as Record<string, unknown> | null;
      expect(metadata).not.toBeNull();
      expect(metadata?.source).toBe('SYSTEM'); // sin HTTP context en test directo
    });

    it('debe rechazar crear con al banco mayor a producido', async () => {
      await expect(
        service.create(createDto({ materialAlBanco: 600 }), ACTOR_USER_ID),
      ).rejects.toThrow('no puede ser mayor');
    });
  });

  describe('stats', () => {
    it('debe calcular totales y eficiencia por material correctamente', async () => {
      // Semilla aislada: dos registros del mismo material único para este test
      const material = marcaUnica();
      const r1 = await service.create(
        createDto({ tipoMaterial: material, materialProducido: 400, materialAlBanco: 380 }),
        ACTOR_USER_ID,
      );
      createdRegistroIds.push(r1.id);

      const r2 = await service.create(
        createDto({ tipoMaterial: material, materialProducido: 100, materialAlBanco: 80 }),
        ACTOR_USER_ID,
      );
      createdRegistroIds.push(r2.id);

      // Soft-delete de uno ajeno al material para validar que stats lo ignora
      const borrado = await service.create(
        createDto({ tipoMaterial: material, materialProducido: 999, materialAlBanco: 900 }),
        ACTOR_USER_ID,
      );
      createdRegistroIds.push(borrado.id);
      await service.remove(borrado.id, ACTOR_USER_ID);

      const stats = await service.findStats();
      const fila = stats.porMaterial.find((m) => m.tipo === material);

      expect(fila).toBeDefined();
      expect(fila?.producido).toBe(500);   // 400 + 100 (excluye eliminado)
      expect(fila?.alBanco).toBe(460);     // 380 + 80
      expect(fila?.ef).toBe(92);           // round(460/500*100)
    });
  });

  describe('REGISTRO_CRIBA_ACTUALIZADO', () => {
    it('debe actualizar registro y registrar valores previo/nuevo', async () => {
      const dto = createDto();
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const updated = await service.update(
        registro.id,
        { materialAlBanco: 480 },
        ACTOR_USER_ID,
      );
      expect(updated.materialAlBanco).toBe(480);

      const audits = await findAudits(AuditAction.REGISTRO_CRIBA_ACTUALIZADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.materialAlBanco).toBe(450);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.materialAlBanco).toBe(480);
    });

    it('debe rechazar actualizar a valores efectivos inválidos', async () => {
      const dto = createDto({ materialProducido: 300, materialAlBanco: 200 });
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      await expect(
        service.update(registro.id, { materialAlBanco: 350 }, ACTOR_USER_ID),
      ).rejects.toThrow('no puede ser mayor');
    });
  });

  describe('REGISTRO_CRIBA_ELIMINADO', () => {
    it('debe soft-delete registro y registrar REGISTRO_CRIBA_ELIMINADO', async () => {
      const dto = createDto();
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const result = await service.remove(registro.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const deleted = await prisma.registros_criba.findUnique({
        where: { id: registro.id },
      });
      expect(deleted?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.REGISTRO_CRIBA_ELIMINADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });
});
