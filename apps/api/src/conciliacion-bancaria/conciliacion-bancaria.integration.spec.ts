/**
 * Integration tests for ConciliacionBancariaService — real DB, no mocks.
 *
 * Verifica el círculo completo: banco → cuenta → movimientos (individual y
 * lote CSV con idempotencia) → conciliar contra una transacción real →
 * desconciliar, con auditoría en cada paso.
 *
 * Run with: npm run test:integration -- --testPathPattern="conciliacion-bancaria"
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, TipoTransaccion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { ConciliacionBancariaService } from './conciliacion-bancaria.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('ConciliacionBancaria Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ConciliacionBancariaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditContext: any;

  const createdBancos: string[] = [];
  const createdCuentas: string[] = [];
  const createdMovimientos: string[] = [];
  const createdTransacciones: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, ConciliacionBancariaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(ConciliacionBancariaService);
    auditContext = module.get(AuditContextService);
  });

  afterAll(async () => {
    if (!prisma) return;

    // Orden FK-safe: movimientos → transacciones → cuentas → bancos.
    // registro_auditoria es INMUTABLE — se dejan los registros.
    if (createdTransacciones.length > 0) {
      await prisma.transacciones.deleteMany({
        where: { id: { in: createdTransacciones } },
      });
    }
    if (createdCuentas.length > 0) {
      // Movimientos antes que cuentas (FK RESTRICT). Incluye los del lote, que
      // no se registran por id individual.
      await prisma.movimientos_bancarios.deleteMany({
        where: { cuenta_id: { in: createdCuentas } },
      });
      await prisma.cuentas_bancarias.deleteMany({
        where: { id: { in: createdCuentas } },
      });
    }
    if (createdBancos.length > 0) {
      await prisma.bancos.deleteMany({
        where: { id: { in: createdBancos } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  const findAudits = (action: AuditAction, entityId: string, result?: AuditResult) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId, ...(result ? { result } : {}) },
      orderBy: { timestamp: 'desc' },
    });

  describe('ciclo completo banco → cuenta → movimiento → conciliar', () => {
    it('debe crear banco, cuenta y movimiento auditando cada paso', async () => {
      const banco = await service.crearBanco({ nombre: `Banco Test ${TEST_ID}` }, ACTOR_USER_ID);
      createdBancos.push(banco.id);
      const auditsBanco = await findAudits(AuditAction.BANCO_CREADO, banco.id);
      expect(auditsBanco[0]?.result).toBe('SUCCESS');

      const cuenta = await service.crearCuenta(
        banco.id,
        { numero: `9999${TEST_ID}`, nombre: 'Cuenta Test', saldoInicial: 0 },
        ACTOR_USER_ID,
      );
      createdCuentas.push(cuenta.id);
      const auditsCuenta = await findAudits(AuditAction.CUENTA_BANCARIA_CREADA, cuenta.id);
      expect(auditsCuenta[0]?.result).toBe('SUCCESS');

      const movimiento = await service.crearMovimiento(
        cuenta.id,
        { fecha: '2026-09-01', descripcion: `Depósito test ${TEST_ID}`, deposito: 5000 },
        ACTOR_USER_ID,
      );
      createdMovimientos.push(movimiento.id);
      const auditsMov = await findAudits(AuditAction.MOVIMIENTO_BANCARIO_CREADO, movimiento.id);
      expect(auditsMov[0]?.result).toBe('SUCCESS');
      expect(movimiento).toMatchObject({ deposito: 5000, retiro: null, conciliado: false });

      // El listado lo expone paginado
      const listado = await service.listarMovimientos(cuenta.id, {});
      expect(listado.items.some((m: { id: string }) => m.id === movimiento.id)).toBe(true);
      return { banco, cuenta, movimiento };
    });

    it('debe cargar lote CSV de forma idempotente (re-importación no duplica)', async () => {
      const banco = await service.crearBanco({ nombre: `Banco Lote ${TEST_ID}` }, ACTOR_USER_ID);
      createdBancos.push(banco.id);
      const cuenta = await service.crearCuenta(banco.id, { numero: `8888${TEST_ID}` }, ACTOR_USER_ID);
      createdCuentas.push(cuenta.id);

      const csv = `fecha,descripcion,deposito,retiro
2026-09-01,Depósito lote,1000,
2026-09-02,Retiro lote,,500`;
      const first = await service.cargarLote(cuenta.id, { csv }, ACTOR_USER_ID);
      expect(first).toMatchObject({ totalMovimientos: 2, insertados: 2, duplicados: 0 });

      const second = await service.cargarLote(cuenta.id, { csv }, ACTOR_USER_ID);
      expect(second).toMatchObject({ totalMovimientos: 2, insertados: 0, duplicados: 2 });

      const audits = await findAudits(AuditAction.MOVIMIENTO_BANCARIO_LOTE_CARGADO, cuenta.id);
      expect(audits.length).toBeGreaterThanOrEqual(2);
    });

    it('debe cargar un CSV con separador de miles sin corromper (Blocker #4)', async () => {
      const banco = await service.crearBanco({ nombre: `Banco Miles ${TEST_ID}` }, ACTOR_USER_ID);
      createdBancos.push(banco.id);
      const cuenta = await service.crearCuenta(banco.id, { numero: `5555${TEST_ID}` }, ACTOR_USER_ID);
      createdCuentas.push(cuenta.id);

      // La fila real del banco: 1,234.56 es UN solo monto con separador de miles.
      const csv = '2026-09-01,Pago proveedor,1,234.56\n';
      const result = await service.cargarLote(cuenta.id, { csv }, ACTOR_USER_ID);
      expect(result).toMatchObject({ totalMovimientos: 1, insertados: 1, duplicados: 0 });

      // Nunca se guarda deposito=1 + retiro=234.56 (estado inválido del módulo):
      // el movimiento queda con UN solo monto, conciliable como depósito.
      const mov = await prisma.movimientos_bancarios.findFirst({
        where: { cuenta_id: cuenta.id },
      });
      expect(mov).not.toBeNull();
      expect(Number(mov!.deposito)).toBe(1234.56);
      expect(mov!.retiro).toBeNull();
    });

    it('debe conciliar depósito contra INGRESO real y desconciliar', async () => {
      const banco = await service.crearBanco({ nombre: `Banco Conc ${TEST_ID}` }, ACTOR_USER_ID);
      createdBancos.push(banco.id);
      const cuenta = await service.crearCuenta(banco.id, { numero: `7777${TEST_ID}` }, ACTOR_USER_ID);
      createdCuentas.push(cuenta.id);
      const movimiento = await service.crearMovimiento(
        cuenta.id,
        { fecha: '2026-09-05', descripcion: `Depósito conciliar ${TEST_ID}`, deposito: 15000 },
        ACTOR_USER_ID,
      );
      createdMovimientos.push(movimiento.id);

      const trx = await prisma.transacciones.create({
        data: {
          id: randomUUID(),
          tipo: TipoTransaccion.INGRESO,
          categoria: 'Anticipo de Cliente',
          monto: 15000,
          fecha: new Date('2026-09-05'),
          descripcion: `Anticipo test ${TEST_ID}`,
          activo: true,
          actualizado_en: new Date(),
          creado_por: ACTOR_USER_ID,
        },
      });
      createdTransacciones.push(trx.id);

      const resultado = await service.conciliar(movimiento.id, { transaccionId: trx.id }, ACTOR_USER_ID);
      expect(resultado).toMatchObject({ conciliado: true, monto: 15000 });

      const audits = await findAudits(AuditAction.MOVIMIENTO_CONCILIADO, movimiento.id);
      expect(audits[0]?.result).toBe('SUCCESS');
      expect(audits[0]?.new_value).toMatchObject({ transaccionId: trx.id, monto: 15000 });

      // Doble conciliación (secuencial) → guard de estado
      await expect(service.conciliar(movimiento.id, { transaccionId: trx.id }, ACTOR_USER_ID)).rejects.toThrow(
        ConflictException,
      );
      const failAudits = await findAudits(AuditAction.MOVIMIENTO_CONCILIADO, movimiento.id, 'FAIL');
      expect(failAudits[0]?.error_code).toBe('MOVIMIENTO_YA_CONCILIADO');

      // Desconciliar
      const des = await service.desconciliar(movimiento.id, ACTOR_USER_ID);
      expect(des.conciliado).toBe(false);
      const desAudits = await findAudits(AuditAction.MOVIMIENTO_DESCONCILIADO, movimiento.id);
      expect(desAudits[0]?.result).toBe('SUCCESS');
    });

    it('debe fallar MONTO_NO_COINCIDE con audit FAIL', async () => {
      const banco = await service.crearBanco({ nombre: `Banco Monto ${TEST_ID}` }, ACTOR_USER_ID);
      createdBancos.push(banco.id);
      const cuenta = await service.crearCuenta(banco.id, { numero: `6666${TEST_ID}` }, ACTOR_USER_ID);
      createdCuentas.push(cuenta.id);
      const movimiento = await service.crearMovimiento(
        cuenta.id,
        { fecha: '2026-09-06', descripcion: `Depósito monto ${TEST_ID}`, deposito: 100 },
        ACTOR_USER_ID,
      );
      createdMovimientos.push(movimiento.id);

      const trx = await prisma.transacciones.create({
        data: {
          id: randomUUID(),
          tipo: TipoTransaccion.INGRESO,
          categoria: 'Anticipo de Cliente',
          monto: 999,
          fecha: new Date('2026-09-06'),
          descripcion: `Anticipo monto ${TEST_ID}`,
          activo: true,
          actualizado_en: new Date(),
          creado_por: ACTOR_USER_ID,
        },
      });
      createdTransacciones.push(trx.id);

      await expect(service.conciliar(movimiento.id, { transaccionId: trx.id }, ACTOR_USER_ID)).rejects.toThrow(
        ConflictException,
      );
      const audits = await findAudits(AuditAction.MOVIMIENTO_CONCILIADO, movimiento.id, 'FAIL');
      expect(audits[0]?.error_code).toBe('MONTO_NO_COINCIDE');
    });
  });

  describe('UNICIDAD', () => {
    it('debe rechazar banco duplicado con ConflictException y auditoria FAIL', async () => {
      const nombre = `Banco Único ${TEST_ID}`;
      const primero = await service.crearBanco({ nombre }, ACTOR_USER_ID);
      createdBancos.push(primero.id);

      await expect(service.crearBanco({ nombre }, ACTOR_USER_ID)).rejects.toThrow(ConflictException);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.BANCO_CREADO, error_code: 'BANCO_DUPLICADO' },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('FAIL');
    });

    it('debe ser idempotente bajo carga concurrente (TOCTOU del dedupe)', async () => {
      // Blocker #1 de la review del PR #11: el @@unique con deposito/retiro NULL
      // nunca disparaba; el dedupe app-level era TOCTOU. El índice de expresión
      // con COALESCE + createMany(skipDuplicates) cierra la carrera de forma atómica:
      // dos importaciones simultáneas del mismo CSV jamás duplican filas.
      const banco = await service.crearBanco({ nombre: `Banco TOCTOU ${TEST_ID}` }, ACTOR_USER_ID);
      createdBancos.push(banco.id);
      const cuenta = await service.crearCuenta(banco.id, { numero: `TOCTOU${TEST_ID}` }, ACTOR_USER_ID);
      createdCuentas.push(cuenta.id);

      const csv = `fecha,descripcion,deposito,retiro
2026-09-08,Depósito concurrente,2000,
2026-09-09,Retiro concurrente,,750`;

      const [r1, r2] = await Promise.all([
        service.cargarLote(cuenta.id, { csv }, ACTOR_USER_ID),
        service.cargarLote(cuenta.id, { csv }, ACTOR_USER_ID),
      ]);

      const total = await prisma.movimientos_bancarios.count({ where: { cuenta_id: cuenta.id } });
      expect(total).toBe(2); // nunca 4
      expect(r1.insertados + r2.insertados).toBe(2);
      expect(r1.duplicados + r2.duplicados).toBe(2);
    });
  });
});