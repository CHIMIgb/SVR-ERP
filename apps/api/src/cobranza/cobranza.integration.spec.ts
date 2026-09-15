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
  let proyectoId: string;
  let cuentaId: string;
  let cuentaFacturaId: string | undefined;
  let facturaId: string | undefined;
  const raceCuentaIds: string[] = [];

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
    for (const id of raceCuentaIds) await limpiarCuenta(id);
    if (facturaId) {
      await prisma.facturas.deleteMany({ where: { id: facturaId } });
    }
    if (proyectoId) {
      await prisma.proyectos.deleteMany({ where: { id: proyectoId } });
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

  it('porProyecto agrupa cuentas con y sin proyecto en la cartera real', async () => {
    const proyecto = await prisma.proyectos.create({
      data: {
        id: randomUUID(),
        codigo: `IT-PRY-${TEST_ID}`,
        nombre: `Proyecto IT ${TEST_ID}`,
        cliente_id: clienteId,
        presupuesto: 100000,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        activo: true,
        actualizado_en: new Date(),
      },
    });
    proyectoId = proyecto.id;

    const conProyecto = await service.crearCuenta(
      { clienteId, proyectoId: proyecto.id, monto: 3000, fechaVencimiento: '2026-12-01' },
      ACTOR_USER_ID,
    );
    const sinProyecto = await service.crearCuenta(
      { clienteId, monto: 2000, fechaVencimiento: '2026-12-02' },
      ACTOR_USER_ID,
    );

    const reporte = await service.porProyecto({});

    const grupoProyecto = reporte.items.find((g) => g.proyecto?.id === proyecto.id);
    expect(grupoProyecto).toBeDefined();
    expect(grupoProyecto!.totalCuentas).toBe(1);
    expect(grupoProyecto!.monto).toBe(3000);
    expect(grupoProyecto!.saldo).toBe(3000);

    const grupoSinProyecto = reporte.items.find((g) => g.proyecto === null);
    expect(grupoSinProyecto).toBeDefined();
    expect(grupoSinProyecto!.totalCuentas).toBeGreaterThanOrEqual(1);
    expect(grupoSinProyecto!.saldo).toBeGreaterThanOrEqual(2000);

    // Cleanup del grupo (auditoría queda, es inmutable).
    await prisma.cuentas_por_cobrar.deleteMany({ where: { id: sinProyecto.id } });
    await prisma.cuentas_por_cobrar.deleteMany({ where: { id: conProyecto.id } });
    await prisma.proyectos.deleteMany({ where: { id: proyecto.id } });
    proyectoId = '';
  });

  it('revierte un cobro: soft-delete del pago, CxC a saldo anterior, INGRESO negativo', async () => {
    // cuentaId quedó PAGADA (10,000) tras los cobros de 4,000 y 6,000.
    const pagoSaldador = await prisma.pagos.findFirst({
      where: { cuenta_por_cobrar_id: cuentaId, monto: 6000 },
    });
    expect(pagoSaldador).not.toBeNull();

    const resultado = await service.revertirCobro(
      cuentaId,
      pagoSaldador!.id,
      ACTOR_USER_ID,
      { motivo: 'Reversión de prueba de integración' },
    );

    // 1. Auditoría SUCCESS COBRO_REVERTIDO
    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.COBRO_REVERTIDO, entity_id: pagoSaldador!.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe(AuditResult.SUCCESS);

    // 2. Pago soft-delete (nunca se borra físicamente)
    const pagoDb = await prisma.pagos.findUnique({ where: { id: pagoSaldador!.id } });
    expect(pagoDb!.activo).toBe(false);
    expect(pagoDb!.eliminado_en).not.toBeNull();

    // 3. CxC vuelve a saldo parcial
    const cuenta = await prisma.cuentas_por_cobrar.findUnique({
      where: { id: cuentaId },
    });
    expect(Number(cuenta!.monto_pagado)).toBe(4000);
    expect(cuenta!.estado).toBe('PARCIAL');

    // 4. Contrapartida contable: EGRESO que revierte el cobro (la BD
    //    exige montos positivos, chk_monto_positivo)
    const tx = await prisma.transacciones.findMany({
      where: { entidad_tipo: 'COBRO', entidad_id: pagoSaldador!.id },
      orderBy: { creado_en: 'asc' },
    });
    expect(tx).toHaveLength(2);
    expect(Number(tx[1].monto)).toBe(6000);
    expect(tx[1].tipo).toBe('EGRESO');
    expect(tx[1].descripcion).toContain('Reversión de cobro');

    // 5. La CxC actualizada también quedó auditada
    const auditCxc = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.CXC_ACTUALIZADA, entity_id: cuentaId },
      orderBy: { timestamp: 'desc' },
    });
    expect(auditCxc).not.toBeNull();
    expect(auditCxc!.result).toBe(AuditResult.SUCCESS);

    expect(resultado.cuenta).toEqual(
      expect.objectContaining({ id: cuentaId, estado: 'PARCIAL', montoPagado: 4000 }),
    );
    expect(resultado.cobroRevertido.motivo).toBe('Reversión de prueba de integración');
  });

  it('falla la segunda reversión del mismo cobro y audita FAIL COBRO_NO_ENCONTRADO', async () => {
    const pagoSaldador = await prisma.pagos.findFirst({
      where: { cuenta_por_cobrar_id: cuentaId, monto: 6000 },
    });

    await expect(
      service.revertirCobro(
        cuentaId,
        pagoSaldador!.id,
        ACTOR_USER_ID,
        { motivo: 'Intento duplicado de reversión' },
      ),
    ).rejects.toThrow();

    const audit = await prisma.registro_auditoria.findFirst({
      where: {
        action: AuditAction.COBRO_REVERTIDO,
        entity_id: pagoSaldador!.id,
        result: AuditResult.FAIL,
        error_code: 'COBRO_NO_ENCONTRADO',
      },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
  });

  it('regresa la factura a TIMBRADA al revertir el cobro que la saldó', async () => {
    const pagoFactura = await prisma.pagos.findFirst({
      where: { cuenta_por_cobrar_id: cuentaFacturaId, monto: 1160 },
    });
    expect(pagoFactura).not.toBeNull();

    await service.revertirCobro(
      cuentaFacturaId!,
      pagoFactura!.id,
      ACTOR_USER_ID,
      { motivo: 'Reversión de pago de factura' },
    );

    const facturaDb = await prisma.facturas.findUnique({ where: { id: facturaId } });
    expect(facturaDb!.estado).toBe('TIMBRADA');

    const cuenta = await prisma.cuentas_por_cobrar.findUnique({
      where: { id: cuentaFacturaId },
    });
    expect(Number(cuenta!.monto_pagado)).toBe(0);
    expect(cuenta!.estado).toBe('PENDIENTE');
  });

  // ────────────────────────────────────────────
  //  CARRERAS (Blocker #2 de PR #11) — el saldo nunca se pierde
  // ────────────────────────────────────────────
  it('no pierde saldo ante 10 cobros concurrentes contra la misma cuenta', async () => {
    const cuenta = await service.crearCuenta(
      { clienteId, monto: 2000, fechaVencimiento: '2026-12-15' },
      ACTOR_USER_ID,
    );
    raceCuentaIds.push(cuenta.id);

    const cobros = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        service.registrarCobro(
          cuenta.id,
          { monto: 100, metodoPago: 'TRANSFERENCIA', referencia: `IT-RAZA-${i}` },
          ACTOR_USER_ID,
        ),
      ),
    );
    expect(cobros).toHaveLength(10);

    // Sin el update condicional atómico, el último write absoluto pisaría al
    // resto (resultado típico: monto_pagado = 100 en vez de 1000).
    const cuentaDb = await prisma.cuentas_por_cobrar.findUnique({
      where: { id: cuenta.id },
    });
    expect(Number(cuentaDb!.monto_pagado)).toBe(1000);

    const pagos = await prisma.pagos.count({
      where: { cuenta_por_cobrar_id: cuenta.id, activo: true },
    });
    expect(pagos).toBe(10);
  });

  it('solo un cobro gana cuando el saldo no alcanza para ambos concurrentes', async () => {
    const cuenta = await service.crearCuenta(
      { clienteId, monto: 500, fechaVencimiento: '2026-12-16' },
      ACTOR_USER_ID,
    );
    raceCuentaIds.push(cuenta.id);

    const resultados = await Promise.allSettled([
      service.registrarCobro(cuenta.id, { monto: 400, metodoPago: 'EFECTIVO', referencia: 'IT-RAZA-400-A' }, ACTOR_USER_ID),
      service.registrarCobro(cuenta.id, { monto: 400, metodoPago: 'EFECTIVO', referencia: 'IT-RAZA-400-B' }, ACTOR_USER_ID),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((r) => r.status === 'rejected')).toHaveLength(1);

    // El perdedor audita FAIL COBRO_EXCEDE_SALDO (carrera perdida dentro de la tx).
    const auditFail = await prisma.registro_auditoria.findFirst({
      where: {
        action: AuditAction.COBRO_REGISTRADO,
        entity_id: cuenta.id,
        result: AuditResult.FAIL,
        error_code: 'COBRO_EXCEDE_SALDO',
      },
      orderBy: { timestamp: 'desc' },
    });
    expect(auditFail).not.toBeNull();

    const cuentaDb = await prisma.cuentas_por_cobrar.findUnique({
      where: { id: cuenta.id },
    });
    expect(Number(cuentaDb!.monto_pagado)).toBe(400);
  });

  it('reversiones concurrentes de cobros distintos no pierden saldo', async () => {
    const cuenta = await service.crearCuenta(
      { clienteId, monto: 1000, fechaVencimiento: '2026-12-17' },
      ACTOR_USER_ID,
    );
    raceCuentaIds.push(cuenta.id);

    const c1 = await service.registrarCobro(
      cuenta.id,
      { monto: 400, metodoPago: 'TRANSFERENCIA', referencia: 'IT-REV-A' },
      ACTOR_USER_ID,
    );
    const c2 = await service.registrarCobro(
      cuenta.id,
      { monto: 400, metodoPago: 'TRANSFERENCIA', referencia: 'IT-REV-B' },
      ACTOR_USER_ID,
    );

    await Promise.all([
      service.revertirCobro(cuenta.id, c1.cobro.id, ACTOR_USER_ID, {
        motivo: 'Reversión concurrente A de prueba',
      }),
      service.revertirCobro(cuenta.id, c2.cobro.id, ACTOR_USER_ID, {
        motivo: 'Reversión concurrente B de prueba',
      }),
    ]);

    const cuentaDb = await prisma.cuentas_por_cobrar.findUnique({
      where: { id: cuenta.id },
    });
    expect(Number(cuentaDb!.monto_pagado)).toBe(0);
    expect(cuentaDb!.estado).toBe('PENDIENTE');
  });
});