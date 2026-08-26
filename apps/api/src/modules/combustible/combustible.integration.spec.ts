/**
 * Integration tests for CombustibleService audit logging — real DB, no mocks.
 *
 * Verifica que cada operación CRUD escribe el audit correcto en
 * `registro_auditoria`: COMBUSTIBLE_CARGADO, COMBUSTIBLE_ACTUALIZADO,
 * COMBUSTIBLE_ELIMINADO, y que el fallo de negocio (máquina inexistente)
 * queda auditado como FAIL antes de lanzar la excepción.
 *
 * Run with: npm run test:integration -- --testPathPattern="combustible"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditContextService } from '../../audit/audit-context.service';
import { CombustibleService } from './combustible.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Combustible Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: CombustibleService;

  let tipoMaquinaId: string;
  let maquinaId: string;
  const maquinaCodigo = `CB-${TEST_ID}`;
  const createdCargaIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, CombustibleService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(CombustibleService);

    tipoMaquinaId = randomUUID();
    maquinaId = randomUUID();
    const now = new Date();

    await prisma.tipos_maquina.create({
      data: { id: tipoMaquinaId, nombre: `TestTipo-${TEST_ID}`, activo: true, actualizado_en: now },
    });

    await prisma.maquinas.create({
      data: {
        id: maquinaId,
        codigo: maquinaCodigo,
        nombre: `TestMaquina-${TEST_ID}`,
        tipo_id: tipoMaquinaId,
        estado: 'APAGADA',
        lat: 0,
        lng: 0,
        horometro: 1000,
        consumo_esperado_lts_hora: 14,
        activo: true,
        actualizado_en: now,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdCargaIds.length > 0) {
      await prisma.cargas_combustible.deleteMany({ where: { id: { in: createdCargaIds } } });
    }
    await prisma.maquinas.deleteMany({ where: { id: maquinaId } });
    await prisma.tipos_maquina.deleteMany({ where: { id: tipoMaquinaId } });

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    maquinaId: maquinaCodigo,
    litros: 112,
    horasTrabajadasPeriodo: 8,
    lugar: `Gasolinera test ${TEST_ID}`,
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({ where: { action, entity_id: entityId }, orderBy: { timestamp: 'desc' } });

  describe('COMBUSTIBLE_CARGADO', () => {
    it('debe crear la carga y auditar SUCCESS con actor real', async () => {
      const dto = createDto();
      const carga = await service.create(dto, ACTOR_USER_ID);
      createdCargaIds.push(carga.id);

      expect(carga.rendimientoLtsHora).toBe(14);
      expect(carga.alertaOrdena).toBe(false);

      const audits = await findAudits(AuditAction.COMBUSTIBLE_CARGADO, carga.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.lugar).toBe(dto.lugar);
    });

    it('debe auditar FAIL sin crear la carga cuando la máquina no existe', async () => {
      const dto = createDto({ maquinaId: 'NO-EXISTE-999' });
      await expect(service.create(dto, ACTOR_USER_ID)).rejects.toThrow(NotFoundException);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.COMBUSTIBLE_CARGADO, error_code: 'MAQUINA_NO_ENCONTRADA' },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });
      expect(audits.length).toBe(1);
      expect(audits[0].result).toBe('FAIL');
    });
  });

  describe('COMBUSTIBLE_ACTUALIZADO', () => {
    it('debe actualizar, recalcular rendimiento y auditar con previous/new value', async () => {
      const carga = await service.create(createDto(), ACTOR_USER_ID);
      createdCargaIds.push(carga.id);

      const actualizada = await service.update(carga.id, { litros: 200 }, ACTOR_USER_ID);
      expect(actualizada.rendimientoLtsHora).toBe(25);
      expect(actualizada.alertaOrdena).toBe(true);

      const audits = await findAudits(AuditAction.COMBUSTIBLE_ACTUALIZADO, carga.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.litros).toBe(112);
    });
  });

  describe('COMBUSTIBLE_ELIMINADO', () => {
    it('debe soft-delete y auditar', async () => {
      const carga = await service.create(createDto(), ACTOR_USER_ID);
      createdCargaIds.push(carga.id);

      const result = await service.remove(carga.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminada');

      const eliminada = await prisma.cargas_combustible.findUnique({ where: { id: carga.id } });
      expect(eliminada?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.COMBUSTIBLE_ELIMINADO, carga.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });
});
