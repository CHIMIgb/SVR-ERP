/**
 * Seed de datos reales para el módulo Cobranza (fase 2).
 *
 * Crea 6 clientes (prefijo SEED-CXC-) y 8 cuentas por cobrar con su
 * variedad de situaciones (al corriente, atraso leve/grave, parcial,
 * saldadas) reutilizando el CobranzaService, por lo que folios, pagos,
 * transacciones de ingreso y auditoría siguen la lógica oficial.
 *
 * Ejecutar:
 *   npx tsx scripts/seed-cobranza.ts
 *
 * Idempotente: elimina (hard) corridas previas identificadas por el prefijo
 * SEED-CXC- en `clientes.codigo`. Los registros de auditoría son inmutables
 * y se conservan.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditContextService } from '../src/audit/audit-context.service';
import { AuditService } from '../src/audit/audit.service';
import { CobranzaService } from '../src/cobranza/cobranza.service';

const SEED_PREFIX = 'SEED-CXC-';
const USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

type SeedCliente = { nombre: string; empresa: string; rfc: string };

const clientesSeed: SeedCliente[] = [
  { nombre: 'Constructora Ortiz', empresa: 'Constructora Ortiz SA de CV', rfc: 'COO950101T11' },
  { nombre: 'Desarrollos Riviera', empresa: 'Desarrollos Riviera SAPI', rfc: 'DRI880202M15' },
  { nombre: 'Minera Santa Fe', empresa: 'Minera Santa Fe SA', rfc: 'MSF910303DJ2' },
  { nombre: 'Ferrocarriles del Sur', empresa: 'Ferrocarriles del Sur SA de CV', rfc: 'FSU920404XA1' },
  { nombre: 'Gobierno Municipal', empresa: 'H. Ayuntamiento de Santiago', rfc: 'GMS930505QL3' },
  { nombre: 'Constructora Pirámide', empresa: 'Constructora Pirámide SA', rfc: 'CPI940606P17' },
];

function diasDesdeHoy(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(12, 0, 0, 0); // evita cruces de huso
  return d;
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const auditContext = new AuditContextService();
  const auditService = new AuditService(prisma, auditContext);
  const service = new CobranzaService(prisma, auditService);

  // ── 1. Limpieza idempotente (FK-safe) ───────────────
  const clientesPrevios = await prisma.clientes.findMany({
    where: { codigo: { startsWith: SEED_PREFIX } },
    select: { id: true },
  });
  const clienteIds = clientesPrevios.map((c) => c.id);

  if (clienteIds.length > 0) {
    const cuentas = await prisma.cuentas_por_cobrar.findMany({
      where: { cliente_id: { in: clienteIds } },
      select: { id: true },
    });
    const cuentaIds = cuentas.map((c) => c.id);
    const pagos = await prisma.pagos.findMany({
      where: { cuenta_por_cobrar_id: { in: cuentaIds } },
      select: { id: true },
    });
    const pagoIds = pagos.map((p) => p.id);

    await prisma.transacciones.deleteMany({
      where: { entidad_tipo: 'COBRO', entidad_id: { in: pagoIds } },
    });
    await prisma.pagos.deleteMany({
      where: { cuenta_por_cobrar_id: { in: cuentaIds } },
    });
    await prisma.cuentas_por_cobrar.deleteMany({
      where: { id: { in: cuentaIds } },
    });
    await prisma.clientes.deleteMany({ where: { id: { in: clienteIds } } });
    console.log(`Limpieza: ${clientesPrevios.length} clientes previos (SEED-CXC-*) eliminados.`);
  }

  // ── 2. Clientes ──────────────────────────────────────
  const clientes = [];
  for (let i = 0; i < clientesSeed.length; i++) {
    const s = clientesSeed[i];
    const creado = await prisma.clientes.create({
      data: {
        id: randomUUID(),
        codigo: `${SEED_PREFIX}${String(i + 1).padStart(3, '0')}`,
        nombre: s.nombre,
        empresa: s.empresa,
        correo: `contacto@${s.rfc.toLowerCase()}.mx`,
        telefono: `55-${i}000-00${i}`,
        rfc: s.rfc,
        activo: true,
        actualizado_en: new Date(),
      },
    });
    clientes.push(creado.id);
  }

  // ── 3. Cuentas por cobrar ────────────────────────────
  type SeedCuenta = {
    clienteIdx: number;
    monto: number;
    vencimientoDias: number | null; // relativo a hoy; null = sin vencimiento
    estadoEsperado: 'PENDIENTE' | 'PARCIAL' | 'SALDADA';
    cobros?: { monto: number; diasAtras: number; metodoPago: string }[];
  };

  const cuentasSeed: SeedCuenta[] = [
    // PENDIENTE al corriente (vencimiento en 25 días)
    { clienteIdx: 0, monto: 84500, vencimientoDias: 25, estadoEsperado: 'PENDIENTE' },
    // ATRASO_LEVE (vencida hace 8 días)
    { clienteIdx: 0, monto: 32000, vencimientoDias: -8, estadoEsperado: 'PENDIENTE' },
    // ATRASO_GRAVE (vencida hace 45 días)
    { clienteIdx: 1, monto: 156000, vencimientoDias: -45, estadoEsperado: 'PENDIENTE' },
    // PARCIAL con un cobro de 40%
    {
      clienteIdx: 2,
      monto: 98000,
      vencimientoDias: 15,
      estadoEsperado: 'PARCIAL',
      cobros: [{ monto: 40000, diasAtras: 3, metodoPago: 'TRANSFERENCIA' }],
    },
    // PARCIAL vencida con dos cobros
    {
      clienteIdx: 3,
      monto: 215000,
      vencimientoDias: -12,
      estadoEsperado: 'PARCIAL',
      cobros: [
        { monto: 50000, diasAtras: 40, metodoPago: 'EFECTIVO' },
        { monto: 30000, diasAtras: 10, metodoPago: 'TRANSFERENCIA' },
      ],
    },
    // SALDADA cobrada completa este mes (alimenta cobradoMes)
    {
      clienteIdx: 4,
      monto: 67400,
      vencimientoDias: -30,
      estadoEsperado: 'SALDADA',
      cobros: [
        { monto: 30000, diasAtras: 12, metodoPago: 'CHEQUE' },
        { monto: 37400, diasAtras: 2, metodoPago: 'TRANSFERENCIA' },
      ],
    },
    // PENDIENTE sin vencimiento (al corriente)
    { clienteIdx: 4, monto: 45000, vencimientoDias: null, estadoEsperado: 'PENDIENTE' },
    // SALDADA pagada completa hace 5 días (vencida antes de pagarse)
    {
      clienteIdx: 5,
      monto: 124800,
      vencimientoDias: -20,
      estadoEsperado: 'SALDADA',
      cobros: [{ monto: 124800, diasAtras: 5, metodoPago: 'TRANSFERENCIA' }],
    },
  ];

  let creadas = 0;
  let cobros = 0;
  for (const c of cuentasSeed) {
    const cuenta = await service.crearCuenta(
      {
        clienteId: clientes[c.clienteIdx],
        monto: c.monto,
        fechaVencimiento: c.vencimientoDias === null ? undefined : diasDesdeHoy(c.vencimientoDias).toISOString().slice(0, 10),
      },
      USER_ID,
    );
    creadas++;

    for (const cobro of c.cobros ?? []) {
      await service.registrarCobro(
        cuenta.id,
        {
          monto: cobro.monto,
          fecha: diasDesdeHoy(-cobro.diasAtras).toISOString().slice(0, 10),
          metodoPago: cobro.metodoPago,
          referencia: `SEED-${randomUUID().slice(0, 6).toUpperCase()}`,
        },
        USER_ID,
      );
      cobros++;
    }
  }

  const total = await prisma.cuentas_por_cobrar.count({ where: { activo: true } });
  console.log(
    `Cobranza seed: ${creadas} cuentas por cobrar creadas, ${cobros} cobros registrados. Total CxC activas en BD: ${total}`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});