/**
 * Integration tests for IncidentesService audit logging — real DB, no mocks.
 *
 * Verifies that cada operación CRUD de incidentes escribe el audit correcto
 * en `registro_auditoria`:
 *   INCIDENTE_CREADO, INCIDENTE_ACTUALIZADO, INCIDENTE_ELIMINADO
 *
 * Run with: npm run test:integration -- --testPathPattern="incidentes"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, Prioridad, EstadoIncidente } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { IncidentesService } from './incidentes.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Incidentes Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: IncidentesService;

  let tipoMaquinaId: string;
  let maquinaId: string;
  let obraId: string;
  const createdIncidenteIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, IncidentesService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(IncidentesService);

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

    if (createdIncidenteIds.length > 0) {
      await prisma.incidentes.deleteMany({
        where: { id: { in: createdIncidenteIds } },
      });
    }

    await prisma.maquinas.deleteMany({ where: { id: maquinaId } });
    await prisma.obras.deleteMany({ where: { id: obraId } });
    await prisma.tipos_maquina.deleteMany({ where: { id: tipoMaquinaId } });

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    titulo: `Incidente test ${TEST_ID}`,
    descripcion: `Descripción test ${TEST_ID}`,
    prioridad: Prioridad.ALTA,
    estado: EstadoIncidente.ABIERTO,
    fecha: '2026-08-23',
    obraId,
    maquinaId,
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('INCIDENTE_CREADO', () => {
    it('debe crear incidente y registrar INCIDENTE_CREADO en registro_auditoria', async () => {
      const dto = createDto();
      const incidente = await service.create(dto, ACTOR_USER_ID);
      createdIncidenteIds.push(incidente.id);

      const audits = await findAudits(AuditAction.INCIDENTE_CREADO, incidente.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue).not.toBeNull();
      expect(newValue?.titulo).toBe(dto.titulo);
    });
  });

  describe('INCIDENTE_ACTUALIZADO', () => {
    it('debe actualizar incidente y registrar INCIDENTE_ACTUALIZADO', async () => {
      const dto = createDto();
      const incidente = await service.create(dto, ACTOR_USER_ID);
      createdIncidenteIds.push(incidente.id);

      const updated = await service.update(
        incidente.id,
        { titulo: 'Incidente actualizado', prioridad: Prioridad.CRITICA },
        ACTOR_USER_ID,
      );
      expect(updated.titulo).toBe('Incidente actualizado');

      const audits = await findAudits(AuditAction.INCIDENTE_ACTUALIZADO, incidente.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue).not.toBeNull();
      expect(previousValue?.titulo).toBe(dto.titulo);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.titulo).toBe('Incidente actualizado');
    });
  });

  describe('INCIDENTE_ELIMINADO', () => {
    it('debe soft-delete incidente y registrar INCIDENTE_ELIMINADO', async () => {
      const dto = createDto();
      const incidente = await service.create(dto, ACTOR_USER_ID);
      createdIncidenteIds.push(incidente.id);

      const result = await service.remove(incidente.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const deleted = await prisma.incidentes.findUnique({
        where: { id: incidente.id },
      });
      expect(deleted?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.INCIDENTE_ELIMINADO, incidente.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });
});
