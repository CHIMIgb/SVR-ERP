/**
 * Seed de datos reales para la Fase 4 (proyecto en CxC + bitácora → CxC).
 *
 * Crea:
 *   3 CxC ligadas a proyectos existentes (facturas PEND-0001/2/3 del seed de
 *     facturas): una vencida (P001), una parcial con cobro real (P002) y una
 *     SIN proyecto (grupo "Sin proyecto" del reporte por obra).
 *   1 obra de prueba (SEED-F4-OB) ligada al proyecto P001.
 *   3 bitácoras de renta de maquinaria:
 *     2 en LISTO_FACTURAR (con firma del cliente) listas para probar O3,
 *       una con obra → su CxC automática heredará el proyecto P001;
 *     1 en FACTURADO con CxC ligada (verifica el guard anti doble clic de 4c).
 *
 * Ejecutar:
 *   npx tsx scripts/seed-fase4.ts
 *
 * Idempotente: elimina (hard) corridas previas (CxC de SEED-F4-*, bitácoras
 * SEED-F4-BIT-*, obra SEED-F4-OB). El registro de auditoría es inmutable y se
 * conserva.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditContextService } from '../src/audit/audit-context.service';
import { AuditService } from '../src/audit/audit.service';
import { AuditAction, AuditResult, EstadoCobroBitacora } from '@prisma/client';
import { CobranzaService } from '../src/cobranza/cobranza.service';

const USUARIO_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user
const BIT_PREFIX = 'SEED-F4-BIT-';
const OBRA_CODIGO = 'SEED-F4-OB';

const TRABAJADOR_ID = 'ea344f07-0905-4881-a64b-b7315f0bfe97'; // Pedro Gómez
const MAQUINA_ID = 'b7bb9152-0851-4372-9e55-b393fa7da463'; // Excavadora CAT 320
const TARIFA_HORA = 1450;

/** Convierte "HH:mm" a Date anclado en UTC (mismo patrón que bitacoras-renta.service). */
function horaAUtc(hhmm: string): Date {
  const [horas, minutos] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, horas, minutos, 0));
}

function diasDesdeHoy(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(12, 0, 0, 0);
  return d;
}

/** Elimina (hard) corridas previas del seed, respetando FKs. */
async function limpiarCorridasPrevias(prisma: PrismaService) {
  const facturasPend = await prisma.facturas.findMany({
    where: { codigo: { in: ['PEND-0001', 'PEND-0002', 'PEND-0003'] } },
    select: { id: true },
  });
  const bitacorasPrevias = await prisma.bitacoras_renta_diaria.findMany({
    where: { folio: { startsWith: BIT_PREFIX } },
    select: { id: true },
  });

  const cxcs = await prisma.cuentas_por_cobrar.findMany({
    where: {
      OR: [
        { factura_id: { in: facturasPend.map((f) => f.id) } },
        { bitacora_id: { in: bitacorasPrevias.map((b) => b.id) } },
      ],
    },
    select: { id: true },
  });

  // FK-safe: transacciones de cobros → pagos → CxC → bitácoras → obra.
  for (const cxc of cxcs) {
    const pagos = await prisma.pagos.findMany({
      where: { cuenta_por_cobrar_id: cxc.id },
      select: { id: true },
    });
    if (pagos.length > 0) {
      await prisma.transacciones.deleteMany({
        where: { entidad_tipo: 'COBRO', entidad_id: { in: pagos.map((p) => p.id) } },
      });
      await prisma.pagos.deleteMany({ where: { cuenta_por_cobrar_id: cxc.id } });
    }
  }
  await prisma.cuentas_por_cobrar.deleteMany({
    where: {
      OR: [
        { factura_id: { in: facturasPend.map((f) => f.id) } },
        { bitacora_id: { in: bitacorasPrevias.map((b) => b.id) } },
      ],
    },
  });

  if (bitacorasPrevias.length > 0) {
    await prisma.firmas_cliente.deleteMany({
      where: { bitacora_id: { in: bitacorasPrevias.map((b) => b.id) } },
    });
    await prisma.bitacoras_renta_diaria.deleteMany({
      where: { folio: { startsWith: BIT_PREFIX } },
    });
  }
  await prisma.obras.deleteMany({ where: { codigo: OBRA_CODIGO } });
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const auditContext = new AuditContextService();
  const auditService = new AuditService(prisma, auditContext);
  const cobranza = new CobranzaService(prisma, auditService);

  await limpiarCorridasPrevias(prisma);

  // ── 1. Referencias existentes ──
  const facturas = await prisma.facturas.findMany({
    where: { codigo: { in: ['PEND-0001', 'PEND-0002', 'PEND-0003'] } },
    select: { id: true, codigo: true, total: true, cliente_id: true },
  });
  const porCodigo = Object.fromEntries(facturas.map((f) => [f.codigo, f]));
  const proyectos = await prisma.proyectos.findMany({
    where: { codigo: { in: ['P001', 'P002', 'P003'] } },
    select: { id: true, codigo: true },
  });
  const proyectoPorCodigo = Object.fromEntries(proyectos.map((p) => [p.codigo, p]));

  const pendientes = ['PEND-0001', 'PEND-0002', 'PEND-0003'];
  if (pendientes.some((c) => !porCodigo[c])) {
    throw new Error('Faltan facturas PEND-0001/2/3 — corre antes scripts/seed-facturas.ts --pendientes=30');
  }
  if (pendientes.some((c) => !proyectoPorCodigo[`P00${pendientes.indexOf(c) + 1}`])) {
    throw new Error('Faltan proyectos P001/P002/P003 — corre el seed de proyectos');
  }

  // ── 2. CxC de proyecto ──
  const crudas: { factura: (typeof facturas)[0]; proyectoId: string | null; vencimientoDias: number; descripcion: string }[] = [
    { factura: porCodigo['PEND-0001'], proyectoId: proyectoPorCodigo['P001'].id, vencimientoDias: -8, descripcion: 'CxC vencida por proyecto P001' },
    { factura: porCodigo['PEND-0002'], proyectoId: proyectoPorCodigo['P002'].id, vencimientoDias: 15, descripcion: 'CxC parcial por proyecto P002' },
    { factura: porCodigo['PEND-0003'], proyectoId: null, vencimientoDias: 30, descripcion: 'CxC sin proyecto (grupo Sin proyecto)' },
  ];

  let cxcIdParcial: string | null = null;
  for (const c of crudas) {
    const cuenta = await prisma.cuentas_por_cobrar.create({
      data: {
        id: randomUUID(),
        cliente_id: c.factura.cliente_id,
        factura_id: c.factura.id,
        proyecto_id: c.proyectoId,
        monto: Number(c.factura.total),
        fecha_vencimiento: diasDesdeHoy(c.vencimientoDias),
        estado: 'PENDIENTE',
        activo: true,
        actualizado_en: new Date(),
      },
    });
    if (c.proyectoId === proyectoPorCodigo['P002'].id) cxcIdParcial = cuenta.id;
    await auditService.log({
      action: AuditAction.CXC_CREADA,
      entityType: 'cuentas_por_cobrar',
      entityId: cuenta.id,
      result: AuditResult.SUCCESS,
      actorUserId: USUARIO_ID,
      actorType: 'SYSTEM',
      actorRole: 'seed',
      newValue: { factura: c.factura.codigo, proyecto: c.proyectoId ? `P00${crudas.indexOf(c) + 1}` : null, monto: Number(c.factura.total), descripcion: c.descripcion },
    });
  }

  // Cobro parcial real (40%) contra la CxC de P002 → estado PARCIAL + auditoría.
  if (cxcIdParcial) {
    const total = Number(porCodigo['PEND-0002'].total);
    await cobranza.registrarCobro(
      cxcIdParcial,
      {
        monto: Math.round(total * 0.4 * 100) / 100,
        fecha: diasDesdeHoy(-3).toISOString().slice(0, 10),
        metodoPago: 'TRANSFERENCIA',
        referencia: `SEED-F4-${randomUUID().slice(0, 6).toUpperCase()}`,
      },
      USUARIO_ID,
    );
  }

  // ── 3. Obra de prueba ligada a P001 ──
  const obra = await prisma.obras.create({
    data: {
      id: randomUUID(),
      codigo: OBRA_CODIGO,
      nombre: 'Obra de prueba fase 4 (bitácora → CxC)',
      proyecto_id: proyectoPorCodigo['P001'].id,
      activo: true,
      actualizado_en: new Date(),
    },
  });

  // ── 4. Bitácoras de renta ──
  const clienteId = porCodigo['PEND-0001'].cliente_id;
  const importe = TARIFA_HORA * 8; // 8 horas efectivas

  const bitacoras = [
    { folio: `${BIT_PREFIX}001`, obraId: null as string | null, estado: EstadoCobroBitacora.LISTO_FACTURAR, descripcion: 'Lista para facturar (sin obra → CxC sin proyecto)' },
    { folio: `${BIT_PREFIX}002`, obraId: obra.id, estado: EstadoCobroBitacora.LISTO_FACTURAR, descripcion: 'Lista para facturar (obra → CxC hereda P001)' },
    { folio: `${BIT_PREFIX}003`, obraId: null as string | null, estado: EstadoCobroBitacora.FACTURADO, descripcion: 'Ya facturada con CxC ligada (verifica guard)' },
  ];

  let cxcBitacoraId: string | null = null;
  for (const b of bitacoras) {
    const bitacora = await prisma.bitacoras_renta_diaria.create({
      data: {
        id: randomUUID(),
        folio: b.folio,
        trabajador_id: TRABAJADOR_ID,
        maquina_id: MAQUINA_ID,
        fecha: diasDesdeHoy(-2),
        cliente_id: clienteId,
        obra_ubicacion: 'Obra de prueba SEED-F4',
        horas_efectivas: 8,
        horas_extras: 0,
        horometro_inicial: 1000,
        horometro_final: 1008,
        actividad_realizada: 'Excavación para cimentación (seed)',
        estado_cobro: b.estado,
        tarifa_hora_renta: TARIFA_HORA,
        importe_total_renta: importe,
        obra_id: b.obraId,
        hora_inicio: horaAUtc('08:00:00'),
        hora_fin: horaAUtc('17:00:00'),
        activo: true,
        actualizado_en: new Date(),
        creado_por: USUARIO_ID,
      },
    });

    if (b.estado === EstadoCobroBitacora.LISTO_FACTURAR) {
      await prisma.firmas_cliente.create({
        data: {
          id: randomUUID(),
          bitacora_id: bitacora.id,
          firmado: true,
          nombre_residente: 'Residente SEED F4',
          cargo_residente: 'Residente de obra',
          activo: true,
          actualizado_en: new Date(),
        },
      });
    }

    if (b.estado === EstadoCobroBitacora.FACTURADO) {
      const cuenta = await prisma.cuentas_por_cobrar.create({
        data: {
          id: randomUUID(),
          cliente_id: clienteId,
          bitacora_id: bitacora.id,
          monto: importe,
          fecha_vencimiento: diasDesdeHoy(30),
          estado: 'PENDIENTE',
          activo: true,
          actualizado_en: new Date(),
        },
      });
      cxcBitacoraId = cuenta.id;
      await auditService.log({
        action: AuditAction.CXC_CREADA,
        entityType: 'cuentas_por_cobrar',
        entityId: cuenta.id,
        result: AuditResult.SUCCESS,
        actorUserId: USUARIO_ID,
        actorType: 'SYSTEM',
        actorRole: 'seed',
        newValue: { bitacora: b.folio, monto: importe, descripcion: 'CxC nacida de bitácora FACTURADO (seed)' },
      });
    }

    await auditService.log({
      action: AuditAction.BITACORA_RENTA_CREADA,
      entityType: 'bitacoras_renta_diaria',
      entityId: bitacora.id,
      result: AuditResult.SUCCESS,
      actorUserId: USUARIO_ID,
      actorType: 'SYSTEM',
      actorRole: 'seed',
      newValue: { folio: b.folio, estado_cobro: b.estado, importe, descripcion: b.descripcion },
    });
  }

  // ── 5. Resumen ──
  const [totCxcProyecto, totBitacoras, totCxcBitacora] = await Promise.all([
    prisma.cuentas_por_cobrar.count({ where: { proyecto_id: { not: null }, facturas: { codigo: { startsWith: 'PEND-' } } } }),
    prisma.bitacoras_renta_diaria.count({ where: { folio: { startsWith: BIT_PREFIX } } }),
    prisma.cuentas_por_cobrar.count({ where: { bitacoras_renta_diaria: { folio: { startsWith: BIT_PREFIX } } } }),
  ]);

  console.log('\n──────────────────────────────────────────────');
  console.log('SEED FASE 4 COMPLETADO');
  console.log('──────────────────────────────────────────────');
  console.log(`CxC con proyecto:     ${totCxcProyecto} (P001 vencida + P002 parcial + P003 sin proyecto)`);
  console.log(`CxC parcial (P002):   ${cxcIdParcial ? 'sí (cobro 40% real)' : 'NO'}`);
  console.log(`Bitácoras creadas:    ${totBitacoras} (2 LISTO_FACTURAR + 1 FACTURADO)`);
  console.log(`CxC de bitácora:      ${totCxcBitacora} (1, ligada a ${BIT_PREFIX}003)`);
  console.log(`Obra de prueba:       ${OBRA_CODIGO} → P001 (heredará proyecto en O3)`);
  console.log('──────────────────────────────────────────────');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});