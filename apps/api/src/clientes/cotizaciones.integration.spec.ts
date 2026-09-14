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
  const createdFacturaIds: string[] = [];

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

    // FK-safe: conceptos de factura → CxC → facturas → cotizaciones → clientes.
    for (const facturaId of createdFacturaIds) {
      await prisma.factura_conceptos.deleteMany({ where: { factura_id: facturaId } });
      await prisma.cuentas_por_cobrar.deleteMany({ where: { factura_id: facturaId } });
      await prisma.facturas.deleteMany({ where: { id: facturaId } });
    }
    if (createdClienteIds.length > 0) {
      // primer las cotizaciones, luego los clientes
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

    it('debe rechazar con motivo y persistirlo en la BD y en el audit', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `Rechazo ${TEST_ID}`, monto: 600, fecha: '2026-08-22' },
        ACTOR_USER_ID,
      );

      const actualizada = await service.cambiarEstado(
        cotizacion.id,
        { estado: EstadoCotizacion.RECHAZADA, motivoRechazo: 'Presupuesto fuera de rango' },
        ACTOR_USER_ID,
      );

      expect(actualizada.estado).toBe('Rechazada');
      expect(actualizada.motivoRechazo).toBe('Presupuesto fuera de rango');

      // El motivo queda persistido en la fila de la BD.
      const fila = await prisma.cotizaciones.findUnique({ where: { id: cotizacion.id } });
      expect(fila?.motivo_rechazo).toBe('Presupuesto fuera de rango');

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.COTIZACION_ACTUALIZADA, entity_id: cotizacion.id },
        orderBy: { timestamp: 'desc' },
      });
      const rechazoAudit = audits.find(
        (a) => (a.new_value as Record<string, unknown> | null)?.estado === 'Rechazada',
      );
      expect(rechazoAudit).toBeDefined();
      expect((rechazoAudit!.new_value as Record<string, unknown>).motivoRechazo).toBe(
        'Presupuesto fuera de rango',
      );
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

  describe('FACTURAR', () => {
    it('debe facturar cotización y crear factura + CxC + audits', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `A facturar ${TEST_ID}`, monto: 75000, fecha: '2026-08-26' },
        ACTOR_USER_ID,
      );

      const resultado = await service.facturar(cotizacion.id, ACTOR_USER_ID);

      // 1. Factura creada y ligada a la cotización
      expect(resultado.factura.codigo).toMatch(/^FAC-\d{4}-\d{4}$/);
      createdFacturaIds.push(resultado.factura.id);

      const factura = await prisma.facturas.findUnique({
        where: { id: resultado.factura.id },
        include: { factura_conceptos: true, cuentas_por_cobrar: true },
      });
      expect(factura).not.toBeNull();
      expect(factura!.cotizacion_id).toBe(cotizacion.id);
      expect(factura!.cliente_id).toBe(cliente.id);
      expect(Number(factura!.total)).toBe(87000);
      expect(Number(factura!.impuestos)).toBe(12000);
      expect(factura!.estado).toBe('PENDIENTE');
      expect(factura!.factura_conceptos).toHaveLength(1);
      expect(factura!.factura_conceptos[0].descripcion).toBe(`A facturar ${TEST_ID}`);
      // Desglose de IVA consistente (tasa 16% con importe acorde, no 0).
      expect(Number(factura!.factura_conceptos[0].impuesto_tasa)).toBe(0.16);
      expect(Number(factura!.factura_conceptos[0].impuesto_importe)).toBe(12000);

      // 2. CxC creada por el total (con IVA) con vencimiento +30 días
      const cxc = factura!.cuentas_por_cobrar;
      expect(cxc).not.toBeNull();
      expect(Number(cxc!.monto)).toBe(87000);
      expect(Number(cxc!.monto_pagado)).toBe(0);
      expect(cxc!.estado).toBe('PENDIENTE');
      const vencimientoEsperado = new Date();
      vencimientoEsperado.setDate(vencimientoEsperado.getDate() + 30);
      expect(cxc!.fecha_vencimiento!.toISOString().split('T')[0]).toBe(
        vencimientoEsperado.toISOString().split('T')[0],
      );

      // 3. Cotización quedó ACEPTADA
      const cotizacionBd = await prisma.cotizaciones.findUnique({
        where: { id: cotizacion.id },
      });
      expect(cotizacionBd!.estado).toBe(EstadoCotizacion.ACEPTADA);

      // 4. Audit COTIZACION_FACTURADA SUCCESS
      const audit = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.COTIZACION_FACTURADA, entity_id: cotizacion.id },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.result).toBe('SUCCESS');
      const newValue = audit!.new_value as Record<string, unknown> | null;
      expect(newValue?.facturaId).toBe(resultado.factura.id);
    });

    it('debe fallar COTIZACION_NO_PENDIENTE y auditar FAIL', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `No facturable ${TEST_ID}`, monto: 1000, fecha: '2026-08-26' },
        ACTOR_USER_ID,
      );
      await service.cambiarEstado(
        cotizacion.id,
        { estado: EstadoCotizacion.RECHAZADA, motivoRechazo: 'Prueba integración' },
        ACTOR_USER_ID,
      );

      await expect(service.facturar(cotizacion.id, ACTOR_USER_ID)).rejects.toThrow();

      const audit = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.COTIZACION_FACTURADA,
          entity_id: cotizacion.id,
          result: 'FAIL',
          error_code: 'COTIZACION_NO_PENDIENTE',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
    });

    it('debe facturar UNA sola vez ante doble llamada concurrente y auditar FAIL al perdedor', async () => {
      const cliente = await createCliente();
      const cotizacion = await service.create(
        cliente.id,
        { descripcion: `Carrera doble ${TEST_ID}`, monto: 50000, fecha: '2026-08-26' },
        ACTOR_USER_ID,
      );

      const resultados = await Promise.allSettled([
        service.facturar(cotizacion.id, ACTOR_USER_ID),
        service.facturar(cotizacion.id, ACTOR_USER_ID),
      ]);

      const ganadores = resultados.filter((r) => r.status === 'fulfilled');
      const perdedores = resultados.filter((r) => r.status === 'rejected');
      expect(ganadores).toHaveLength(1);
      expect(perdedores).toHaveLength(1);

      // Una sola factura y una sola CxC para la cotización.
      const facturas = await prisma.facturas.findMany({
        where: { cotizacion_id: cotizacion.id },
      });
      expect(facturas).toHaveLength(1);
      createdFacturaIds.push(facturas[0].id);

      const cxcCount = await prisma.cuentas_por_cobrar.count({
        where: { factura_id: facturas[0].id },
      });
      expect(cxcCount).toBe(1);

      // El perdedor audita FAIL. El código depende del timing: si la lectura
      // previa alcanzó a ver el commit del ganador → NO_PENDIENTE (pre-check);
      // si ambas entraron a la transacción → YA_FACTURADA (guard transicional).
      // Lo invariante: exactamente un FAIL para la misma cotización.
      const audit = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.COTIZACION_FACTURADA,
          entity_id: cotizacion.id,
          result: 'FAIL',
          error_code: { in: ['COTIZACION_YA_FACTURADA', 'COTIZACION_NO_PENDIENTE'] },
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
    });

    it('debe asignar folios únicos al facturar cotizaciones distintas en paralelo', async () => {
      const cliente = await createCliente();
      const c1 = await service.create(
        cliente.id,
        { descripcion: `Folio A ${TEST_ID}`, monto: 10000, fecha: '2026-08-26' },
        ACTOR_USER_ID,
      );
      const c2 = await service.create(
        cliente.id,
        { descripcion: `Folio B ${TEST_ID}`, monto: 20000, fecha: '2026-08-26' },
        ACTOR_USER_ID,
      );

      const resultados = await Promise.allSettled([
        service.facturar(c1.id, ACTOR_USER_ID),
        service.facturar(c2.id, ACTOR_USER_ID),
      ]);

      const ganadores = resultados.filter((r) => r.status === 'fulfilled') as Array<
        PromiseFulfilledResult<{ factura: { codigo: string } }>
      >;
      expect(ganadores).toHaveLength(2);

      const codigos = ganadores.map((r) => r.value.factura.codigo);
      expect(new Set(codigos).size).toBe(2);
      codigos.forEach((codigo) => expect(codigo).toMatch(/^FAC-\d{4}-\d{4}$/));

      const facturas = await prisma.facturas.findMany({
        where: { cotizacion_id: { in: [c1.id, c2.id] } },
      });
      expect(facturas).toHaveLength(2);
      facturas.forEach((f) => createdFacturaIds.push(f.id));
    });
  });
});
