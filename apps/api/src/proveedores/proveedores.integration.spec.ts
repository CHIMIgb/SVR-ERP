/**
 * Integration tests for ProveedoresService audit logging — real DB, no mocks.
 *
 * Verifies que las operaciones del módulo proveedores escriben el audit
 * correcto en `registro_auditoria`:
 *   PROVEEDOR_CREADO, ORDEN_COMPRA_CREADA, PAGO_PROVEEDOR_REGISTRADO
 *
 * Run with: npm run test:integration -- --testPathPattern="proveedores"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { ProveedoresService } from './proveedores.service';
import { InventarioService } from '../inventario/inventario.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Proveedores Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ProveedoresService;

  const createdProveedorIds: string[] = [];
  const createdOrdenIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuditContextService,
        AuditService,
        InventarioService,
        ProveedoresService,
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(ProveedoresService);
  });

  afterAll(async () => {
    if (!prisma) return;

    // Cleanup FK-safe: transacciones → pagos → CxP → OC → proveedores.
    // registro_auditoria es INMUTABLE (DB trigger) — se dejan los registros.
    if (createdProveedorIds.length > 0) {
      await prisma.transacciones.deleteMany({
        where: { entidad_id: { in: createdProveedorIds } },
      });
    }
    if (createdOrdenIds.length > 0) {
      await prisma.ordenes_compra_items.deleteMany({
        where: { orden_compra_id: { in: createdOrdenIds } },
      });
      await prisma.pagos_proveedor.deleteMany({
        where: { orden_compra_id: { in: createdOrdenIds } },
      });
      await prisma.cuentas_por_pagar.deleteMany({
        where: { orden_compra_id: { in: createdOrdenIds } },
      });
      await prisma.ordenes_compra.deleteMany({
        where: { id: { in: createdOrdenIds } },
      });
    }
    if (createdProveedorIds.length > 0) {
      await prisma.proveedores.deleteMany({
        where: { id: { in: createdProveedorIds } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('PROVEEDOR_CREADO', () => {
    it('debe crear proveedor y registrar PROVEEDOR_CREADO en registro_auditoria', async () => {
      const dto = {
        nombre: `Proveedor ${TEST_ID}-${randomUUID().slice(0, 4)}`,
        categoria: 'Materiales',
      };
      const proveedor = await service.create(dto, ACTOR_USER_ID);
      createdProveedorIds.push(proveedor.id);

      expect(proveedor.nombre).toBe(dto.nombre);

      const audits = await findAudits(AuditAction.PROVEEDOR_CREADO, proveedor.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.nombre).toBe(dto.nombre);
    });
  });

  describe('ORDEN_COMPRA_CREADA', () => {
    it('debe crear OC + CxP y registrar ORDEN_COMPRA_CREADA SUCCESS', async () => {
      const proveedor = await service.create(
        { nombre: `Prov-OC ${TEST_ID}-${randomUUID().slice(0, 4)}` },
        ACTOR_USER_ID,
      );
      createdProveedorIds.push(proveedor.id);

      const orden = await service.createOrden(
        {
          proveedorId: proveedor.id,
          descripcion: `Compra test ${TEST_ID}`,
          items: [
            {
              nombre: 'Cemento Sílice Fino',
              cantidad: 12,
              precioUnitario: 100.041666,
            },
          ],
        },
        ACTOR_USER_ID,
      );
      createdOrdenIds.push(orden.id);

      expect(orden.folio).toMatch(/^OC-\d{4}-\d{3}$/);
      expect(orden.monto).toBe(1200.5);

      // CxP 1:1 con la OC creada atomáticamente.
      const cxp = await prisma.cuentas_por_pagar.findUnique({
        where: { orden_compra_id: orden.id },
      });
      expect(cxp).not.toBeNull();
      expect(Number(cxp!.monto)).toBe(1200.5);
      expect(cxp!.estado).toBe('PENDIENTE');

      const audits = await findAudits(AuditAction.ORDEN_COMPRA_CREADA, orden.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });

    // B4.2: la CxP nace con el vencimiento de la OC.
    it('debe crear OC con vencimiento y propagarlo a la CxP en BD', async () => {
      const proveedor = await service.create(
        { nombre: `Prov-VENC ${TEST_ID}-${randomUUID().slice(0, 4)}` },
        ACTOR_USER_ID,
      );
      createdProveedorIds.push(proveedor.id);

      const orden = await service.createOrden(
        {
          proveedorId: proveedor.id,
          items: [{ nombre: 'Pintura vinílica', cantidad: 5, precioUnitario: 200 }],
          fechaVencimiento: '2026-12-31',
        },
        ACTOR_USER_ID,
      );
      createdOrdenIds.push(orden.id);

      expect(orden.fechaVencimiento).toBe('2026-12-31');

      const fila = await prisma.ordenes_compra.findUnique({
        where: { id: orden.id },
        select: { fecha_vencimiento: true },
      });
      expect(fila?.fecha_vencimiento?.toISOString().startsWith('2026-12-31')).toBe(true);

      const cxp = await prisma.cuentas_por_pagar.findUnique({
        where: { orden_compra_id: orden.id },
      });
      expect(cxp?.fecha_vencimiento?.toISOString().startsWith('2026-12-31')).toBe(true);

      // Propagación en la actualización (CxP abierta).
      const actualizada = await service.updateOrden(orden.id, { fechaVencimiento: '2027-01-15' }, ACTOR_USER_ID);
      expect(actualizada.fechaVencimiento).toBe('2027-01-15');
      const cxp2 = await prisma.cuentas_por_pagar.findUnique({
        where: { orden_compra_id: orden.id },
      });
      expect(cxp2?.fecha_vencimiento?.toISOString().startsWith('2027-01-15')).toBe(true);
    });
  });

  describe('PAGO_PROVEEDOR_REGISTRADO', () => {
    it('debe registrar abono con pago, transaccion EGRESO y auditar SUCCESS', async () => {
      const proveedor = await service.create(
        { nombre: `Prov-PAG ${TEST_ID}-${randomUUID().slice(0, 4)}` },
        ACTOR_USER_ID,
      );
      createdProveedorIds.push(proveedor.id);

      const orden = await service.createOrden(
        {
          proveedorId: proveedor.id,
          descripcion: `Pago test ${TEST_ID}`,
          items: [
            {
              nombre: 'Cemento Pago',
              cantidad: 50,
              precioUnitario: 100,
            },
          ],
        },
        ACTOR_USER_ID,
      );
      createdOrdenIds.push(orden.id);

      // La máquina de estados exige APROBADA antes de poder abonar.
      const aprobada = await service.cambiarEstadoOrden(
        orden.id,
        { estado: 'APROBADA' },
        ACTOR_USER_ID,
      );
      expect(aprobada.estado).toBe('APROBADA');

      const resultado = await service.registrarAbono(
        proveedor.id,
        { ordenCompraId: orden.id, monto: 2000, metodoPago: 'TRANSFERENCIA' },
        ACTOR_USER_ID,
      );

      expect(resultado.abono.codigo).toMatch(/^PAG-PROV-\d{4}-\d{3}$/);
      expect(resultado.abono.monto).toBe(2000);

      // Pago persistido.
      const pago = await prisma.pagos_proveedor.findUnique({
        where: { id: resultado.abono.id },
      });
      expect(pago).not.toBeNull();
      expect(Number(pago!.monto)).toBe(2000);

      // OC y CxP actualizadas.
      const ordenDb = await prisma.ordenes_compra.findUnique({
        where: { id: orden.id },
      });
      expect(Number(ordenDb!.pagado)).toBe(2000);
      const cxp = await prisma.cuentas_por_pagar.findUnique({
        where: { orden_compra_id: orden.id },
      });
      expect(Number(cxp!.monto_pagado)).toBe(2000);
      expect(cxp!.estado).toBe('PARCIAL');

      // Transacción EGRESO para finanzas.
      const tx = await prisma.transacciones.findFirst({
        where: { entidad_id: proveedor.id, entidad_tipo: 'PROVEEDOR' },
      });
      expect(tx).not.toBeNull();
      expect(tx!.tipo).toBe('EGRESO');
      expect(Number(tx!.monto)).toBe(2000);

      // Auditoría.
      const audits = await findAudits(AuditAction.PAGO_PROVEEDOR_REGISTRADO, resultado.abono.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });

    it('debe rechazar abono que excede el monto con auditoria FAIL', async () => {
      const proveedor = await service.create(
        { nombre: `Prov-FAIL ${TEST_ID}-${randomUUID().slice(0, 4)}` },
        ACTOR_USER_ID,
      );
      createdProveedorIds.push(proveedor.id);

      const orden = await service.createOrden(
        {
          proveedorId: proveedor.id,
          descripcion: `Fail test ${TEST_ID}`,
          items: [
            {
              nombre: `Ítem fail test ${TEST_ID}`,
              cantidad: 1,
              precioUnitario: 1000,
            },
          ],
        },
        ACTOR_USER_ID,
      );
      createdOrdenIds.push(orden.id);

      await expect(
        service.registrarAbono(
          proveedor.id,
          { ordenCompraId: orden.id, monto: 5000 },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow();

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.PAGO_PROVEEDOR_REGISTRADO,
          error_code: 'ABONO_EXCEDE_MONTO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('FAIL');
    });

    it('debe rechazar abono completo sobre PENDIENTE y permitirlo tras aprobar (Blocker #PR11)', async () => {
      const proveedor = await service.create(
        { nombre: `Prov-BLK5 ${TEST_ID}-${randomUUID().slice(0, 4)}` },
        ACTOR_USER_ID,
      );
      createdProveedorIds.push(proveedor.id);

      const orden = await service.createOrden(
        {
          proveedorId: proveedor.id,
          descripcion: `Blocker test ${TEST_ID}`,
          items: [
            {
              nombre: `Item Blocker ${TEST_ID}`,
              cantidad: 1,
              precioUnitario: 3000,
            },
          ],
        },
        ACTOR_USER_ID,
      );
      createdOrdenIds.push(orden.id);
      expect(orden.estado).toBe('PENDIENTE');

      // 1) Abono completo sobre PENDIENTE → rechazado (salto ilegal a RECIBIDA).
      await expect(
        service.registrarAbono(
          proveedor.id,
          { ordenCompraId: orden.id, monto: 3000, metodoPago: 'TRANSFERENCIA' },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow(ConflictException);

      const failAudits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.PAGO_PROVEEDOR_REGISTRADO,
          error_code: 'ORDEN_PENDIENTE_NO_ABONABLE',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(failAudits[0]?.result).toBe('FAIL');

      // La orden sigue PENDIENTE y sin pagos: la transacción no persistió nada.
      const intacta = await prisma.ordenes_compra.findUnique({ where: { id: orden.id } });
      expect(intacta?.estado).toBe('PENDIENTE');
      expect(Number(intacta?.pagado)).toBe(0);
      const pagos = await prisma.pagos_proveedor.count({ where: { orden_compra_id: orden.id } });
      expect(pagos).toBe(0);

      // 2) Tras aprobar, el abono completo sí lleva la orden a RECIBIDA.
      await service.cambiarEstadoOrden(orden.id, { estado: 'APROBADA' }, ACTOR_USER_ID);
      const resultado = await service.registrarAbono(
        proveedor.id,
        { ordenCompraId: orden.id, monto: 3000, metodoPago: 'TRANSFERENCIA' },
        ACTOR_USER_ID,
      );
      expect(resultado.orden.estado).toBe('RECIBIDA');

      const okAudits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.PAGO_PROVEEDOR_REGISTRADO, entity_id: resultado.abono.id },
        orderBy: { timestamp: 'desc' },
      });
      expect(okAudits[0]?.result).toBe('SUCCESS');
    });
  });

  describe('UNICIDAD', () => {
    it('debe rechazar RFC duplicado con ConflictException y auditoria FAIL', async () => {
      const rfc = `RFC${TEST_ID}${randomUUID().slice(0, 4).toUpperCase()}`;
      const dto = { nombre: `Prov-RFC ${TEST_ID}`, categoria: 'Materiales', rfc };

      const primero = await service.create(dto, ACTOR_USER_ID);
      createdProveedorIds.push(primero.id);

      // Segundo proveedor con el mismo RFC → rechazado en DB real.
      await expect(
        service.create({ ...dto, nombre: `Prov-RFC2 ${TEST_ID}` }, ACTOR_USER_ID),
      ).rejects.toThrow(ConflictException);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.PROVEEDOR_CREADO, error_code: 'PROVEEDOR_RFC_DUPLICADO' },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('FAIL');
    });
  });

  describe('RECIBIR OC — aplica al inventario en BD real (ORDEN_COMPRA_RECIBIDA)', () => {
    it('recibe una OC Aprobada: stock real sube, líneas marcadas y audita SUCCESS', async () => {
      // arrange: proveedor + OC aprobada con línea sobre artículo real
      const proveedor = await prisma.proveedores.create({
        data: {
          id: randomUUID(),
          nombre: `Prov-Recepcion ${TEST_ID}`,
          categoria: 'Materiales',
          correo: `recepcion-${TEST_ID}@test.local`,
          telefono: '555-0000',
          actualizado_en: new Date(),
          creado_por: ACTOR_USER_ID,
          actualizado_por: ACTOR_USER_ID,
        },
      });
      createdProveedorIds.push(proveedor.id);

      const articulo = await prisma.articulos_inventario.findFirst({
        where: { eliminado_en: null },
      });
      expect(articulo).not.toBeNull();

      const orden = await prisma.ordenes_compra.create({
        data: {
          id: randomUUID(),
          folio: `OC-INT-${TEST_ID}`,
          proveedor_id: proveedor.id,
          descripcion: 'Recepción con inventario',
          monto: 400,
          fecha: new Date(),
          estado: 'PENDIENTE',
          actualizado_en: new Date(),
          creado_por: ACTOR_USER_ID,
          ordenes_compra_items: {
            create: {
              id: randomUUID(),
              nombre: articulo!.nombre,
              cantidad: 6,
              precio_unitario: articulo!.precio_unitario,
              articulo_id: articulo!.id,
              actualizado_en: new Date(),
              creado_por: ACTOR_USER_ID,
            },
          },
        },
        include: { ordenes_compra_items: true },
      });
      createdOrdenIds.push(orden.id);

      // aprobar primero
      await service.cambiarEstadoOrden(orden.id, { estado: 'APROBADA' }, ACTOR_USER_ID);

      // act: recibir (aplica al inventario)
      await service.recibirOrden(orden.id, {}, ACTOR_USER_ID);

      // assert: estado RECIBIDA y línea marcada con cantidad real
      const ordenRow = await prisma.ordenes_compra.findUnique({ where: { id: orden.id } });
      expect(ordenRow?.estado).toBe('RECIBIDA');
      const itemRow = await prisma.ordenes_compra_items.findFirst({ where: { orden_compra_id: orden.id } });
      expect(Number(itemRow!.cantidad_recibida)).toBe(6);

      // auditoría real
      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.ORDEN_COMPRA_RECIBIDA, entity_id: orden.id },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits[0]?.result).toBe('SUCCESS');
      const newValue = audits[0]?.new_value as Record<string, unknown> | null;
      expect(newValue?.folio).toBe(`OC-INT-${TEST_ID}`);
    });

    it('rechaza recibir una OC ya recibida con RECEPCION_YA_APLICADA (auditoria FAIL real)', async () => {
      // arrange: OC aprobada → recibir una vez
      const proveedor = await prisma.proveedores.create({
        data: {
          id: randomUUID(),
          nombre: `Prov-Recepcion2 ${TEST_ID}`,
          categoria: 'Materiales',
          correo: `recepcion2-${TEST_ID}@test.local`,
          telefono: '555-0001',
          actualizado_en: new Date(),
          creado_por: ACTOR_USER_ID,
          actualizado_por: ACTOR_USER_ID,
        },
      });
      createdProveedorIds.push(proveedor.id);

      const articulo = await prisma.articulos_inventario.findFirst({ where: { eliminado_en: null } });
      const orden = await prisma.ordenes_compra.create({
        data: {
          id: randomUUID(),
          folio: `OC-INT2-${TEST_ID}`,
          proveedor_id: proveedor.id,
          descripcion: 'Doble recepción',
          monto: 200,
          fecha: new Date(),
          estado: 'PENDIENTE',
          actualizado_en: new Date(),
          creado_por: ACTOR_USER_ID,
          ordenes_compra_items: {
            create: {
              id: randomUUID(),
              nombre: articulo!.nombre,
              cantidad: 2,
              precio_unitario: articulo!.precio_unitario,
              articulo_id: articulo!.id,
              actualizado_en: new Date(),
              creado_por: ACTOR_USER_ID,
            },
          },
        },
      });
      createdOrdenIds.push(orden.id);
      await service.cambiarEstadoOrden(orden.id, { estado: 'APROBADA' }, ACTOR_USER_ID);
      await service.recibirOrden(orden.id, {}, ACTOR_USER_ID);

      // act: segunda recepción → rechazo
      await expect(service.recibirOrden(orden.id, {}, ACTOR_USER_ID)).rejects.toThrow(ConflictException);

      // assert: auditoría FAIL real con error_code
      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.ORDEN_COMPRA_RECIBIDA,
          entity_id: orden.id,
          result: 'FAIL',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits[0]?.result).toBe('FAIL');
      expect(audits[0]?.error_code).not.toBeNull();
    });
  });
});