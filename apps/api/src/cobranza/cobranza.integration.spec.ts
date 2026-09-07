/**
 * Cobranza Audit (Real DB) — integration tests, no mocks.
 *
 * Verifica que cada operación de cobranza escribe el audit correcto en
 * `registro_auditoria` (inmutable) y que el cobro cierra el círculo:
 *   pago (pagos) + CxC (cuentas_por_cobrar) + ingreso (transacciones).
 *
 * Run with: npm run test:integration -- --testPathPattern="cobranza"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { CobranzaService } from './cobranza.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Cobranza Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: CobranzaService;

  let clienteId: string;
  let cuentaId: string;
  let cuentaFacturaId: string | undefined;
  let facturaId: string | undefined;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, CobranzaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(CobranzaService);

    // Cliente de prueba directo (no pasa por ClientesService para aislar el flujo).
    const cliente = await prisma.clientes.create({
      data: {
        id: randomUUID(),
        codigo: `IT-CXC-${TEST_ID}`,
        nombre: `Cliente Integración ${TEST_ID}`,
        empresa: `Empresa IT ${TEST_ID}`,
        correo: `${TEST_ID}@integration.mx`,
        telefono: '55-0000-0000',
        activo: true,
        actualizado_en: new Date(),
      },
    });
    clienteId = cliente.id;
  });

  afterAll(async () => {
    if (!prisma) return;

    const limpiarCuenta = async (id: string) => {
      // FK-safe: transacciones de cobros → pagos → cuenta → cliente.
      const pagos = await prisma.pagos.findMany({
        where: { cuenta_por_cobrar_id: id },
        select: { id: true },
      });
      const pagoIds = pagos.map((p) => p.id);
      await prisma.transacciones.deleteMany({
        where: { entidad_tipo: 'COBRO', entidad_id: { in: pagoIds } },
      });
      await prisma.pagos.deleteMany({
        where: { cuenta_por_cobrar_id: id },
      });
      await prisma.cuentas_por_cobrar.deleteMany({ where: { id } });
    };

    if (cuentaFacturaId) await limpiarCuenta(cuentaFacturaId);
    if (cuentaId) await limpiarCuenta(cuentaId);
    if (facturaId) {
      await prisma.facturas.deleteMany({ where: { id: facturaId } });
    }
    if (clienteId) {
      await prisma.clientes.deleteMany({ where: { id: clienteId } });
    }
    // registro_auditoria es IMMUTABLE — se conserva.

    await prisma.$disconnect();
    await app.close();
  });

  it('debe crear CxC y registrar CXC_CREADA en registro_auditoria', async () => {
    const cuenta = await service.crearCuenta(
      { clienteId, monto: 10000, fechaVencimiento: '2026-11-15' },
      ACTOR_USER_ID,
    );
    cuentaId = cuenta.id;

    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.CXC_CREADA, entity_id: cuentaId },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe(AuditResult.SUCCESS);
  });

  it('debe registrar COBRO_REGISTRADO y crear pago + ingreso en transacciones', async () => {
    const resultado = await service.registrarCobro(
      cuentaId,
      { monto: 4000, metodoPago: 'TRANSFERENCIA', referencia: `IT-${TEST_ID}` },
      ACTOR_USER_ID,
    );

    // 1. Auditoría SUCCESS
    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.COBRO_REGISTRADO, entity_id: resultado.cobro.id },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe(AuditResult.SUCCESS);

    // 2. Pago persistido a la CxC
    const pago = await prisma.pagos.findUnique({
      where: { id: resultado.cobro.id },
    });
    expect(pago).not.toBeNull();
    expect(pago!.cuenta_por_cobrar_id).toBe(cuentaId);
    expect(Number(pago!.monto)).toBe(4000);

    // 3. Ingreso en finanzas (cierra el círculo /finanzas)
    const tx = await prisma.transacciones.findFirst({
      where: { entidad_tipo: 'COBRO', entidad_id: pago!.id },
    });
    expect(tx).not.toBeNull();
    expect(tx!.tipo).toBe('INGRESO');
    expect(Number(tx!.monto)).toBe(4000);

    // 4. CxC con saldo parcial
    const cuenta = await prisma.cuentas_por_cobrar.findUnique({
      where: { id: cuentaId },
    });
    expect(Number(cuenta!.monto_pagado)).toBe(4000);
    expect(cuenta!.estado).toBe('PARCIAL');
  });

  it('debe fallar cobro que excede saldo y auditar FAIL COBRO_EXCEDE_SALDO', async () => {
    await expect(
      service.registrarCobro(cuentaId, { monto: 999999, metodoPago: 'EFECTIVO' }, ACTOR_USER_ID),
    ).rejects.toThrow();

    const audit = await prisma.registro_auditoria.findFirst({
      where: {
        action: AuditAction.COBRO_REGISTRADO,
        entity_id: cuentaId,
        result: AuditResult.FAIL,
        error_code: 'COBRO_EXCEDE_SALDO',
      },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
  });

  it('debe saldar la cuenta al liquidar y bloquear la edición (CXC_CON_PAGOS)', async () => {
    await service.registrarCobro(
      cuentaId,
      { monto: 6000, metodoPago: 'CHEQUE', referencia: `IT-SALDA-${TEST_ID}` },
      ACTOR_USER_ID,
    );

    const cuenta = await prisma.cuentas_por_cobrar.findUnique({
      where: { id: cuentaId },
    });
    // Legado BD: PAGADO = saldado (el API expone 'SALDADO' a la UI).
    expect(Number(cuenta!.monto_pagado)).toBe(10000);
    expect(cuenta!.estado).toBe('PAGADO');

    await expect(
      service.actualizarCuenta(cuentaId, { monto: 5000 }, ACTOR_USER_ID),
    ).rejects.toThrow();

    const audit = await prisma.registro_auditoria.findFirst({
      where: {
        action: AuditAction.CXC_ACTUALIZADA,
        entity_id: cuentaId,
        result: AuditResult.FAIL,
        error_code: 'CXC_CON_PAGOS',
      },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
  });

  it('salda la factura TIMBRADA a PAGADA al liquidar la CxC ligada', async () => {
    // Factura TIMBRADA temporal ligada al cliente de integración.
    const factura = await prisma.facturas.create({
      data: {
        id: randomUUID(),
        codigo: `IT-FAC-${TEST_ID}`,
        serie: 'X',
        folio: '000001',
        cliente_id: clienteId,
        subtotal: 1000,
        impuestos: 160,
        total: 1160,
        moneda: 'MXN',
        tipo_cambio: 1,
        forma_pago: 'PAGO_EN_UNA_SOLA_EXHIBICION',
        metodo_pago: 'PPD',
        uso_cfdi: 'G03',
        estado: 'TIMBRADA',
        activo: true,
        actualizado_en: new Date(),
      },
    });
    facturaId = factura.id;

    const cuenta = await service.crearCuenta(
      { clienteId, facturaId: factura.id, monto: 1160, fechaVencimiento: '2026-11-30' },
      ACTOR_USER_ID,
    );
    cuentaFacturaId = cuenta.id;

    await service.registrarCobro(
      cuentaFacturaId!,
      { monto: 1160, metodoPago: 'TRANSFERENCIA', referencia: `IT-PAGO-${TEST_ID}` },
      ACTOR_USER_ID,
    );

    const facturaDb = await prisma.facturas.findUnique({ where: { id: factura.id } });
    expect(facturaDb!.estado).toBe('PAGADA');
  });
});