import { PrismaClient, TipoTransaccion } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

/** Marca para identificar los registros de este seed (idempotencia). */
const SEED_TAG = 'SEED_FINANZAS';

type Seed = {
  tipo: TipoTransaccion;
  categoria: string;
  otraCategoria?: string;
  monto: number;
  fecha: string;
  descripcion: string;
};

const seeds: Seed[] = [
  { tipo: 'INGRESO', categoria: 'Anticipo de Cliente', monto: 185000, fecha: '2026-08-05', descripcion: 'Anticipo del 50% obra privada Residencial Altamira' },
  { tipo: 'EGRESO', categoria: 'Nómina', monto: 64200, fecha: '2026-08-07', descripcion: 'Nómina quincenal cuadrilla albañilería' },
  { tipo: 'EGRESO', categoria: 'Combustible', monto: 12800, fecha: '2026-08-11', descripcion: 'Diesel retroexcavadora CAT 420 (2,000 lts)' },
  { tipo: 'INGRESO', categoria: 'Venta de Material', monto: 23400, fecha: '2026-08-12', descripcion: 'Venta de sobrante de varilla y block' },
  { tipo: 'EGRESO', categoria: 'Pago de Obra', monto: 94000, fecha: '2026-08-14', descripcion: 'Pago a subcontrato de estructuras' },
  { tipo: 'INGRESO', categoria: 'Renta de Maquinaria', monto: 56000, fecha: '2026-08-15', descripcion: 'Renta mensual excavadora Komatsu PC200' },
  { tipo: 'EGRESO', categoria: 'Mantenimiento', monto: 8900, fecha: '2026-08-16', descripcion: 'Servicio de mantenimiento preventivo grúa' },
  { tipo: 'EGRESO', categoria: 'Refacciones', monto: 15200, fecha: '2026-08-18', descripcion: 'Filtros y bandas para motoconformadora' },
  { tipo: 'INGRESO', categoria: 'Pago de Obra', monto: 120000, fecha: '2026-08-19', descripcion: 'Estimación 3 obra planta tratadora' },
  { tipo: 'EGRESO', categoria: 'Servicios', monto: 4100, fecha: '2026-08-20', descripcion: 'Recibo CFE obra norte' },
  { tipo: 'EGRESO', categoria: 'Impuestos', monto: 21500, fecha: '2026-08-21', descripcion: 'IMSS y SAR del periodo' },
  { tipo: 'INGRESO', categoria: 'Anticipo de Cliente', monto: 96000, fecha: '2026-08-22', descripcion: 'Anticipo para inicio de fraccionamiento Los Pinos' },
  { tipo: 'EGRESO', categoria: 'Otros', otraCategoria: 'Renta de andamios', monto: 6800, fecha: '2026-08-23', descripcion: 'Renta mensual de andamios y escaleras' },
  { tipo: 'EGRESO', categoria: 'Nómina', monto: 64800, fecha: '2026-08-24', descripcion: 'Nómina quincenal personal de obra' },
  { tipo: 'INGRESO', categoria: 'Venta de Material', monto: 18900, fecha: '2026-08-25', descripcion: 'Venta de cemento y mortero sobrante' },
  { tipo: 'EGRESO', categoria: 'Combustible', monto: 11400, fecha: '2026-08-26', descripcion: 'Combustible camiones de volteo' },
  { tipo: 'EGRESO', categoria: 'Pago de Obra', monto: 72000, fecha: '2026-08-26', descripcion: 'Pago a subcontrato de muros y acabados' },
  { tipo: 'INGRESO', categoria: 'Renta de Maquinaria', monto: 48000, fecha: '2026-08-27', descripcion: 'Renta de revolvedora y compactadora' },
  { tipo: 'EGRESO', categoria: 'Servicios', monto: 3300, fecha: '2026-08-28', descripcion: 'Agua potable y drenaje obra' },
  { tipo: 'EGRESO', categoria: 'Mantenimiento', monto: 15200, fecha: '2026-08-28', descripcion: 'Cambio de llantas y balatas camioneta de obra' },
  { tipo: 'INGRESO', categoria: 'Venta de Material', monto: 27600, fecha: '2026-08-29', descripcion: 'Venta de agregados y arena' },
  { tipo: 'EGRESO', categoria: 'Impuestos', monto: 9800, fecha: '2026-08-29', descripcion: 'Predial e impuestos municipales' },
  { tipo: 'EGRESO', categoria: 'Refacciones', monto: 7400, fecha: '2026-08-30', descripcion: 'Refacciones motor bomba de agua' },
  { tipo: 'INGRESO', categoria: 'Pago de Obra', monto: 154000, fecha: '2026-08-30', descripcion: 'Estimación 4 obra puente vehicular' },
  { tipo: 'EGRESO', categoria: 'Nómina', monto: 66100, fecha: '2026-08-31', descripcion: 'Nómina fin de mes personal administrativo y obra' },
  { tipo: 'EGRESO', categoria: 'Combustible', monto: 13200, fecha: '2026-09-01', descripcion: 'Combustible maquinaria pesada semanal' },
  { tipo: 'INGRESO', categoria: 'Anticipo de Cliente', monto: 140000, fecha: '2026-09-02', descripcion: 'Anticipo obra de pavimentación' },
  { tipo: 'EGRESO', categoria: 'Pago de Obra', monto: 88000, fecha: '2026-09-03', descripcion: 'Pago a subcontrato de instalaciones eléctricas' },
  { tipo: 'EGRESO', categoria: 'Otros', otraCategoria: 'Renta de contenedores', monto: 5200, fecha: '2026-09-04', descripcion: 'Renta de contenedores para disposición de residuos' },
  { tipo: 'INGRESO', categoria: 'Venta de Material', monto: 21000, fecha: '2026-09-05', descripcion: 'Venta de material de demolición reciclado' },
];

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:admin123@localhost:5432/svr_erp';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Limpia corridas previas del seed para no duplicar
    const borrados = await prisma.transacciones.deleteMany({ where: { entidad_tipo: SEED_TAG } });

    let creados = 0;
    for (const s of seeds) {
      const ymd = s.fecha.replace(/-/g, '');
      await prisma.transacciones.create({
        data: {
          id: randomUUID(),
          codigo: `TRA-${ymd}-${randomUUID().slice(0, 6).toUpperCase()}`,
          tipo: s.tipo,
          categoria: s.categoria,
          otra_categoria: s.otraCategoria,
          monto: s.monto,
          fecha: new Date(s.fecha),
          descripcion: s.descripcion,
          entidad_tipo: SEED_TAG,
          actualizado_en: new Date(),
        },
      });
      creados++;
    }

    const total = await prisma.transacciones.count();
    console.log(
      `Finanzas seed: ${borrados.count} borrados (previos), ${creados} creados. Total en tabla transacciones: ${total}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
