/**
 * Integration tests for TrabajadoresService audit logging — real DB, no mocks.
 *
 * Verifica que cada operación escribe el audit correcto en `registro_auditoria`:
 * TRABAJADOR_CREADO, TRABAJADOR_ACTUALIZADO, TRABAJADOR_ELIMINADO, TRABAJADOR_LIQUIDADO.
 *
 * Run with: npm run test:integration -- --testPathPattern="trabajadores"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { TrabajadoresService } from './trabajadores.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Trabajadores Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: TrabajadoresService;

  const createdTrabajadorIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, TrabajadoresService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(TrabajadoresService);
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdTrabajadorIds.length > 0) {
      await prisma.licencias_trabajador.deleteMany({ where: { trabajador_id: { in: createdTrabajadorIds } } });
      await prisma.contactos_emergencia.deleteMany({ where: { trabajador_id: { in: createdTrabajadorIds } } });
      await prisma.trabajadores.deleteMany({ where: { id: { in: createdTrabajadorIds } } });
    }
    await prisma.categorias_puesto.deleteMany({ where: { nombre: `TestCategoria-${TEST_ID}` } });

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    nombre: `Trabajador Test ${TEST_ID}`,
    puesto: 'Operador de prueba',
    categoriaPuesto: 'Operador' as const,
    telefono: '55 0000 0000',
    entrada: '07:00',
    sueldoFiscal: 2500,
    sueldoEfectivo: 3500,
    metodoPago: 'Mixto' as const,
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({ where: { action, entity_id: entityId }, orderBy: { timestamp: 'desc' } });

  describe('TRABAJADOR_CREADO', () => {
    it('debe crear el trabajador y auditar SUCCESS con actor real', async () => {
      const dto = createDto();
      const trabajador = await service.create(dto, ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);

      const audits = await findAudits(AuditAction.TRABAJADOR_CREADO, trabajador.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.nombre).toBe(dto.nombre);
    });

    it('debe crear con licencia y contacto de emergencia anidados', async () => {
      const trabajador = await service.create(
        createDto({
          nombre: `Trabajador Licencia ${TEST_ID}`,
          licencia: { tipo: 'DC3 Operador', categoria: 'DC3', folio: `FOL-${TEST_ID}` },
          contactoEmergencia: { nombre: 'María López', telefono: '55 1111 2222', parentesco: 'Esposa' },
        }),
        ACTOR_USER_ID,
      );
      createdTrabajadorIds.push(trabajador.id);

      expect(trabajador.licenciaODC3?.folio).toBe(`FOL-${TEST_ID}`);
      expect(trabajador.contactoEmergencia?.nombre).toBe('María López');
    });
  });

  describe('TRABAJADOR_ACTUALIZADO', () => {
    it('debe actualizar y auditar con previous/new value', async () => {
      const trabajador = await service.create(createDto(), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);

      const actualizado = await service.update(trabajador.id, { puesto: 'Operador Senior' }, ACTOR_USER_ID);
      expect(actualizado.puesto).toBe('Operador Senior');

      const audits = await findAudits(AuditAction.TRABAJADOR_ACTUALIZADO, trabajador.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.puesto).toBe('Operador de prueba');
    });
  });

  describe('TRABAJADOR_LIQUIDADO', () => {
    it('debe calcular el finiquito, dar de baja al trabajador y auditar', async () => {
      const trabajador = await service.create(createDto(), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);

      const desglose = await service.liquidar(
        trabajador.id,
        { tipoTerminacion: 'Despido', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 },
        ACTOR_USER_ID,
      );
      expect(desglose.granTotalNeto).toBeGreaterThan(0);

      const actualizado = await prisma.trabajadores.findUnique({ where: { id: trabajador.id } });
      expect(actualizado?.estado).toBe('INACTIVO');

      const audits = await findAudits(AuditAction.TRABAJADOR_LIQUIDADO, trabajador.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });

  describe('TRABAJADOR_ELIMINADO', () => {
    it('debe soft-delete y auditar', async () => {
      const trabajador = await service.create(createDto(), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);

      const result = await service.remove(trabajador.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const eliminado = await prisma.trabajadores.findUnique({ where: { id: trabajador.id } });
      expect(eliminado?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.TRABAJADOR_ELIMINADO, trabajador.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });
});
