/**
 * Integration tests for BitacoraService audit logging — real DB, no mocks.
 *
 * Verifies that cada operación CRUD de bitácora escribe el audit correcto
 * en `registro_auditoria`:
 *   BITACORA_CREADA, BITACORA_ACTUALIZADA, BITACORA_ELIMINADA
 *
 * Run with: npm run test:integration -- --testPathPattern="bitacora"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { BitacoraService } from './bitacora.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Bitacora Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: BitacoraService;

  let tipoMaquinaId: string;
  let maquinaId: string;
  let obraId: string;
  const createdBitacoraIds: string[] = [];

  // ── Setup ──────────────────────────────────────────────────

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, BitacoraService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(BitacoraService);

    // Crear catálogos de prueba
    tipoMaquinaId = randomUUID();
    maquinaId = randomUUID();
    obraId = randomUUID();

    const now = new Date();

    await prisma.tipos_maquina.create({
      data: {
        id: tipoMaquinaId,
        nombre: `TestTipo-${TEST_ID}`,
        activo: true,
        actualizado_en: now,
      },
    });

    await prisma.maquinas.create({
      data: {
        id: maquinaId,
        nombre: `TestMaquina-${TEST_ID}`,
        tipo_id: tipoMaquinaId,
        estado: 'APAGADA',
        lat: 0,
        lng: 0,
        activo: true,
        actualizado_en: now,
      },
    });

    await prisma.obras.create({
      data: {
        id: obraId,
        nombre: `TestObra-${TEST_ID}`,
        estado: 'EN_PROCESO',
        activo: true,
        actualizado_en: now,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    // Cleanup: bitacoras → máquina → obra → tipo de máquina
    if (createdBitacoraIds.length > 0) {
      await prisma.bitacoras_operacion.deleteMany({
        where: { id: { in: createdBitacoraIds } },
      });
    }

    await prisma.maquinas.deleteMany({ where: { id: maquinaId } });
    await prisma.obras.deleteMany({ where: { id: obraId } });
    await prisma.tipos_maquina.deleteMany({ where: { id: tipoMaquinaId } });

    await prisma.$disconnect();
    await app.close();
  });

  // Helper para crear DTO
  const createDto = (overrides: Record<string, unknown> = {}) => ({
    maquinaId,
    actividad: `Actividad test ${TEST_ID}`,
    horas: 5,
    fecha: '2026-08-23',
    obraTexto: `Obra test ${TEST_ID}`,
    obraId,
    ...overrides,
  });

  // Helper para buscar audits
  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  // ── Tests ──────────────────────────────────────────────────

  describe('BITACORA_CREADA', () => {
    it('debe crear bitácora y registrar BITACORA_CREADA en registro_auditoria', async () => {
      const dto = createDto();
      const bitacora = await service.create(dto, ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);

      const audits = await findAudits('BITACORA_CREADA', bitacora.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue).not.toBeNull();
      expect(newValue?.actividad).toBe(dto.actividad);
    });
  });

  describe('BITACORA_ACTUALIZADA', () => {
    it('debe actualizar bitácora y registrar BITACORA_ACTUALIZADA', async () => {
      const dto = createDto();
      const bitacora = await service.create(dto, ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);

      const updated = await service.update(
        bitacora.id,
        { actividad: 'Actividad actualizada', horas: 7 },
        ACTOR_USER_ID,
      );
      expect(updated.actividad).toBe('Actividad actualizada');

      const audits = await findAudits('BITACORA_ACTUALIZADA', bitacora.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue).not.toBeNull();
      expect(previousValue?.actividad).toBe(dto.actividad);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.actividad).toBe('Actividad actualizada');
    });
  });

  describe('BITACORA_ELIMINADA', () => {
    it('debe soft-delete bitácora y registrar BITACORA_ELIMINADA', async () => {
      const dto = createDto();
      const bitacora = await service.create(dto, ACTOR_USER_ID);
      createdBitacoraIds.push(bitacora.id);

      const result = await service.remove(bitacora.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminada');

      // Verificar soft delete
      const deleted = await prisma.bitacoras_operacion.findUnique({
        where: { id: bitacora.id },
      });
      expect(deleted?.eliminado_en).not.toBeNull();

      const audits = await findAudits('BITACORA_ELIMINADA', bitacora.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });
});
