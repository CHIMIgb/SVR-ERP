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
import { BadRequestException, ConflictException, INestApplication, NotFoundException } from '@nestjs/common';
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
  // Cliente y dos proyectos propios: la asignación de proyecto se prueba sin depender del seed.
  const clienteId = randomUUID();
  const proyectoA = { id: randomUUID(), nombre: `Proyecto IT A ${TEST_ID}` };
  const proyectoB = { id: randomUUID(), nombre: `Proyecto IT B ${TEST_ID}` };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, TrabajadoresService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(TrabajadoresService);

    await prisma.clientes.create({
      data: {
        id: clienteId,
        codigo: `IT-TRAB-${TEST_ID}`,
        nombre: `Cliente IT Trabajadores ${TEST_ID}`,
        empresa: `Empresa IT ${TEST_ID}`,
        correo: `trab-${TEST_ID}@integration.mx`,
        telefono: '55-0000-0000',
        activo: true,
        actualizado_en: new Date(),
      },
    });
    for (const [i, p] of [proyectoA, proyectoB].entries()) {
      await prisma.proyectos.create({
        data: {
          id: p.id,
          codigo: `IT-TRAB-${TEST_ID}-${i}`,
          nombre: p.nombre,
          cliente_id: clienteId,
          presupuesto: 100000,
          fecha_inicio: new Date('2026-01-01'),
          fecha_fin: new Date('2026-12-31'),
          activo: true,
          actualizado_en: new Date(),
        },
      });
    }
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdTrabajadorIds.length > 0) {
      await prisma.licencias_trabajador.deleteMany({ where: { trabajador_id: { in: createdTrabajadorIds } } });
      await prisma.contactos_emergencia.deleteMany({ where: { trabajador_id: { in: createdTrabajadorIds } } });
      await prisma.trabajadores.deleteMany({ where: { id: { in: createdTrabajadorIds } } });
    }
    await prisma.categorias_puesto.deleteMany({ where: { nombre: `TestCategoria-${TEST_ID}` } });
    // trabajadores_proyectos se va en cascada con los trabajadores.
    await prisma.proyectos.deleteMany({ where: { id: { in: [proyectoA.id, proyectoB.id] } } });
    await prisma.clientes.deleteMany({ where: { id: clienteId } });

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
    fechaContratacion: '2024-03-01',
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

    it('debe guardar el cambio de proyecto: reemplazar, quitar y reactivar sin chocar con la PK', async () => {
      const trabajador = await service.create(createDto({ proyecto: proyectoA.nombre }), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);
      expect(trabajador.proyectos).toEqual([proyectoA.nombre]);

      // A → B: la asignación a A queda borrada (soft-delete), B activa.
      const enB = await service.update(trabajador.id, { proyecto: proyectoB.nombre }, ACTOR_USER_ID);
      expect(enB.proyectos).toEqual([proyectoB.nombre]);

      // Sin proyecto.
      const sinProyecto = await service.update(trabajador.id, { proyecto: '' }, ACTOR_USER_ID);
      expect(sinProyecto.proyectos).toEqual([]);

      // De vuelta a A: la fila (trabajador, A) ya existe borrada y se reactiva (crearla de nuevo violaría la PK).
      const deVueltaEnA = await service.update(trabajador.id, { proyecto: proyectoA.nombre }, ACTOR_USER_ID);
      expect(deVueltaEnA.proyectos).toEqual([proyectoA.nombre]);

      const filas = await prisma.trabajadores_proyectos.findMany({ where: { trabajador_id: trabajador.id } });
      expect(filas).toHaveLength(2);
      expect(filas.find((f) => f.proyecto_id === proyectoA.id)?.eliminado_en).toBeNull();
      expect(filas.find((f) => f.proyecto_id === proyectoB.id)?.eliminado_en).not.toBeNull();
    });

    it('debe rechazar un proyecto inexistente y auditar el fallo', async () => {
      const trabajador = await service.create(createDto(), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);

      await expect(
        service.update(trabajador.id, { proyecto: `No existe ${TEST_ID}` }, ACTOR_USER_ID),
      ).rejects.toThrow(NotFoundException);

      const audits = await findAudits(AuditAction.TRABAJADOR_ACTUALIZADO, trabajador.id);
      expect(audits[0].result).toBe('FAIL');
      expect(audits[0].error_code).toBe('PROYECTO_NO_ENCONTRADO');
    });
  });

  describe('catalogos', () => {
    it('debe incluir los proyectos activos y las máquinas con código', async () => {
      const { maquinas, proyectos } = await service.catalogos();
      expect(proyectos).toEqual(expect.arrayContaining([{ id: proyectoA.id, nombre: proyectoA.nombre }]));
      expect(maquinas.every((m) => typeof m.codigo === 'string' && m.codigo.length > 0)).toBe(true);
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

    it('no debe liquidar sin fecha de ingreso (la antigüedad saldría de una fecha inventada)', async () => {
      const trabajador = await service.create(createDto(), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);
      await prisma.trabajadores.update({ where: { id: trabajador.id }, data: { fecha_contratacion: null } });

      await expect(
        service.liquidar(trabajador.id, { tipoTerminacion: 'Despido', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 0 }, ACTOR_USER_ID),
      ).rejects.toThrow(BadRequestException);

      const sigueActivo = await prisma.trabajadores.findUnique({ where: { id: trabajador.id } });
      expect(sigueActivo?.estado).toBe('ACTIVO');
      const audits = await findAudits(AuditAction.TRABAJADOR_LIQUIDADO, trabajador.id);
      expect(audits[0].error_code).toBe('SIN_FECHA_CONTRATACION');
    });

    it('dos bajas al mismo tiempo: solo una se registra (la otra 409)', async () => {
      const trabajador = await service.create(createDto(), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);
      const dto = { tipoTerminacion: 'Renuncia' as const, diasTrabajadosPeriodo: 2, diasVacacionesPendientes: 0 };

      const resultados = await Promise.allSettled([
        service.liquidar(trabajador.id, dto, ACTOR_USER_ID),
        service.liquidar(trabajador.id, dto, ACTOR_USER_ID),
      ]);

      expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rechazo = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rechazo.reason).toBeInstanceOf(ConflictException);
      const exitos = await prisma.registro_auditoria.count({
        where: { action: AuditAction.TRABAJADOR_LIQUIDADO, entity_id: trabajador.id, result: 'SUCCESS' },
      });
      expect(exitos).toBe(1);
    });

    it('no debe liquidar dos veces al mismo trabajador', async () => {
      const trabajador = await service.create(createDto(), ACTOR_USER_ID);
      createdTrabajadorIds.push(trabajador.id);
      const dto = { tipoTerminacion: 'Renuncia' as const, diasTrabajadosPeriodo: 3, diasVacacionesPendientes: 0 };

      await service.liquidar(trabajador.id, dto, ACTOR_USER_ID);
      await expect(service.liquidar(trabajador.id, dto, ACTOR_USER_ID)).rejects.toThrow(ConflictException);

      const audits = await findAudits(AuditAction.TRABAJADOR_LIQUIDADO, trabajador.id);
      expect(audits.map((a) => a.result)).toEqual(['FAIL', 'SUCCESS']);
      expect(audits[0].error_code).toBe('TRABAJADOR_YA_INACTIVO');
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
