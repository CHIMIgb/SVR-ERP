/**
 * Integration tests for CotizacionesService — real DB, no mocks.
 *
 * Verifies:
 * - crear una cotización escribe el audit correcto en `registro_auditoria` (COTIZACION_CREADA).
 * - el historial de cotizaciones se devuelve ordenado del más reciente al más antiguo.
 *
 * Run with: npm run test:integration -- --testPathPattern="cotizaciones"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, EstadoCotizacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { ClientesService } from './clientes.service';
import { CotizacionesService } from './cotizaciones.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Cotizaciones Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientesService: ClientesService;
  let service: CotizacionesService;

  const createdClienteIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuditContextService,
        AuditService,
        ClientesService,
        CotizacionesService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    clientesService = module.get(ClientesService);
    service = module.get(CotizacionesService);
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdClienteIds.length > 0) {
      // FK-safe: primer las cotizaciones, luego los clientes
      await prisma.cotizaciones.deleteMany({
        where: { cliente_id: { in: createdClienteIds } },
      });
      await prisma.clientes.deleteMany({
        where: { id: { in: createdClienteIds } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  const createCliente = async () => {
    const cliente = await clientesService.create(
      {
        nombre: `Cliente ${TEST_ID}-${randomUUID().slice(0, 4)}`,
        empresa: `Empresa ${TEST_ID}`,
        correo: `${TEST_ID}-${randomUUID().slice(0, 4)}@test.mx`,
        telefono: '55-0000-0000',
      },
      ACTOR_USER_ID,
    );
    createdClienteIds.push(cliente.id);
    return cliente;
  };

  describe('COTIZACION_CREADA', () => {
    it('debe crear cotización y registrar COTIZACION_CREADA en registro_auditoria', async () => {
      const cliente = await createCliente();

      const cotizacion = await service.create(
        cliente.id,
        {
          descripcion: `Cotización test ${TEST_ID}`,
          monto: 125000,
          fecha: '2026-08-20',
        },
        ACTOR_USER_ID,
      );

      expect(cotizacion.clienteId).toBe(cliente.id);
      expect(cotizacion.monto).toBe(125000);
      expect(cotizacion.codigo).toContain('COT-');

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.COTIZACION_CREADA, entity_id: cotizacion.id },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.clienteId).toBe(cliente.id);
      expect(newValue?.monto).toBe(125000);
    });
  });

  describe('HISTORIAL_COTIZACIONES', () => {
    it('debe listar cotizaciones del más reciente al más antiguo', async () => {
      const cliente = await createCliente();

      const antigua = await service.create(
        cliente.id,
        {
          descripcion: 'Cotización antigua',
          monto: 1000,
          fecha: '2026-08-20',
        },
        ACTOR_USER_ID,
      );

      const reciente = await service.create(
        cliente.id,
        {
          descripcion: 'Cotización reciente',
          monto: 2500,
          fecha: '2026-08-25',
        },
        ACTOR_USER_ID,
      );

      const historial = await service.findByCliente(cliente.id, { page: 1, limit: 10 });

      expect(historial).toHaveProperty('items');
      expect(historial.items).toHaveLength(2);
      expect(historial.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });

      // Orden: más reciente primero
      expect(historial.items[0].id).toBe(reciente.id);
      expect(historial.items[1].id).toBe(antigua.id);

      // Estructura serializada
      for (const item of historial.items) {
        expect(item.clienteId).toBe(cliente.id);
        expect(item.codigo).toMatch(/^COT-\d{8}-/);
        expect(typeof item.monto).toBe('number');
        expect(item.estado).toBe('Pendiente');
        expect(item.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('LISTADO_GLOBAL', () => {
    it('debe listar cotizaciones de todos los clientes con datos del cliente', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `Global ${TEST_ID}`, monto: 999, fecha: '2026-08-22' },
        ACTOR_USER_ID,
      );

      const resultado = await service.findAll({ page: 1, limit: 100 });

      const encontrada = resultado.items.find((i) => i.id === cotizacion.id);
      expect(encontrada).toBeDefined();
      expect(encontrada!.clienteId).toBe(cliente.id);
      expect(encontrada!.clienteNombre).toBe(cliente.nombre);
      expect(encontrada!.clienteEmpresa).toBe(cliente.empresa);
    });
  });

  describe('DETALLE_GLOBAL', () => {
    it('debe devolver el detalle de una cotización con su cliente', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `Detalle ${TEST_ID}`, monto: 500, fecha: '2026-08-22' },
        ACTOR_USER_ID,
      );

      const detalle = await service.findOne(cotizacion.id);
      expect(detalle.id).toBe(cotizacion.id);
      expect(detalle.clienteEmpresa).toBe(cliente.empresa);
    });
  });

  describe('COTIZACION_ACTUALIZADA (cambio de estado)', () => {
    it('debe cambiar el estado y registrar COTIZACION_ACTUALIZADA con previous/new estado', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `Estado ${TEST_ID}`, monto: 750, fecha: '2026-08-22' },
        ACTOR_USER_ID,
      );

      const actualizada = await service.cambiarEstado(
        cotizacion.id,
        { estado: EstadoCotizacion.ACEPTADA },
        ACTOR_USER_ID,
      );

      expect(actualizada.estado).toBe('Aceptada');

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.COTIZACION_ACTUALIZADA, entity_id: cotizacion.id },
        orderBy: { timestamp: 'desc' },
      });
      const estadoAudit = audits.find(
        (a) =>
          (a.new_value as Record<string, unknown> | null)?.estado === 'Aceptada',
      );
      expect(estadoAudit).toBeDefined();
      expect((estadoAudit!.previous_value as Record<string, unknown>).estado).toBe('Pendiente');
      expect(estadoAudit!.actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('COTIZACION_ACTUALIZADA (editar cotización)', () => {
    it('debe editar campos y registrar COTIZACION_ACTUALIZADA con previous/new value', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `Editable ${TEST_ID}`, monto: 1000, fecha: '2026-08-22' },
        ACTOR_USER_ID,
      );

      const actualizada = await service.update(
        cotizacion.id,
        { descripcion: `Editada ${TEST_ID}`, monto: 2000, fecha: '2026-08-23' },
        ACTOR_USER_ID,
      );

      expect(actualizada.descripcion).toBe(`Editada ${TEST_ID}`);
      expect(actualizada.monto).toBe(2000);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.COTIZACION_ACTUALIZADA, entity_id: cotizacion.id },
        orderBy: { timestamp: 'desc' },
      });
      const editAudit = audits.find(
        (a) => (a.new_value as Record<string, unknown> | null)?.descripcion === `Editada ${TEST_ID}`,
      );
      expect(editAudit).toBeDefined();
      expect((editAudit!.previous_value as Record<string, unknown>).descripcion).toBe(
        `Editable ${TEST_ID}`,
      );
      expect(editAudit!.result).toBe('SUCCESS');
      expect(editAudit!.actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('STATS_GLOBAL', () => {
    it('debe contar cotizaciones por estado', async () => {
      const stats = await service.findStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pendientes');
      expect(stats).toHaveProperty('aceptadas');
      expect(stats).toHaveProperty('rechazadas');
      expect(stats).toHaveProperty('montoAceptado');
      expect(typeof stats.total).toBe('number');
    });
  });
});
