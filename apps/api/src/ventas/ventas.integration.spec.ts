/**
 * Integration tests for VentasService — real DB, no mocks.
 *
 * Verifies que crear venta, retiro y cierre persisten datos correctos y
 * dejan registros de auditoría en `registro_auditoria`.
 *
 * Run with: npm run test:integration -- --testPathPattern="ventas"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, MetodoPago } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { VentasService, clearConfigCache } from './ventas.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Ventas Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: VentasService;
  let auditContext: AuditContextService;

  let materialId: string;
  let precioId: string;
  const createdVentaIds: string[] = [];
  const createdRetiroIds: string[] = [];
  const createdCierreIds: string[] = [];
  const createdAperturaIds: string[] = [];

  // Dependencias del artículo de prueba (aisladas con UUIDs únicos)
  let catId: string;
  let provId: string;
  let uniId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, VentasService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(VentasService);
    auditContext = module.get(AuditContextService);

    // Dependencias del catálogo (categoría/proveedor/unidad de prueba)
    catId = randomUUID();
    provId = randomUUID();
    uniId = randomUUID();
    await prisma.categorias_inventario.create({
      data: {
        id: catId,
        nombre: `Cat_${TEST_ID}`,
        activo: true,
        actualizado_en: new Date(),
      },
    });
    await prisma.proveedores.create({
      data: {
        id: provId,
        codigo: `PROV-${TEST_ID}`,
        nombre: `Prov_${TEST_ID}`,
        activo: true,
        actualizado_en: new Date(),
      },
    });
    await prisma.unidades_medida.create({
      data: {
        id: uniId,
        codigo: `U${TEST_ID}`,
        nombre: 'm³',
        activo: true,
        actualizado_en: new Date(),
      },
    });

    // Artículo de prueba con una medida/precio
    materialId = randomUUID();
    precioId = randomUUID();
    await prisma.articulos_inventario.create({
      data: {
        id: materialId,
        codigo: `SKU-${TEST_ID}`,
        nombre: `Material de prueba ${TEST_ID}`,
        stock: 100,
        stock_minimo: 5,
        precio_unitario: 350,
        activo: true,
        actualizado_en: new Date(),
        categoria_id: catId,
        proveedor_id: provId,
        unidad_id: uniId,
        articulos_precio: {
          create: {
            id: precioId,
            medida: 'm³',
            precio: 350,
          },
        },
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    // Limpieza en orden FK-safe (auditoría es inmutable, no se borra)
    if (createdVentaIds.length > 0) {
      await prisma.ventas_pagos.deleteMany({
        where: { venta_id: { in: createdVentaIds } },
      });
      await prisma.ventas_items.deleteMany({
        where: { venta_id: { in: createdVentaIds } },
      });
      await prisma.ventas.deleteMany({
        where: { id: { in: createdVentaIds } },
      });
    }
    if (createdRetiroIds.length > 0) {
      await prisma.retiros_caja.deleteMany({
        where: { id: { in: createdRetiroIds } },
      });
    }
    if (createdCierreIds.length > 0) {
      await prisma.cierres_caja.deleteMany({
        where: { id: { in: createdCierreIds } },
      });
    }
    if (createdAperturaIds.length > 0) {
      await prisma.aperturas_caja.deleteMany({
        where: { id: { in: createdAperturaIds } },
      });
    }

    // Catálogo de prueba (artículo → precios → dependencias)
    await prisma.articulos_precio.deleteMany({ where: { articulo_id: materialId } });
    await prisma.articulos_inventario.deleteMany({ where: { id: materialId } });
    await prisma.unidades_medida.deleteMany({ where: { id: uniId } });
    await prisma.proveedores.deleteMany({ where: { id: provId } });
    await prisma.categorias_inventario.deleteMany({ where: { id: catId } });

    await prisma.$disconnect();
    await app.close();
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('VENTA_CREADA', () => {
    it('debe crear venta, descontar stock y auditar SUCCESS', async () => {
      const dto = {
        cajero: 'Cajero Test',
        cliente: 'Cliente Test',
        terminal: 'TER-01',
        caja: 'CAJA-PV',
        items: [{ materialId, medida: 'm³', cantidad: 2, precioUnitario: 350 }],
        pagos: [{ metodo: 'efectivo' as const, monto: 700 }],
        metodo: 'efectivo' as const,
        efectivoRecibido: 800,
        cambio: 100,
      };

      const venta = await service.create(dto, ACTOR_USER_ID);
      createdVentaIds.push(venta.id);

      expect(venta.total).toBe(700);
      expect(venta.method).toBe('efectivo');
      expect(venta.items).toHaveLength(1);

      const material = await prisma.articulos_inventario.findUnique({
        where: { id: materialId },
      });
      expect(Number(material?.stock)).toBe(98);

      const audits = await findAudits(AuditAction.VENTA_CREADA, venta.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.folio).toBe(venta.folio);
    });

    it('debe rechazar venta con medida inexistente y auditar FAIL', async () => {
      await auditContext.run(
        {
          jwtUserId: ACTOR_USER_ID,
          endpoint: '/api/ventas',
          method: 'POST',
        },
        async () => {
          const dto = {
            cajero: 'Cajero Test',
            items: [{ materialId, medida: 'tonelada', cantidad: 1, precioUnitario: 520 }],
            pagos: [{ metodo: 'efectivo' as const, monto: 520 }],
            metodo: 'efectivo' as const,
          };
          await expect(service.create(dto, ACTOR_USER_ID)).rejects.toThrow('no está disponible');
        },
      );

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.VENTA_CREADA,
          result: 'FAIL',
          error_code: 'MEDIDA_NO_DISPONIBLE',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });

    it('debe rechazar venta con total de pagos no cuadrado y auditar FAIL', async () => {
      await auditContext.run(
        {
          jwtUserId: ACTOR_USER_ID,
          endpoint: '/api/ventas',
          method: 'POST',
        },
        async () => {
          const dto = {
            cajero: 'Cajero Test',
            items: [{ materialId, medida: 'm³', cantidad: 1, precioUnitario: 350 }],
            pagos: [{ metodo: 'efectivo' as const, monto: 300 }],
            metodo: 'efectivo' as const,
          };
          await expect(service.create(dto, ACTOR_USER_ID)).rejects.toThrow('no coincide');
        },
      );

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.VENTA_CREADA,
          result: 'FAIL',
          error_code: 'TOTAL_PAGOS_NO_CUADRA',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('RETIRO_REGISTRADO', () => {
    it('debe crear retiro y auditar SUCCESS', async () => {
      const dto = { concepto: 'Gasolina test', monto: 250, autorizadoPor: 'Jefe' };
      const retiro = await service.createRetiro(dto, ACTOR_USER_ID, 'Cajero Test');
      createdRetiroIds.push(retiro.id);

      expect(retiro.monto).toBe(250);

      const audits = await findAudits(AuditAction.RETIRO_REGISTRADO, retiro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('CIERRE_CAJA_REGISTRADO', () => {
    it('debe crear cierre y auditar SUCCESS', async () => {
      // `createCierre` solo permite cerrar dentro de la ventana horaria real
      // (turno diurno 08:00-18:00 => cierra de 18:00 a 08:00). Para que el test
      // sea determinista a cualquier hora, forzamos un turno CONTINUO en la
      // config (apertura === cierre en 00:00) donde permiteCerrarCaja() es siempre
      // true, y restauramos la config original al terminar.
      const original = await prisma.configuracion_sistema.findMany({
        where: { clave: { in: ['turno_apertura', 'turno_cierre'] } },
      });
      const originalMap = new Map(original.map((c) => [c.clave, c.valor]));

      // Protección: no puede existir ya un cierre con la fecha de hoy (unique)
      const hoy = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
      const existente = await prisma.cierres_caja.findUnique({ where: { fecha: hoy } });
      if (existente) {
        await prisma.cierres_caja.delete({ where: { id: existente.id } });
      }

      try {
        for (const clave of ['turno_apertura', 'turno_cierre']) {
          await prisma.configuracion_sistema.upsert({
            where: { clave },
            create: { clave, valor: '00:00', categoria: 'turno' },
            update: { valor: '00:00' },
          });
        }
        // Invalidar el caché de config para que createCierre relea la BD
        clearConfigCache();

        const dto = {
          efectivoInicial: 500,
          denominaciones: { '1000': 1, '500': 1 } as Record<string, number>,
          fondoSiguiente: 200,
          notas: 'Cierre de prueba',
        };

        const cierre = await service.createCierre(dto, ACTOR_USER_ID, 'Cajero Test');
        createdCierreIds.push(cierre.id);

        expect(cierre.contado).toBe(1500);
        expect(typeof cierre.diferencia).toBe('number');

        const audits = await findAudits(AuditAction.CIERRE_CAJA_REGISTRADO, cierre.id);
        expect(audits.length).toBeGreaterThanOrEqual(1);
        expect(audits[0].result).toBe('SUCCESS');
        expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
      } finally {
        // Invalidar caché para que el próximo acceso relea la config restaurada
        clearConfigCache();
        // Restaurar config original
        for (const [clave, valor] of originalMap) {
          await prisma.configuracion_sistema.update({ where: { clave }, data: { valor } });
        }
        for (const clave of ['turno_apertura', 'turno_cierre']) {
          if (!originalMap.has(clave)) {
            await prisma.configuracion_sistema.deleteMany({ where: { clave } });
          }
        }
        clearConfigCache();
      }
    });
  });

  describe('CIERRE_CAJA_APROBADO', () => {
    it('debe aprobar un cierre pendiente, cambiarlo a APROBADO y auditar SUCCESS', async () => {
      // Cierre PENDIENTE con fecha única (ayer) para aislar el test
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 1);
      const cierre = await prisma.cierres_caja.create({
        data: {
          id: randomUUID(),
          fecha: new Date(fecha.toISOString().split('T')[0] + 'T00:00:00Z'),
          cajero: 'Cajero Test',
          ventas_count: 0,
          total_ventas: 0,
          efectivo_inicial: 500,
          ventas_efectivo: 0,
          total_retiros: 0,
          esperado: 500,
          contado: 500,
          diferencia: 0,
          fondo_siguiente: 200,
          notas: 'Para aprobar',
          denominaciones: {},
          estado: 'PENDIENTE',
          actualizado_en: new Date(),
        },
      });
      createdCierreIds.push(cierre.id);

      const aprobado = await service.aprobarCierre(cierre.id, ACTOR_USER_ID);
      expect(aprobado.estado).toBe('APROBADO');

      const audits = await findAudits(AuditAction.CIERRE_CAJA_APROBADO, cierre.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.estado).toBe('APROBADO');
    });

    it('debe rechazar aprobación de un cierre ya aprobado y auditar FAIL', async () => {
      const actualizado = await prisma.cierres_caja.findFirst({
        where: { estado: 'APROBADO', actualizado_en: { gte: new Date(Date.now() - 60000) } },
        orderBy: { actualizado_en: 'desc' },
      });
      if (!actualizado) return;

      await auditContext.run(
        {
          jwtUserId: ACTOR_USER_ID,
          endpoint: '/api/ventas/cierres/:id/aprobar',
          method: 'PATCH',
        },
        async () => {
          await expect(service.aprobarCierre(actualizado.id, ACTOR_USER_ID)).rejects.toThrow(
            'ya fue aprobado',
          );
        },
      );

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.CIERRE_CAJA_APROBADO,
          entity_id: actualizado.id,
          result: 'FAIL',
          error_code: 'CIERRE_YA_RESUELTO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CIERRE_CAJA_RECHAZADO', () => {
    it('debe rechazar un cierre pendiente, cambiarlo a RECHAZADO y auditar SUCCESS', async () => {
      // Cierre PENDIENTE con fecha única (anterior a ayer) para aislar el test
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 2);
      const cierre = await prisma.cierres_caja.create({
        data: {
          id: randomUUID(),
          fecha: new Date(fecha.toISOString().split('T')[0] + 'T00:00:00Z'),
          cajero: 'Cajero Test',
          ventas_count: 0,
          total_ventas: 0,
          efectivo_inicial: 500,
          ventas_efectivo: 0,
          total_retiros: 0,
          esperado: 500,
          contado: 500,
          diferencia: 0,
          fondo_siguiente: 200,
          notas: 'Para rechazar',
          denominaciones: {},
          estado: 'PENDIENTE',
          actualizado_en: new Date(),
        },
      });
      createdCierreIds.push(cierre.id);

      const rechazado = await service.rechazarCierre(
        cierre.id,
        { motivo: 'Faltan comprobantes' },
        ACTOR_USER_ID,
      );
      expect(rechazado.estado).toBe('RECHAZADO');

      const audits = await findAudits(AuditAction.CIERRE_CAJA_RECHAZADO, cierre.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.estado).toBe('RECHAZADO');
      expect(newValue?.motivo).toBe('Faltan comprobantes');
    });
  });

  describe('APERTURA_CAJA_REGISTRADA', () => {
    it('debe crear apertura del turno y auditar SUCCESS', async () => {
      // Si ya existe apertura registrada hoy, la limpiamos para aislar el test
      const hoy = await service.findAperturaHoy();
      if (hoy.existe && hoy.registro) {
        await prisma.aperturas_caja.delete({ where: { id: hoy.registro.id } });
      }

      const apertura = await service.createApertura(
        { fondoInicial: 300 },
        ACTOR_USER_ID,
        'Cajero Test',
      );
      createdAperturaIds.push(apertura.id);

      expect(apertura.fondoInicial).toBe(300);

      const audits = await findAudits(AuditAction.APERTURA_CAJA_REGISTRADA, apertura.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });
});
