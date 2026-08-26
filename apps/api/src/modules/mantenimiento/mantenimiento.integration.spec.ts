/**
 * Integration tests for MantenimientoService audit logging — real DB, no mocks.
 *
 * Verifica que cada operación CRUD escribe el audit correcto en
 * `registro_auditoria`: MANTENIMIENTO_REGISTRADO, MANTENIMIENTO_ACTUALIZADO,
 * MANTENIMIENTO_ELIMINADO, y que los fallos de negocio quedan auditados
 * como FAIL antes de lanzar la excepción.
 *
 * Run with: npm run test:integration -- --testPathPattern="mantenimiento"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditContextService } from '../../audit/audit-context.service';
import { MaquinasService } from '../maquinas/maquinas.service';
import { MantenimientoService } from './mantenimiento.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Mantenimiento Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: MantenimientoService;

  let tipoMaquinaId: string;
  let maquinaId: string;
  const maquinaCodigo = `MT-${TEST_ID}`;
  const createdRegistroIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, MaquinasService, MantenimientoService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(MantenimientoService);

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
        activo: true,
        actualizado_en: now,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdRegistroIds.length > 0) {
      await prisma.registros_mantenimiento.deleteMany({ where: { id: { in: createdRegistroIds } } });
    }
    await prisma.maquinas.deleteMany({ where: { id: maquinaId } });
    await prisma.tipos_maquina.deleteMany({ where: { id: tipoMaquinaId } });

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    maquinaId: maquinaCodigo,
    tipo: 'Preventivo' as const,
    descripcion: `Servicio test ${TEST_ID}`,
    fecha: '2026-08-20',
    horasServicio: 1000,
    costo: 5500,
    proximoServicioHoras: 1250,
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({ where: { action, entity_id: entityId }, orderBy: { timestamp: 'desc' } });

  describe('MANTENIMIENTO_REGISTRADO', () => {
    it('debe crear el registro y auditar SUCCESS con actor real', async () => {
      const dto = createDto();
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const audits = await findAudits(AuditAction.MANTENIMIENTO_REGISTRADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.descripcion).toBe(dto.descripcion);
    });

    it('debe auditar FAIL sin crear el registro cuando proximoServicioHoras es inválido', async () => {
      const dto = createDto({ horasServicio: 1000, proximoServicioHoras: 900 });
      await expect(service.create(dto, ACTOR_USER_ID)).rejects.toThrow(BadRequestException);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.MANTENIMIENTO_REGISTRADO, error_code: 'PROXIMO_SERVICIO_INVALIDO' },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });
      expect(audits.length).toBe(1);
      expect(audits[0].result).toBe('FAIL');
    });

    it('debe auditar FAIL cuando la máquina no existe', async () => {
      const dto = createDto({ maquinaId: 'NO-EXISTE-999' });
      await expect(service.create(dto, ACTOR_USER_ID)).rejects.toThrow(NotFoundException);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.MANTENIMIENTO_REGISTRADO, error_code: 'MAQUINA_NO_ENCONTRADA' },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });
      expect(audits.length).toBe(1);
      expect(audits[0].result).toBe('FAIL');
    });
  });

  describe('MANTENIMIENTO_ACTUALIZADO', () => {
    it('debe actualizar y auditar con previous/new value', async () => {
      const registro = await service.create(createDto(), ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const actualizado = await service.update(registro.id, { costo: 6200 }, ACTOR_USER_ID);
      expect(actualizado.costo).toBe(6200);

      const audits = await findAudits(AuditAction.MANTENIMIENTO_ACTUALIZADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.costo).toBe(5500);
    });
  });

  describe('MANTENIMIENTO_ELIMINADO', () => {
    it('debe soft-delete y auditar', async () => {
      const registro = await service.create(createDto(), ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const result = await service.remove(registro.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const eliminado = await prisma.registros_mantenimiento.findUnique({ where: { id: registro.id } });
      expect(eliminado?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.MANTENIMIENTO_ELIMINADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });
});
