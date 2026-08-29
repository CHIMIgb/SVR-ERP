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
import { VentasService } from './ventas.service';

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
