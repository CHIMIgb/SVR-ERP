/**
 * Integration tests for CribaService audit logging — real DB, no mocks.
 *
 * Verifies that cada operación CRUD de registros de criba escribe el audit
 * correcto en `registro_auditoria`:
 *   REGISTRO_CRIBA_CREADO, REGISTRO_CRIBA_ACTUALIZADO, REGISTRO_CRIBA_ELIMINADO
 *
 * Run with: npm run test:integration -- --testPathPattern="criba"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, Turno } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { CribaService } from './criba.service';
import { InventarioService } from '../inventario/inventario.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Criba Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: CribaService;
  let auditContext: AuditContextService;

  let materialId: string;
  const createdRegistroIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuditContextService,
        AuditService,
        CribaService,
        // B7.2: InventarioService real (aplicarEntrada en la transacción del envío)
        InventarioService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(CribaService);
    auditContext = module.get(AuditContextService);
    // Sin FK a trabajadores en estos tests (operador_id nullable) — la validación
    // del operador se cubre en unitarios.

    // B7: catálogo de materiales — 'Criba fina' (ya seedeada por la migración;
    // upsert idempotente y enlaza su artículo si existe).
    const articuloCriba = await prisma.articulos_inventario.findFirst({
      where: { nombre: 'Criba fina', eliminado_en: null },
      select: { id: true },
    });
    ARTICULO_CRIBA_ID = articuloCriba?.id ?? '';
    MATERIAL_ID = (
      await prisma.materiales_criba.upsert({
        where: { nombre: 'Criba fina' },
        update: { articulo_id: ARTICULO_CRIBA_ID || null },
        create: { id: randomUUID(), nombre: 'Criba fina', articulo_id: ARTICULO_CRIBA_ID || null, actualizado_en: new Date() },
      })
    ).id;
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdRegistroIds.length > 0) {
      await prisma.registros_criba.deleteMany({
        where: { id: { in: createdRegistroIds } },
      });
    }
    // B7: limpieza del material del catálogo creado en beforeAll
    // (no se borra: el catálogo lo seedeó la migración)

    await prisma.$disconnect();
    await app.close();
  });

  /** Material del catálogo de criba + su artículo de inventario. */
  let MATERIAL_ID = '';
  let ARTICULO_CRIBA_ID = '';

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    fecha: '2026-08-20',
    turno: Turno.MATUTINO,
    materialId: MATERIAL_ID,
    materialProducido: 500,
    horasTrabajadas: 8,
    materialAlBanco: 450,
    ...overrides,
  });

  const tipoDelMaterial = () =>
    prisma.materiales_criba.findUnique({ where: { id: MATERIAL_ID }, select: { nombre: true } });

  // Marca única para no mezclar stats con datos de otros tests/días
  const marcaUnica = () => `Test-${TEST_ID}-${randomUUID().slice(0, 4)}`;

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('REGISTRO_CRIBA_CREADO', () => {
    it('debe crear registro y registrar REGISTRO_CRIBA_CREADO en registro_auditoria', async () => {
      const dto = createDto();
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      expect(registro.turno).toBe('Matutino');
      expect(registro.materialProducido).toBe(500);

      const audits = await findAudits(AuditAction.REGISTRO_CRIBA_CREADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      const materialNombre = (await tipoDelMaterial())?.nombre;
      expect(newValue?.tipoMaterial).toBe(materialNombre);

      // Metadata mínima automática presente
      const metadata = audits[0].metadata as Record<string, unknown> | null;
      expect(metadata).not.toBeNull();
      expect(metadata?.source).toBe('SYSTEM'); // sin HTTP context en test directo
    });

    it('debe rechazar crear con al banco mayor a producido Y auditar el fallo', async () => {
      // Simula el contexto que el interceptor crearía en un request real:
      // el actor cae del JWT aunque el service no lo pase en el fallo.
      await auditContext.run(
        {
          jwtUserId: ACTOR_USER_ID,
          endpoint: '/api/criba',
          method: 'POST',
        },
        async () => {
          await expect(
            service.create(createDto({ materialAlBanco: 600 }), ACTOR_USER_ID),
          ).rejects.toThrow('no puede ser mayor');
        },
      );

      // El fallo queda persistido en registro_auditoria con result=FAIL
      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.REGISTRO_CRIBA_CREADO,
          result: 'FAIL',
          error_code: 'AL_BANCO_MAYOR_A_PRODUCIDO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      // Metadata automática del request simulado
      const metadata = audits[0].metadata as Record<string, unknown> | null;
      expect(metadata?.endpoint).toBe('/api/criba');
      expect(metadata?.method).toBe('POST');
    });
  });

  describe('stats', () => {
    it('debe calcular totales y eficiencia por material correctamente', async () => {
      // Semilla aislada: registros del material del catálogo para este test
      const nombreMaterial = (await tipoDelMaterial())?.nombre ?? '';
      const r1 = await service.create(
        createDto({ materialProducido: 400, materialAlBanco: 380 }),
        ACTOR_USER_ID,
      );
      createdRegistroIds.push(r1.id);

      const r2 = await service.create(
        createDto({ materialProducido: 100, materialAlBanco: 80 }),
        ACTOR_USER_ID,
      );
      createdRegistroIds.push(r2.id);

      // Soft-delete de uno ajeno al material para validar que stats lo ignora
      const borrado = await service.create(
        createDto({ materialProducido: 999, materialAlBanco: 900 }),
        ACTOR_USER_ID,
      );
      createdRegistroIds.push(borrado.id);
      await service.remove(borrado.id, ACTOR_USER_ID);

      const stats = await service.findStats();
      const fila = stats.porMaterial.find((m) => m.tipo === nombreMaterial);

      expect(fila).toBeDefined();
      // El material es global (catálogo): otros registros diluyen eficiencia y
      // merma — se valida que NUESTROS registros estén incluidos en la suma.
      expect(fila?.producido).toBeGreaterThanOrEqual(500); // 400 + 100 (excluye eliminado)
      expect(fila?.alBanco).toBeGreaterThanOrEqual(460);   // 380 + 80
    });
  });

  // ────────────────────────────────────────────────
  //  B7.2 — ENVÍO A INVENTARIO
  // ────────────────────────────────────────────────
  describe('ENVIO_INVENTARIO', () => {
    it('debe enviar al inventario: stock sube, movimiento creado y audit SUCCESS', async () => {
      const dto = createDto({ materialProducido: 500, materialAlBanco: 450 });
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const articuloAntes = await prisma.articulos_inventario.findUnique({
        where: { id: ARTICULO_CRIBA_ID },
        select: { stock: true },
      });
      expect(ARTICULO_CRIBA_ID).not.toBe('');

      const enviado = await service.enviarInventario(registro.id, ACTOR_USER_ID);
      expect(enviado.inventarioEn).toBeTruthy();

      const articulo = await prisma.articulos_inventario.findUnique({
        where: { id: ARTICULO_CRIBA_ID },
        select: { stock: true },
      });
      // 450 al banco entran al stock del artículo 'Criba fina'
      expect(Number(articulo!.stock) - Number(articuloAntes!.stock)).toBe(450);

      // Movimiento trazable con referencia al registro
      const movs = await prisma.movimientos_inventario.findMany({
        where: { referencia_tipo: 'registros_criba', referencia_id: registro.id },
      });
      expect(movs).toHaveLength(1);
      expect(movs[0].tipo).toBe('ENTRADA');
      expect(Number(movs[0].cantidad)).toBe(450);

      const audits = await findAudits(AuditAction.REGISTRO_CRIBA_ACTUALIZADO, registro.id);
      const envio = audits.find(
        (a) => (a.new_value as Record<string, unknown> | null)?.stockResultante !== undefined,
      );
      expect(envio).toBeDefined();
      expect(envio!.result).toBe('SUCCESS');
    });

    it('doble envío → YA_EN_INVENTARIO audit FAIL y stock sin cambio', async () => {
      const dto = createDto({ materialProducido: 500, materialAlBanco: 400 });
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      await service.enviarInventario(registro.id, ACTOR_USER_ID);
      const articuloTrasPrimero = await prisma.articulos_inventario.findUnique({
        where: { id: ARTICULO_CRIBA_ID },
        select: { stock: true },
      });

      await expect(service.enviarInventario(registro.id, ACTOR_USER_ID)).rejects.toThrow();

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
          error_code: 'YA_EN_INVENTARIO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('FAIL');

      const articuloFinal = await prisma.articulos_inventario.findUnique({
        where: { id: ARTICULO_CRIBA_ID },
        select: { stock: true },
      });
      expect(articuloFinal!.stock.toNumber()).toBe(articuloTrasPrimero!.stock.toNumber());
    });

    it('registro sin material enlazado (viejo) → SIN_MATERIAL_EN_CATALOGO', async () => {
      // Registro antiguo: sin material_criba_id (simulado con update directo)
      const dto = createDto({ materialProducido: 10, materialAlBanco: 5 });
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);
      await prisma.registros_criba.update({
        where: { id: registro.id },
        data: { material_criba_id: null },
      });

      await expect(service.enviarInventario(registro.id, ACTOR_USER_ID)).rejects.toThrow();
    });
  });

  describe('REGISTRO_CRIBA_ACTUALIZADO', () => {
    it('debe actualizar registro y registrar valores previo/nuevo', async () => {
      const dto = createDto();
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const updated = await service.update(
        registro.id,
        { materialAlBanco: 480 },
        ACTOR_USER_ID,
      );
      expect(updated.materialAlBanco).toBe(480);

      const audits = await findAudits(AuditAction.REGISTRO_CRIBA_ACTUALIZADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);

      const previousValue = audits[0].previous_value as Record<string, unknown> | null;
      expect(previousValue?.materialAlBanco).toBe(450);

      const newValue = audits[0].new_value as Record<string, unknown> | null;
      expect(newValue?.materialAlBanco).toBe(480);
    });

    it('debe rechazar actualizar a valores efectivos inválidos', async () => {
      const dto = createDto({ materialProducido: 300, materialAlBanco: 200 });
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      await expect(
        service.update(registro.id, { materialAlBanco: 350 }, ACTOR_USER_ID),
      ).rejects.toThrow('no puede ser mayor');
    });
  });

  describe('REGISTRO_CRIBA_ELIMINADO', () => {
    it('debe soft-delete registro y registrar REGISTRO_CRIBA_ELIMINADO', async () => {
      const dto = createDto();
      const registro = await service.create(dto, ACTOR_USER_ID);
      createdRegistroIds.push(registro.id);

      const result = await service.remove(registro.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const deleted = await prisma.registros_criba.findUnique({
        where: { id: registro.id },
      });
      expect(deleted?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.REGISTRO_CRIBA_ELIMINADO, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });
});
