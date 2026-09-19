/**
 * Seed de datos reales para el módulo Proveedores (fase 2).
 *
 * Crea 30 proveedores, 30 órdenes de compra y sus estados de cuenta
 * (CxP + abonos + transacciones EGRESO) reutilizando el ProveedoresService,
 * por lo que folios, transacciones y auditoría siguen la lógica oficial.
 *
 * Distribución de estados de las 30 OC:
 *   8 PENDIENTE · 8 APROBADA · 10 RECIBIDA (5 pagadas, 5 parciales) · 4 CANCELADA
 *
 * Ejecutar:
 *   npx tsx scripts/seed-proveedores.ts
 *
 * Idempotente: elimina (hard) corridas previas identificadas por el prefijo
 * SEED-PROV- en `proveedores.codigo`. Los registros de auditoría son
 * inmutables y se conservan.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditContextService } from '../src/audit/audit-context.service';
import { AuditService } from '../src/audit/audit.service';
import { ProveedoresService } from '../src/proveedores/proveedores.service';
import { EstadoOrdenCompra } from '@prisma/client';

const SEED_PREFIX = 'SEED-PROV-';

type SeedProveedor = {
  nombre: string;
  rfc: string;
  correo: string;
  telefono: string;
  categoria: string;
  descripcion: string;
  monto: number;
};

const seeds: SeedProveedor[] = [
  // ── Refacciones (8) ──
  { nombre: 'Refacciones CAT México', rfc: 'HEC780101T3A', correo: 'cherrera@catmex.com', telefono: '555-1100-01', categoria: 'Refacciones', descripcion: 'Filtros de aceite y aire para excavadora 320D', monto: 18400 },
  { nombre: 'Lubricantes Especializados', rfc: 'RID820505M91', correo: 'drios@lubrispec.com', telefono: '555-1100-02', categoria: 'Refacciones', descripcion: 'Aceite hidráulico SAE 10W x20 galones', monto: 12600 },
  { nombre: 'Michelin México', rfc: 'MOL900828PA7', correo: 'lmorales@michelin.mx', telefono: '555-1100-03', categoria: 'Refacciones', descripcion: 'Llantas 11R22.5 x4 para volteo', monto: 68000 },
  { nombre: 'Transmisiones del Bajío', rfc: 'TRAB910101XK4', correo: 'ventas@transbajio.mx', telefono: '555-1100-04', categoria: 'Refacciones', descripcion: 'Kit de juntas y sellos para transmisión', monto: 27500 },
  { nombre: 'Componentes Daimler', rfc: 'DAIC880303T51', correo: 'cpardo@damler.mx', telefono: '555-1100-05', categoria: 'Refacciones', descripcion: 'Bombas de inyección x2 para motor 6.7L', monto: 45200 },
  { nombre: 'Frenos y Embragues MX', rfc: 'FREM920404XA9', correo: 'srobles@fremx.com', telefono: '555-1100-06', categoria: 'Refacciones', descripcion: 'Balatas de freno y zapatas para flota de volteos', monto: 21750 },
  { nombre: 'Rodamientos del Norte', rfc: 'RODN860505T21', correo: 'mpalacios@rodenorte.mx', telefono: '555-1100-07', categoria: 'Refacciones', descripcion: 'Rodamientos de rueda y caja de velocidades', monto: 15400 },
  { nombre: 'Eléctricos Automotriz GLZ', rfc: 'ELEG950606QH2', correo: 'glozoya@electroglz.mx', telefono: '555-1100-08', categoria: 'Refacciones', descripcion: 'Alternadores y arrancadores remanufacturados', monto: 19800 },
  // ── Combustible (6) ──
  { nombre: 'Diésel del Norte', rfc: 'SAJ911112XK4', correo: 'jsanchez@dieselnorte.com', telefono: '555-2200-01', categoria: 'Combustible', descripcion: 'Suministro de diésel para maquinaria (mes)', monto: 118500 },
  { nombre: 'Combustibles Sierra Madre', rfc: 'COMS870707QA3', correo: 'ocosta@sierramadre.mx', telefono: '555-2200-02', categoria: 'Combustible', descripcion: 'Diésel y aditivos para planta de criba', monto: 96500 },
  { nombre: 'PetroRed Pacífico', rfc: 'PETR930808XA1', correo: 'erencon@petrored.mx', telefono: '555-2200-03', categoria: 'Combustible', descripcion: 'Combustible para flota de maquinaria pesada', monto: 143200 },
  { nombre: 'Gasolineras Villalta', rfc: 'GAVI910909TE3', correo: 'paguilar@gasvillalta.mx', telefono: '555-2200-04', categoria: 'Combustible', descripcion: 'Vales de diésel para brigadas de campo', monto: 54200 },
  { nombre: 'Energía y Lubricantes GO', rfc: 'ENLU880101TE5', correo: 'mgarrido@energylub.mx', telefono: '555-2200-05', categoria: 'Combustible', descripcion: 'Grasas y diésel premium para flota', monto: 38750 },
  { nombre: 'Gas Carburante del Golfo', rfc: 'GACO920202TE7', correo: 'fbelmont@gasgolfo.mx', telefono: '555-2200-06', categoria: 'Combustible', descripcion: 'Diésel UBA para maquinaria en obra', monto: 71200 },
  // ── Materiales (6) ──
  { nombre: 'Aceros y Perfiles Monterrey', rfc: 'ACPM890101P11', correo: 'rquieto@acerosym.mx', telefono: '555-3300-01', categoria: 'Materiales', descripcion: 'Vigas IPR y placa de acero A-36', monto: 186400 },
  { nombre: 'Cementos Cruz Azul Suroccidente', rfc: 'CECU920202P13', correo: 'larcos@cementoscaz.mx', telefono: '555-3300-02', categoria: 'Materiales', descripcion: 'Cemento CPC 40 x300 toneladas', monto: 214800 },
  { nombre: 'Arena y Grava del Río', rfc: 'ARGR930303P15', correo: 'joviedo@arenagravel.mx', telefono: '555-3300-03', categoria: 'Materiales', descripcion: 'Grava 3/4" y arena para concreto', monto: 58700 },
  { nombre: 'Varilla Nacional Siderúrgica', rfc: 'VANS940404P17', correo: 'kdelreal@varillanac.mx', telefono: '555-3300-04', categoria: 'Materiales', descripcion: 'Varilla corrugada No. 4 y No. 6', monto: 142300 },
  { nombre: 'Mallas y Alambres del Centro', rfc: 'MALA950505P19', correo: 'aquliana@mallascentro.mx', telefono: '555-3300-05', categoria: 'Materiales', descripcion: 'Malla electrosoldada 6x6 y alambre recocido', monto: 33400 },
  { nombre: 'Tubos y Conexiones PPS', rfc: 'TUCO860606P21', correo: 'nbarrientos@tubospps.mx', telefono: '555-3300-06', categoria: 'Materiales', descripcion: 'Tubería de acero al carbón ced. 40', monto: 96300 },
  // ── Servicios (6) ──
  { nombre: 'Grúas Hernández', rfc: 'GRHE780707U01', correo: 'ehernandez@gruasher.mx', telefono: '555-4400-01', categoria: 'Servicios', descripcion: 'Renta de grúa 30 ton con operador (días)', monto: 84500 },
  { nombre: 'Mantenimiento Industrial JL', rfc: 'MAIN890808U03', correo: 'jlucio@mantjl.mx', telefono: '555-4400-02', categoria: 'Servicios', descripcion: 'Overhaul de motor y prueba hidrostática', monto: 132600 },
  { nombre: 'Transportes Vizcarra', rfc: 'TRVI900909U05', correo: 'avizcarra@transviz.mx', telefono: '555-4400-03', categoria: 'Servicios', descripcion: 'Fletes de material pétreo a obra', monto: 76200 },
  { nombre: 'Topografía y Geodesia MX', rfc: 'TOGM910101U07', correo: 'sferreyra@topomx.mx', telefono: '555-4400-04', categoria: 'Servicios', descripcion: 'Levantamiento topográfico con dron', monto: 28500 },
  { nombre: 'Seguridad Perimetral OAX', rfc: 'SEGO920202U09', correo: 'rcastillejo@segperim.mx', telefono: '555-4400-05', categoria: 'Servicios', descripcion: 'Vigilancia nocturna de campamento (mes)', monto: 43800 },
  { nombre: 'Laboratorio de Suelos GDL', rfc: 'LABS930303U11', correo: 'mgerman@labgd.mx', telefono: '555-4400-06', categoria: 'Servicios', descripcion: 'Pruebas de compactación y límites de Atterberg', monto: 19600 },
  // ── Otros (4) ──
  { nombre: 'Papelería e Imprenta Oficina', rfc: 'PAIO940404Q01', correo: 'vconcha@papoficina.mx', telefono: '555-5500-01', categoria: 'Otros', descripcion: 'Papelería, planos y formatos para oficina', monto: 9800 },
  { nombre: 'Uniformes Protección AMS', rfc: 'UNPA950505Q03', correo: 'amesquita@uniprotams.mx', telefono: '555-5500-02', categoria: 'Otros', descripcion: 'Equipo de protección personal para brigada', monto: 15350 },
  { nombre: 'Sanitarios Portátiles VRM', rfc: 'SAPO960606Q05', correo: 'quinterols@saportvrm.mx', telefono: '555-5500-03', categoria: 'Otros', descripcion: 'Renta de sanitarios portátiles (mes)', monto: 12400 },
  { nombre: 'Comunicaciones y Radio TET', rfc: 'CORO970707Q07', correo: 'dtototetra@radiocom.mx', telefono: '555-5500-04', categoria: 'Otros', descripcion: 'Radios de dos vías y accesorios', monto: 22100 },
];

const MOTIVOS_CANCELACION = [
  'Error en la requisición de materiales',
  'Cambio de especificaciones por requerimiento de obra',
  'Proveedor no pudo garantizar tiempo de entrega',
  'Duplicidad con orden de compra existente',
];

function fmt(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Fecha de la OC: 30 órdenes espaciadas ~12 días, dentro de los últimos 12 meses. */
function fechaOrden(i: number): Date {
  const base = new Date(2026, 8, 5); // 5 sep 2026
  base.setDate(base.getDate() - i * 12);
  return base;
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const audit = new AuditService(prisma, new AuditContextService());
  const service = new ProveedoresService(prisma, audit);

  const admin = await prisma.users.findFirst({
    where: { email: 'admin@svr-constructora.com' },
    select: { id: true },
  });
  const userId = admin?.id ?? randomUUID();

  // ── 1. Limpieza de corridas previas (idempotencia por prefijo) ──
  const previos = await prisma.proveedores.findMany({
    where: { codigo: { startsWith: SEED_PREFIX } },
    select: { id: true },
  });
  if (previos.length > 0) {
    const provIds = previos.map((p) => p.id);
    const ocPrevias = await prisma.ordenes_compra.findMany({
      where: { proveedor_id: { in: provIds } },
      select: { id: true },
    });
    const ocIds = ocPrevias.map((o) => o.id);
    await prisma.pagos_proveedor.deleteMany({
      where: { orden_compra_id: { in: ocIds } },
    });
    await prisma.transacciones.deleteMany({
      where: { entidad_tipo: 'PROVEEDOR', entidad_id: { in: provIds } },
    });
    await prisma.cuentas_por_pagar.deleteMany({
      where: { proveedor_id: { in: provIds } },
    });
    await prisma.ordenes_compra.deleteMany({
      where: { proveedor_id: { in: provIds } },
    });
    await prisma.proveedores.deleteMany({
      where: { id: { in: provIds } },
    });
    console.log(`Limpieza: ${previos.length} proveedores previos (SEED-PROV-*) eliminados.`);
  }

  // ── 2. Proveedores + órdenes de compra ──
  const creados: { proveedorId: string; ordenId: string; monto: number }[] = [];

  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];

    const prov = await service.create(
      {
        nombre: s.nombre,
        rfc: s.rfc,
        correo: s.correo,
        telefono: s.telefono,
        categoria: s.categoria,
      },
      userId,
    );
    await prisma.proveedores.update({
      where: { id: prov.id },
      data: { codigo: `${SEED_PREFIX}${String(i + 1).padStart(3, '0')}` },
    });

    const orden = await service.createOrden(
      {
        proveedorId: prov.id,
        descripcion: s.descripcion,
        monto: s.monto,
        fecha: fechaOrden(i).toISOString().slice(0, 10),
      },
      userId,
    );

    creados.push({ proveedorId: prov.id, ordenId: orden.id, monto: s.monto });

    if (i % 10 === 0) {
      console.log(`Progreso: proveedor ${i + 1}/${seeds.length} (${prov.nombre})`);
    }
  }

  // ── 3. Estados de las órdenes ──
  let aprobadas = 0;
  let recibidas = 0;
  let pagos = 0;
  let canceladas = 0;

  for (let i = 0; i < creados.length; i++) {
    const { proveedorId, ordenId, monto } = creados[i];
    const diasPago = 3 + (i % 18);
    const fechaPago = new Date(fechaOrden(i));
    fechaPago.setDate(fechaPago.getDate() + diasPago);

    // 8 APROBADA (índices 8–15)
    if (i >= 8 && i <= 15) {
      await service.cambiarEstadoOrden(
        ordenId,
        { estado: EstadoOrdenCompra.APROBADA },
        userId,
      );
      aprobadas++;
    }

    // 10 RECIBIDA (índices 16–25): 5 pagadas en su totalidad, 5 con pago parcial
    if (i >= 16 && i <= 25) {
      await service.cambiarEstadoOrden(
        ordenId,
        { estado: EstadoOrdenCompra.APROBADA },
        userId,
      );
      await service.cambiarEstadoOrden(
        ordenId,
        { estado: EstadoOrdenCompra.RECIBIDA },
        userId,
      );

      const pct = i <= 20 ? 1 : fmt(0.45 + ((i % 5) * 0.06)); // 100% ó 45–69%
      const abono = pct === 1 ? monto : fmt(monto * pct);
      await service.registrarAbono(
        proveedorId,
        {
          ordenCompraId: ordenId,
          monto: abono,
          fechaPago: fechaPago.toISOString().slice(0, 10),
          metodoPago: i % 3 === 0 ? 'TRANSFERENCIA' : i % 3 === 1 ? 'EFECTIVO' : 'TARJETA',
          referencia: pct === 1 ? 'Pago total de orden' : 'Abono parcial',
        },
        userId,
      );
      recibidas++;
      pagos++;
    }

    // 4 CANCELADA (índices 26–29)
    if (i >= 26) {
      await service.cambiarEstadoOrden(
        ordenId,
        {
          estado: EstadoOrdenCompra.CANCELADA,
          motivo: MOTIVOS_CANCELACION[i - 26],
        },
        userId,
      );
      canceladas++;
    }
  }

  // ── 4. Resumen ──
  const [totProv, totOC, totCxp, totPagos, totTx] = await Promise.all([
    prisma.proveedores.count({ where: { codigo: { startsWith: SEED_PREFIX } } }),
    prisma.ordenes_compra.count({ where: { proveedores: { codigo: { startsWith: SEED_PREFIX } } } }),
    prisma.cuentas_por_pagar.count({ where: { proveedores: { codigo: { startsWith: SEED_PREFIX } } } }),
    prisma.pagos_proveedor.count({ where: { proveedores: { codigo: { startsWith: SEED_PREFIX } } } }),
    prisma.transacciones.count({ where: { entidad_tipo: 'PROVEEDOR' } }),
  ]);

  console.log('\n──────────────────────────────────────────────');
  console.log('SEED PROVEEDORES COMPLETADO');
  console.log('──────────────────────────────────────────────');
  console.log(`Proveedores creados:  ${totProv} (30 esperados)`);
  console.log(`Órdenes de compra:    ${totOC} (30 esperadas)`);
  console.log(`   Pendiente: 8 · Aprobada: ${aprobadas} · Recibida: ${recibidas} · Cancelada: ${canceladas}`);
  console.log(`Cuentas por pagar:    ${totCxp}`);
  console.log(`Abonos registrados:   ${pagos} (${totPagos})`);
  console.log(`Transacciones EGRESO: ${totTx} (todas las de proveedores, incl. previas)`);
  console.log('──────────────────────────────────────────────');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});