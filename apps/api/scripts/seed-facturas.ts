/**
 * Seed de datos reales para el módulo Facturas (fase 3).
 *
 * Crea 6 facturas ligadas a clientes existentes, sus conceptos, cuentas por
 * cobrar y cobros (reutilizando CobranzaService para CxC), más 1 cotización
 * ACEPTADA que queda ligada a la factura SEED-FAC-0002 (simula el flujo
 * cotización → factura).
 *
 * Distribución:
 *   2 PENDIENTE  · 2 TIMBRADA (CxC con pagos parciales) · 1 PAGADA (CxC saldada) · 1 CANCELADA
 *
 * Ejecutar:
 *   npx tsx scripts/seed-facturas.ts
 *
 * Idempotente: elimina (hard) corridas previas identificadas por el prefijo
 * SEED-FAC- en `facturas.codigo` (y su cotización SEED-FAC-COT). Los
 * registros de auditoría son inmutables y se conservan.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditContextService } from '../src/audit/audit-context.service';
import { AuditService } from '../src/audit/audit.service';
import { AuditAction, AuditResult, EstadoCotizacion } from '@prisma/client';
import { CobranzaService } from '../src/cobranza/cobranza.service';

const SEED_PREFIX = 'SEED-FAC-';
const SEED_COT_PREFIX = 'SEED-FAC-COT-';
const USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

const IVA = 0.16;

type ConceptoSeed = {
  cantidad: number;
  unidad: string;
  descripcion: string;
  valorUnitario: number;
  iva?: boolean; // true = grava IVA 16%; false/undefined = exento
};

type FacturaSeed = {
  clienteIdx: number;
  estado: string;
  concepto: ConceptoSeed[];
  conIva?: boolean;
  diasAtras: number;
  cotizacion?: boolean;
  cxc?: { vencimientoDias: number; cobros: { monto: number; diasAtras: number; metodoPago: string }[] };
};

const r = (n: number) => Math.round(n * 100) / 100;

function conceptoSets(): Record<string, ConceptoSeed[]> {
  return {
    '3-conceptos': [
      { cantidad: 45, unidad: 'm³', descripcion: 'Excavación y retiro de material', valorUnitario: 680, iva: true },
      { cantidad: 12, unidad: 'viajes', descripcion: 'Acarreo de tepetate en volteo 14 m³', valorUnitario: 1450, iva: true },
      { cantidad: 1, unidad: 'pza', descripcion: 'Levantamiento topográfico con dron', valorUnitario: 8500, iva: false },
    ],
    '1-concepto': [
      { cantidad: 8, unidad: 'días', descripcion: 'Renta de retroexcavadora con operador', valorUnitario: 4200, iva: true },
    ],
    'renta-maq': [
      { cantidad: 15, unidad: 'días', descripcion: 'Renta de excavadora 320D con operador', valorUnitario: 7600, iva: true },
      { cantidad: 150, unidad: 'l', descripcion: 'Diésel consumido en obra', valorUnitario: 24.5, iva: true },
    ],
    'obra-civil': [
      { cantidad: 3, unidad: 'pza', descripcion: 'Cuadrilla de albañilería (semana)', valorUnitario: 18500, iva: true },
      { cantidad: 2, unidad: 'pza', descripcion: 'Elaboración de planos ejecutivos', valorUnitario: 7200, iva: false },
    ],
    'pago-completo': [
      { cantidad: 1, unidad: 'pza', descripcion: 'Cimentación y losa de cimentación', valorUnitario: 248000, iva: true },
      { cantidad: 1, unidad: 'pza', descripcion: 'Instalación hidrosanitaria', valorUnitario: 96000, iva: true },
      { cantidad: 1, unidad: 'pza', descripcion: 'Impermeabilización de azotea', valorUnitario: 38500, iva: false },
    ],
    'concepto-simple': [
      { cantidad: 1, unidad: 'pza', descripcion: 'Elaboración de proyecto estructural', valorUnitario: 54000, iva: true },
    ],
  };
}

function diasDesdeHoy(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(12, 0, 0, 0);
  return d;
}

function calcularTotales(conceptos: ConceptoSeed[]) {
  const lineas = conceptos.map((c) => {
    const importe = r(c.cantidad * c.valorUnitario);
    const impuestoImporte = c.iva ? r(importe * IVA) : 0;
    return {
      importe,
      impuestoImporte,
      tasa: c.iva ? IVA : null,
    };
  });
  const subtotal = r(lineas.reduce((s, l) => s + l.importe, 0));
  const impuestos = r(lineas.reduce((s, l) => s + l.impuestoImporte, 0));
  return { lineas, subtotal, impuestos, total: r(subtotal + impuestos) };
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const auditContext = new AuditContextService();
  const auditService = new AuditService(prisma, auditContext);
  const cobranza = new CobranzaService(prisma, auditService);

  const sets = conceptoSets();
  const facturasSeed: FacturaSeed[] = [
    // PENDIENTE sin CxC, 3 conceptos
    { clienteIdx: 0, estado: 'PENDIENTE', concepto: sets['3-conceptos'], diasAtras: 5 },
    // PENDIENTE ligada a cotización ACEPTADA del seed (flujo cotización → factura)
    { clienteIdx: 0, estado: 'PENDIENTE', concepto: sets['1-concepto'], diasAtras: 3, cotizacion: true },
    // TIMBRADA con CxC parcial (1 pago 40%)
    {
      clienteIdx: 1, estado: 'TIMBRADA', concepto: sets['renta-maq'], diasAtras: 12,
      cxc: { vencimientoDias: 15, cobros: [{ monto: 40000, diasAtras: 5, metodoPago: 'TRANSFERENCIA' }] },
    },
    // TIMBRADA con CxC parcial (2 pagos)
    {
      clienteIdx: 2, estado: 'TIMBRADA', concepto: sets['obra-civil'], diasAtras: 20,
      cxc: { vencimientoDias: 10, cobros: [
        { monto: 50000, diasAtras: 15, metodoPago: 'CHEQUE' },
        { monto: 25000, diasAtras: 6, metodoPago: 'TRANSFERENCIA' },
      ] },
    },
    // PAGADA con CxC saldada (2 pagos que completan el total)
    {
      clienteIdx: 3, estado: 'PAGADA', concepto: sets['pago-completo'], diasAtras: 30,
      cxc: { vencimientoDias: -25, cobros: [] }, // cobros se completan con el monto total abajo
    },
    // CANCELADA
    { clienteIdx: 4, estado: 'CANCELADA', concepto: sets['concepto-simple'], diasAtras: 40 },
  ];

  // ── 1. Clientes: reutilizar activos existentes (prefieren SEED-CXC-*) ──
  const existentes = await prisma.clientes.findMany({
    where: { activo: true, eliminado_en: null },
    orderBy: [{ codigo: 'asc' }],
    select: { id: true, codigo: true },
  });
  const preferidos = existentes.filter((c) => c.codigo?.startsWith('SEED-CXC-'));
  const pool = preferidos.length >= 5 ? preferidos : existentes;
  if (pool.length < 5) {
    throw new Error(`Se requieren al menos 5 clientes activos; hay ${pool.length}. Corre antes seed-cobranza.ts o seed-clientes.ts`);
  }
  const clientes = pool.slice(0, 5).map((c) => c.id);

  // ── 2. Limpieza idempotente (FK-safe) ──
  const facturasPrevias = await prisma.facturas.findMany({
    where: { codigo: { startsWith: SEED_PREFIX } },
    select: { id: true },
  });
  const facturaIds = facturasPrevias.map((f) => f.id);

  const cotPrevias = await prisma.cotizaciones.findMany({
    where: { codigo: { startsWith: SEED_COT_PREFIX } },
    select: { id: true },
  });
  const cotIds = cotPrevias.map((c) => c.id);

  if (facturaIds.length > 0 || cotIds.length > 0) {
    const cuentas = await prisma.cuentas_por_cobrar.findMany({
      where: { factura_id: { in: facturaIds } },
      select: { id: true },
    });
    const cuentaIds = cuentas.map((c) => c.id);
    const pagos = await prisma.pagos.findMany({
      where: { cuenta_por_cobrar_id: { in: cuentaIds } },
      select: { id: true },
    });
    const pagoIds = pagos.map((p) => p.id);

    await prisma.transacciones.deleteMany({ where: { entidad_tipo: 'COBRO', entidad_id: { in: pagoIds } } });
    await prisma.pagos.deleteMany({ where: { cuenta_por_cobrar_id: { in: cuentaIds } } });
    await prisma.cuentas_por_cobrar.deleteMany({ where: { id: { in: cuentaIds } } });
    await prisma.factura_conceptos.deleteMany({ where: { factura_id: { in: facturaIds } } });
    await prisma.facturas.deleteMany({ where: { id: { in: facturaIds } } });
    await prisma.cotizaciones.deleteMany({ where: { id: { in: cotIds } } });
    console.log(`Limpieza: ${facturaIds.length} facturas, ${cotIds.length} cotizaciones previas (SEED-FAC-*) eliminadas.`);
  }

  // ── 3. Cotización ACEPTADA del seed (liga a SEED-FAC-0002) ──
  const cotMonto = r(8 * 4200 + 8 * 4200 * IVA);
  const cotizacion = await prisma.cotizaciones.create({
    data: {
      id: randomUUID(),
      codigo: `${SEED_COT_PREFIX}001`,
      cliente_id: clientes[0],
      descripcion: 'Renta de retroexcabadora 8 días (seed facturas)',
      monto: cotMonto,
      fecha: diasDesdeHoy(-3),
      estado: EstadoCotizacion.ACEPTADA,
      activo: true,
      actualizado_en: diasDesdeHoy(-2),
      creado_por: USER_ID,
    },
  });
  await auditService.log({
    action: AuditAction.COTIZACION_FACTURADA,
    entityType: 'cotizaciones',
    entityId: cotizacion.id,
    result: AuditResult.SUCCESS,
    actorUserId: USER_ID,
    actorType: 'SYSTEM',
    actorRole: 'seed',
    newValue: { factura: 'SEED-FAC-0002' },
  });

  // ── 4. Facturas + conceptos ──
  const creadas: { facturaId: string; estado: string; total: number; clienteId: string }[] = [];
  const facturaIdsCreadas: string[] = [];

  for (let i = 0; i < facturasSeed.length; i++) {
    const s = facturasSeed[i];
    const { lineas, subtotal, impuestos, total } = calcularTotales(s.concepto);

    const factura = await prisma.facturas.create({
      data: {
        id: randomUUID(),
        codigo: `${SEED_PREFIX}${String(i + 1).padStart(4, '0')}`,
        serie: 'F',
        folio: String(i + 1).padStart(6, '0'),
        cliente_id: clientes[s.clienteIdx],
        cotizacion_id: s.cotizacion ? cotizacion.id : null,
        subtotal,
        impuestos,
        total,
        moneda: 'MXN',
        tipo_cambio: 1,
        forma_pago: 'PAGO_EN_UNA_SOLA_EXHIBICION',
        metodo_pago: 'PPD',
        uso_cfdi: 'G03',
        estado: s.estado,
        activo: true,
        creado_en: diasDesdeHoy(-s.diasAtras),
        actualizado_en: diasDesdeHoy(-s.diasAtras),
        creado_por: USER_ID,
        timbrado_en: s.estado === 'PENDIENTE' || s.estado === 'CANCELADA' ? null : diasDesdeHoy(-s.diasAtras + 1),
      },
    });
    facturaIdsCreadas.push(factura.id);
    creadas.push({ facturaId: factura.id, estado: s.estado, total, clienteId: factura.cliente_id });

    for (const [j, linea] of s.concepto.entries()) {
      await prisma.factura_conceptos.create({
        data: {
          id: randomUUID(),
          factura_id: factura.id,
          cantidad: linea.cantidad,
          unidad: linea.unidad,
          descripcion: linea.descripcion,
          valor_unitario: linea.valorUnitario,
          importe: r(linea.cantidad * linea.valorUnitario),
          descuento: 0,
          objeto_impuesto: linea.iva ? '04' : '02',
          impuesto_tasa: lineas[j].tasa,
          impuesto_importe: lineas[j].impuestoImporte > 0 ? lineas[j].impuestoImporte : null,
          activo: true,
        },
      });
    }

    await auditService.log({
      action: s.estado === 'CANCELADA' ? AuditAction.FACTURA_CANCELADA : AuditAction.FACTURA_CREADA,
      entityType: 'facturas',
      entityId: factura.id,
      result: AuditResult.SUCCESS,
      actorUserId: USER_ID,
      actorType: 'SYSTEM',
      actorRole: 'seed',
      newValue: s.estado === 'CANCELADA'
        ? { motivo: 'Error en datos fiscales' }
        : { codigo: factura.codigo, clienteId: factura.cliente_id, subtotal, impuestos, total },
    });
  }

  // ── 5. CxC + cobros (vía CobranzaService para mantener folios/auditoría) ──
  let cxcCreadas = 0;
  let cobrosRegistrados = 0;

  for (let i = 0; i < facturasSeed.length; i++) {
    const s = facturasSeed[i];
    if (!s.cxc) continue;
    const { facturaId, total, clienteId } = creadas[i];

    const fechaVenc = s.cxc.vencimientoDias === null
      ? undefined
      : diasDesdeHoy(s.cxc.vencimientoDias).toISOString().slice(0, 10);

    const cuenta = await cobranza.crearCuenta(
      { clienteId, facturaId, monto: total, fechaVencimiento: fechaVenc },
      USER_ID,
    );
    cxcCreadas++;

    // PAGADA: dos pagos que completan el total
    let cobros = s.cxc.cobros;
    if (s.estado === 'PAGADA') {
      const a = r(total * 0.6);
      const b = r(total - a);
      cobros = [
        { monto: a, diasAtras: 20, metodoPago: 'TRANSFERENCIA' },
        { monto: b, diasAtras: 3, metodoPago: 'CHEQUE' },
      ];
    }

    for (const cobro of cobros) {
      await cobranza.registrarCobro(
        cuenta.id,
        {
          monto: cobro.monto,
          fecha: diasDesdeHoy(-cobro.diasAtras).toISOString().slice(0, 10),
          metodoPago: cobro.metodoPago,
          referencia: `SEED-${randomUUID().slice(0, 6).toUpperCase()}`,
        },
        USER_ID,
      );
      cobrosRegistrados++;
    }
  }

  // ── 6. Resumen ──
  const [totFac, totConceptos, totCxcSeed, totPagosSeed] = await Promise.all([
    prisma.facturas.count({ where: { codigo: { startsWith: SEED_PREFIX } } }),
    prisma.factura_conceptos.count({ where: { facturas: { codigo: { startsWith: SEED_PREFIX } } } }),
    prisma.cuentas_por_cobrar.count({ where: { facturas: { codigo: { startsWith: SEED_PREFIX } } } }),
    prisma.pagos.count({ where: { cuentas_por_cobrar: { facturas: { codigo: { startsWith: SEED_PREFIX } } } } }),
  ]);

  console.log('\n──────────────────────────────────────────────');
  console.log('SEED FACTURAS COMPLETADO');
  console.log('──────────────────────────────────────────────');
  console.log(`Facturas creadas:    ${totFac} (6 esperadas)`);
  console.log(`  PENDIENTE: 2 · TIMBRADA: 2 · PAGADA: 1 · CANCELADA: 1`);
  console.log(`Conceptos creados:   ${totConceptos} (~12 esperados)`);
  console.log(`Cuentas por cobrar:  ${totCxcSeed} (3 esperadas)`);
  console.log(`Cobros registrados:  ${cobrosRegistrados} (${totPagosSeed})`);
  console.log(`Cotización ligada:   ${cotizacion.codigo} (ACEPTADA, monto $${cotMonto})`);
  console.log('──────────────────────────────────────────────');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});