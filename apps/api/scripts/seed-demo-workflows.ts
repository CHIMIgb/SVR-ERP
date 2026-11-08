/**
 * Seed demo de workflows — F6 (Tier 1, IMPLEMENTACIONES-A-FUTURO.md §11 F6).
 *
 * Puebla COMERCIAL/Operaciones con registros REALES y coherentes para la demo:
 *   1. Apertura de caja (fondo 5,000) SI no existe aperturas_caja para hoy.
 *   2. Venta POS con pagos mixtos (efectivo 60% + tarjeta 40%) sobre 2
 *      artículos del catálogo usando SU medida/precio de articulos_precio,
 *      via VentasService.create (auditoría + folio T-000x reales).
 *   3. Retiro de caja chica [DEMO] (gasolina) coherente con el arqueo.
 *   4. Cotizaciones/bitácoras-renta/nóminas ya tienen variedad en la BD — este
 *      seed NO las duplica (objetivo F6: rellenar lo faltante, no duplicar).
 *
 * Idempotente: idempotencia_key fija 'DEMO-F6-venta-hoy' y retiros con
 * prefijo [DEMO] en concepto — re-corrida no duplica nada.
 *
 * NUNCA correr en producción:
 *   Guarda: falla si NODE_ENV=production salvo DEMO_SEED=permiso.
 *
 * Ejecutar:  npx tsx scripts/seed-demo-workflows.ts
 */
import 'dotenv/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditContextService } from '../src/audit/audit-context.service';
import { AuditService } from '../src/audit/audit.service';
import { VentasService } from '../src/ventas/ventas.service';

const USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed
const VENTA_KEY = 'DEMO-F6-venta-hoy';
const CAJERO = 'Carlos SVR';

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_SEED !== 'permiso') {
    throw new Error('DEMO seed bloqueado en producción (DEMO_SEED=permiso para forzar).');
  }

  const prisma = new PrismaService();
  await prisma.$connect();
  const auditContext = new AuditContextService();
  const auditService = new AuditService(prisma, auditContext);
  const ventas = new VentasService(prisma, auditService);

  // ── 1. Apertura de caja (si falta HOY) ──
  const hoy = new Date();
  const startHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const endHoy = new Date(startHoy.getTime() + 24 * 60 * 60 * 1000);
  const aperturaHoy = await prisma.aperturas_caja.findFirst({
    where: { creado_en: { gte: startHoy, lt: endHoy } },
  });
  if (!aperturaHoy) {
    await ventas.createApertura({ fondoInicial: 5000 }, USER_ID, CAJERO);
    console.log('✔ Apertura de caja creada (fondo 5,000).');
  } else {
    console.log('↺ Apertura ya existe para hoy — skip.');
  }

  // ── 2. Venta POS (2 artículos reales del catálogo, pagos mixtos) ──
  const yaVenta = await prisma.ventas.findUnique({ where: { idempotencia_key: VENTA_KEY } });
  if (yaVenta) {
    console.log(`↺ Venta DEMO ya existe (folio ${yaVenta.folio}, total ${yaVenta.total}) — skip.`);
  } else {
    const articulos = await prisma.articulos_inventario.findMany({
      where: {
        activo: true,
        eliminado_en: null,
        stock: { gt: 0 },
        articulos_precio: { some: {} },
      },
      include: { articulos_precio: { take: 1 } },
      take: 2,
    });
    if (articulos.length < 2) {
      throw new Error('Se necesitan 2 artículos con stock y precio por medida para la venta demo.');
    }

    const items = articulos.map((a) => ({
      materialId: a.id,
      medida: a.articulos_precio[0].medida,
      cantidad: 2,
      precioUnitario: Number(a.articulos_precio[0].precio),
    }));
    // El service valida: totalCobrado === subtotal de líneas (el IVA 16%
    // lo deriva ÉL sobre el cobrado) — por eso los pagos cuadran al subtotal.
    const total = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);
    const efectivo = Math.round(total * 60) / 100;
    const tarjeta = Math.round((total - efectivo) * 100) / 100;

    const res = (await ventas.create(
      {
        cajero: CAJERO,
        cliente: 'P\u00fablico en general',
        terminal: 'TER-01',
        caja: 'CAJA-PV',
        items: items as never,
        pagos: [
          { metodo: 'efectivo', monto: efectivo },
          { metodo: 'tarjeta', monto: tarjeta },
        ] as never,
        metodo: 'efectivo',
        efectivoRecibido: efectivo + 500,
        cambio: 500,
        idempotenciaKey: VENTA_KEY,
      } as never,
      USER_ID,
    )) as unknown as { success?: boolean; error?: { message?: string }; folio?: string };

    if (res?.success === false) {
      console.error('✗ venta DEMO falló:', res.error?.message ?? 'sin detalle');
    } else {
      console.log(`✔ Venta POS DEMO registrada (folio ${res?.folio ?? '?'} · total ${total}).`);
    }
  }

  // ── 3. Retiro de caja chica [DEMO] ──
  const yaRetiro = await prisma.retiros_caja.findFirst({
    where: { concepto: { startsWith: '[DEMO]' }, eliminado_en: null },
  });
  if (yaRetiro) {
    console.log('↺ Retiro [DEMO] ya existe — skip.');
  } else {
    await ventas.createRetiro(
      {
        concepto: '[DEMO] Gasolina operador camioneta',
        monto: 350,
        autorizadoPor: CAJERO,
      } as never,
      USER_ID,
      CAJERO,
    );
    console.log('✔ Retiro de caja chica [DEMO] registrado ($350).');
  }

  // ── Resumen ──
  const ventasHoy = await prisma.ventas.count({ where: { creado_en: { gte: startHoy } } });
  const retirosHoyCt = await prisma.retiros_caja.count();
  console.log(`Resumen BD: ${ventasHoy} ventas hoy · ${retirosHoyCt} retiros · listo para /ventas, /ventas/corte y /cobranza.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('seed-demo-workflows fall\u00f3:', e?.message ?? e);
  process.exit(1);
});
