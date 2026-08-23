/**
 * Integration tests for InventarioService audit logging — real DB, no mocks.
 *
 * These tests verify that every inventory operation writes the correct
 * audit records to `registro_auditoria` in PostgreSQL:
 *   ARTICULO_CREADO, ARTICULO_ACTUALIZADO, ARTICULO_ELIMINADO,
 *   MOVIMIENTO_REGISTRADO, STOCK_BAJO_DETECTADO, STOCK_BAJO_RESUELTO,
 *   STOCK_INSUFICIENTE
 *
 * Run with: npm run test:integration
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventarioService } from './inventario.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Inventario Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: InventarioService;

  // IDs de catálogos de prueba
  let catId: string;
  let provId: string;
  let uniId: string;

  // IDs de artículos creados durante los tests (para limpieza)
  const createdArticuloIds: string[] = [];
  const createdMovimientoIds: string[] = [];

  // ── Setup ──────────────────────────────────────────────────

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditService, InventarioService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(InventarioService);

    // Create test catalog data
    catId = randomUUID();
    provId = randomUUID();
    uniId = randomUUID();

    await prisma.categorias_inventario.create({
      data: { id: catId, nombre: `TestCat-${TEST_ID}`, activo: true, actualizado_en: new Date() },
    });

    await prisma.proveedores.create({
      data: {
        id: provId,
        nombre: `TestProv-${TEST_ID}`,
        activo: true,
        actualizado_en: new Date(),
      },
    });

    await prisma.unidades_medida.create({
      data: { id: uniId, codigo: `T${TEST_ID}`, nombre: `TestUnidad-${TEST_ID}`, activo: true, actualizado_en: new Date() },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    // Cleanup: movimientos → artículos → catálogos de prueba
    // registro_auditoria is IMMUTABLE — leave records

    // Delete ALL movements for test articles (not just tracked ones)
    if (createdArticuloIds.length > 0) {
      await prisma.movimientos_inventario.deleteMany({
        where: { articulo_id: { in: createdArticuloIds } },
      });
    }

    if (createdMovimientoIds.length > 0) {
      await prisma.movimientos_inventario.deleteMany({
        where: { id: { in: createdMovimientoIds } },
      }).catch(() => {});
    }

    if (createdArticuloIds.length > 0) {
      await prisma.articulos_inventario.deleteMany({
        where: { id: { in: createdArticuloIds } },
      });
    }

    await prisma.unidades_medida.delete({ where: { id: uniId } }).catch(() => {});
    await prisma.proveedores.delete({ where: { id: provId } }).catch(() => {});
    await prisma.categorias_inventario.delete({ where: { id: catId } }).catch(() => {});

    await prisma.$disconnect();
    await app.close();
  });

  // ── Helpers ────────────────────────────────────────────────

  function createDto(overrides: Record<string, unknown> = {}) {
    return {
      nombre: `Art-${TEST_ID}-${Math.random().toString(36).slice(2, 6)}`,
      codigo: `COD-${TEST_ID}-${Math.random().toString(36).slice(2, 6)}`,
      categoriaId: catId,
      proveedorId: provId,
      unidadId: uniId,
      stock: 20,
      stockMinimo: 5,
      precioUnitario: 1500,
      ...overrides,
    };
  }

  async function findAudits(action: AuditAction, entityId?: string) {
    return prisma.registro_auditoria.findMany({
      where: {
        action,
        ...(entityId ? { entity_id: entityId } : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  // ── Tests ──────────────────────────────────────────────────

  describe('ARTICULO_CREADO', () => {
    it('debe crear artículo y registrar ARTICULO_CREADO en registro_auditoria', async () => {
      const dto = createDto({ stock: 20, stockMinimo: 5 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      const audits = await findAudits('ARTICULO_CREADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);

      const audit = audits[0];
      expect(audit.entity_type).toBe('articulos_inventario');
      expect(audit.entity_id).toBe(articulo.id);
      expect(audit.actor_user_id).toBe(ACTOR_USER_ID);
      expect(audit.actor_type).toBe('USER');
      expect(audit.result).toBe('SUCCESS');
      expect(audit.previous_value).toBeNull();
      expect(audit.new_value).toBeDefined();
    });
  });

  describe('STOCK_BAJO_DETECTADO al crear', () => {
    it('debe registrar STOCK_BAJO_DETECTADO cuando se crea con stock <= stock_minimo', async () => {
      const dto = createDto({ stock: 2, stockMinimo: 5 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      const audits = await findAudits('STOCK_BAJO_DETECTADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].entity_type).toBe('articulos_inventario');
      expect(audits[0].result).toBe('SUCCESS');
    });
  });

  describe('ARTICULO_CREADO — categoría inválida', () => {
    it('debe registrar ARTICULO_CREADO FAIL con CATEGORY_NOT_FOUND', async () => {
      const dto = createDto({ categoriaId: randomUUID() });

      await expect(service.create(dto, ACTOR_USER_ID)).rejects.toThrow();

      const audits = await findAudits('ARTICULO_CREADO');
      const failed = audits.find(
        (a) => a.result === 'FAIL' && a.error_code === 'CATEGORY_NOT_FOUND',
      );
      expect(failed).toBeDefined();
      expect(failed!.actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('ARTICULO_ACTUALIZADO', () => {
    it('debe actualizar y registrar ARTICULO_ACTUALIZADO', async () => {
      const dto = createDto();
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      await service.update(articulo.id, { nombre: 'Nombre Actualizado' }, ACTOR_USER_ID);

      const audits = await findAudits('ARTICULO_ACTUALIZADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
      expect(audits[0].previous_value).toBeDefined();
      expect(audits[0].new_value).toBeDefined();
    });
  });

  describe('STOCK_BAJO_DETECTADO al actualizar', () => {
    it('debe detectar cruce de umbral hacia abajo al reducir stock', async () => {
      const dto = createDto({ stock: 20, stockMinimo: 5 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      // stock=20 → stock=2, que es <= stockMinimo=5
      await service.update(articulo.id, { stock: 2 }, ACTOR_USER_ID);

      const audits = await findAudits('STOCK_BAJO_DETECTADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('STOCK_BAJO_RESUELTO al actualizar', () => {
    it('debe resolver stock bajo al aumentar stock por encima del mínimo', async () => {
      const dto = createDto({ stock: 2, stockMinimo: 5 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      // stock=2 (bajo) → stock=10 (>5), resuelve alerta
      await service.update(articulo.id, { stock: 10 }, ACTOR_USER_ID);

      const audits = await findAudits('STOCK_BAJO_RESUELTO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ARTICULO_ELIMINADO', () => {
    it('debe soft-delete y registrar ARTICULO_ELIMINADO', async () => {
      const dto = createDto();
      const articulo = await service.create(dto, ACTOR_USER_ID);
      // No push to createdArticuloIds — it's been soft-deleted

      await service.remove(articulo.id, ACTOR_USER_ID);

      const audits = await findAudits('ARTICULO_ELIMINADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].previous_value).toBeDefined();
    });
  });

  describe('MOVIMIENTO_REGISTRADO — ENTRADA', () => {
    it('debe registrar movimiento ENTRADA y guardar auditoría', async () => {
      const dto = createDto({ stock: 10 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      await service.crearMovimiento(
        { articuloId: articulo.id, tipo: 'ENTRADA', cantidad: 5 },
        ACTOR_USER_ID,
      );

      const audits = await findAudits('MOVIMIENTO_REGISTRADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');

      // Verify the movement was saved
      const movs = await prisma.movimientos_inventario.findMany({
        where: { articulo_id: articulo.id },
      });
      expect(movs).toHaveLength(1);
      expect(movs[0].tipo).toBe('ENTRADA');
      expect(Number(movs[0].stock_resultante)).toBe(15);
      createdMovimientoIds.push(movs[0].id);
    });
  });

  describe('MOVIMIENTO_REGISTRADO — SALIDA', () => {
    it('debe registrar movimiento SALIDA y guardar auditoría', async () => {
      const dto = createDto({ stock: 20 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      await service.crearMovimiento(
        { articuloId: articulo.id, tipo: 'SALIDA', cantidad: 3 },
        ACTOR_USER_ID,
      );

      const audits = await findAudits('MOVIMIENTO_REGISTRADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);

      const movs = await prisma.movimientos_inventario.findMany({
        where: { articulo_id: articulo.id },
      });
      expect(movs).toHaveLength(1);
      expect(movs[0].tipo).toBe('SALIDA');
      expect(Number(movs[0].stock_resultante)).toBe(17);
      createdMovimientoIds.push(movs[0].id);
    });
  });

  describe('STOCK_BAJO_DETECTADO por SALIDA', () => {
    it('debe detectar stock bajo cuando una SALIDA cruza el umbral', async () => {
      const dto = createDto({ stock: 10, stockMinimo: 5 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      // stock=10 → SALIDA de 8 → stock=2 ≤ 5
      await service.crearMovimiento(
        { articuloId: articulo.id, tipo: 'SALIDA', cantidad: 8 },
        ACTOR_USER_ID,
      );

      const audits = await findAudits('STOCK_BAJO_DETECTADO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('STOCK_BAJO_RESUELTO por ENTRADA', () => {
    it('debe resolver stock bajo cuando una ENTRADA supera el umbral', async () => {
      const dto = createDto({ stock: 2, stockMinimo: 5 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      // stock=2 (bajo) → ENTRADA de 5 → stock=7 > 5
      await service.crearMovimiento(
        { articuloId: articulo.id, tipo: 'ENTRADA', cantidad: 5 },
        ACTOR_USER_ID,
      );

      const audits = await findAudits('STOCK_BAJO_RESUELTO', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('STOCK_INSUFICIENTE', () => {
    it('debe registrar STOCK_INSUFICIENTE cuando SALIDA excede stock', async () => {
      const dto = createDto({ stock: 3 });
      const articulo = await service.create(dto, ACTOR_USER_ID);
      createdArticuloIds.push(articulo.id);

      await expect(
        service.crearMovimiento(
          { articuloId: articulo.id, tipo: 'SALIDA', cantidad: 50 },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow();

      const audits = await findAudits('STOCK_INSUFICIENTE', articulo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('FAIL');
      expect(audits[0].error_code).toBe('INSUFFICIENT_STOCK');
    });
  });
});
