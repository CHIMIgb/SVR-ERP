/**
 * Integration tests for ProyectosService audit logging — real DB, no mocks.
 *
 * Verifies that cada operación CRUD de proyectos escribe el audit correcto
 * en `registro_auditoria`:
 *   PROYECTO_CREADO, PROYECTO_ACTUALIZADO, PROYECTO_ELIMINADO
 *
 * Run with: npm run test:integration -- --testPathPattern="proyectos"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, EstadoProyecto } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { ProyectosService } from './proyectos.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Proyectos Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ProyectosService;

  let clienteId: string;
  const createdProyectoIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, ProyectosService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(ProyectosService);

    // Cliente de prueba
    clienteId = randomUUID();
    await prisma.clientes.create({
      data: {
        id: clienteId,
        nombre: `TestCliente-${TEST_ID}`,
        empresa: `Empresa-${TEST_ID}`,
        correo: `cliente-${TEST_ID}@test.local`,
        telefono: '555-0000',
        actualizado_en: new Date(),
        creado_por: ACTOR_USER_ID,
        actualizado_por: ACTOR_USER_ID,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    // Cleanup: proyectos → cliente (FK-safe)
    if (createdProyectoIds.length > 0) {
      await prisma.proyectos.deleteMany({
        where: { id: { in: createdProyectoIds } },
      });
    }
    await prisma.clientes.deleteMany({ where: { id: clienteId } });

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    nombre: `Proyecto test ${TEST_ID}`,
    clienteId,
    presupuesto: 500000,
    fechaInicio: '2026-01-10',
    fechaFin: '2026-12-15',
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('PROYECTO_CREADO', () => {
    it('debe crear proyecto y registrar PROYECTO_CREADO en registro_auditoria', async () => {
      const dto = createDto();
      const proyecto = await service.create(dto, ACTOR_USER_ID);
      createdProyectoIds.push(proyecto.id);

      const audits = await findAudits(AuditAction.PROYECTO_CREADO, proyecto.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue).not.toBeNull();
      expect(newValue?.nombre).toBe(dto.nombre);
    });

    it('debe persistir los campos financieros iniciales', async () => {
      const dto = createDto({ ingresoCobrado: 150000, gastado: 80000 });
      const proyecto = await service.create(dto, ACTOR_USER_ID);
      createdProyectoIds.push(proyecto.id);

      expect(proyecto.ingresoCobrado).toBe(150000);
      expect(proyecto.gastado).toBe(80000);

      const row = await prisma.proyectos.findUnique({ where: { id: proyecto.id } });
      expect(Number(row?.ingreso_cobrado)).toBe(150000);
      expect(Number(row?.gastado)).toBe(80000);
    });
  });

  describe('PROYECTO_ACTUALIZADO', () => {
    it('debe actualizar proyecto y registrar PROYECTO_ACTUALIZADO', async () => {
      const dto = createDto();
      const proyecto = await service.create(dto, ACTOR_USER_ID);
      createdProyectoIds.push(proyecto.id);

      const updated = await service.update(
        proyecto.id,
        { progreso: 45, gastado: 220000 },
        ACTOR_USER_ID,
      );
      expect(updated.progreso).toBe(45);
      expect(updated.gastado).toBe(220000);

      const audits = await findAudits(AuditAction.PROYECTO_ACTUALIZADO, proyecto.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.progreso).toBe(0);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.progreso).toBe(45);
    });

    it('debe rechazar actualizar con fechas invertidas', async () => {
      const dto = createDto();
      const proyecto = await service.create(dto, ACTOR_USER_ID);
      createdProyectoIds.push(proyecto.id);

      await expect(
        service.update(proyecto.id, { fechaFin: '2025-01-01' }, ACTOR_USER_ID),
      ).rejects.toThrow('no puede ser anterior');
    });
  });

  describe('PROYECTO_ELIMINADO', () => {
    it('debe soft-delete proyecto y registrar PROYECTO_ELIMINADO', async () => {
      const dto = createDto({ estado: EstadoProyecto.EN_PROCESO });
      const proyecto = await service.create(dto, ACTOR_USER_ID);
      createdProyectoIds.push(proyecto.id);

      const result = await service.remove(proyecto.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const deleted = await prisma.proyectos.findUnique({
        where: { id: proyecto.id },
      });
      expect(deleted?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.PROYECTO_ELIMINADO, proyecto.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('PROYECTO_FINANZAS_ACTUALIZADO', () => {
    it('debe actualizar finanzas y registrar valores previo/nuevo en registro_auditoria', async () => {
      const dto = createDto({ ingresoCobrado: 100000, gastado: 50000 });
      const proyecto = await service.create(dto, ACTOR_USER_ID);
      createdProyectoIds.push(proyecto.id);

      await service.actualizarFinanzas(
        proyecto.id,
        { ingresoCobrado: 250000, gastado: 180000 },
        ACTOR_USER_ID,
      );

      // Persistencia real
      const row = await prisma.proyectos.findUnique({ where: { id: proyecto.id } });
      expect(Number(row?.ingreso_cobrado)).toBe(250000);
      expect(Number(row?.gastado)).toBe(180000);

      // Auditoría con transición de valores
      const audits = await findAudits(AuditAction.PROYECTO_FINANZAS_ACTUALIZADO, proyecto.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.ingresoCobrado).toBe(100000);
      expect(previousValue?.gastado).toBe(50000);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.ingresoCobrado).toBe(250000);
      expect(newValue?.gastado).toBe(180000);
    });

    it('debe rechazar actualización sin ningún campo financiero', async () => {
      const dto = createDto();
      const proyecto = await service.create(dto, ACTOR_USER_ID);
      createdProyectoIds.push(proyecto.id);

      await expect(
        service.actualizarFinanzas(proyecto.id, {}, ACTOR_USER_ID),
      ).rejects.toThrow('al menos un campo');
    });
  });
});
