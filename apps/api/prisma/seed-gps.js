/**
 * Seed del módulo de GPS: geocercas de operación + un historial inicial de
 * posiciones para que la vista de rastreo tenga datos reales que mostrar.
 *
 * Va por el cliente de Prisma (no por SQL crudo) a propósito: el adaptador de
 * Prisma escribe y lee las marcas de tiempo con su propia convención, así que
 * insertar por otra vía deja los pings desfasados y la vista los muestra como
 * "sin señal".
 *
 * Es idempotente: las geocercas se insertan por nombre sólo si no existen, y
 * el historial sólo se genera para máquinas que todavía no tienen pings.
 *
 * Uso: node prisma/seed-gps.js
 */
require('dotenv').config();
const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Centro de operaciones de referencia (CDMX), igual que el alta de maquinaria.
const BASE_LAT = 19.4326;
const BASE_LNG = -99.1332;

const GEOCERCAS = [
  { nombre: 'Obra Norte - Torre Insignia', tipo: 'OBRA', color: '#3b82f6', dLat: 0.012, dLng: 0.008, radio: 450 },
  { nombre: 'Obra Sur - Vialidad Tlalpan', tipo: 'OBRA', color: '#22c55e', dLat: -0.015, dLng: 0.004, radio: 600 },
  { nombre: 'Patio de Maquinaria SVR', tipo: 'PATIO', color: '#f59e0b', dLat: 0.002, dLng: -0.009, radio: 300 },
  { nombre: 'Estación de Diesel Xochimilco', tipo: 'ESTACION', color: '#8b5cf6', dLat: -0.004, dLng: -0.012, radio: 200 },
  { nombre: 'Zona Prohibida - Ducto PEMEX', tipo: 'PROHIBIDA', color: '#ef4444', dLat: 0.02, dLng: -0.018, radio: 800 },
];

/** Cuántos pings históricos generar por máquina (uno cada 5 min hacia atrás). */
const PINGS_POR_MAQUINA = 24;
const MINUTOS_ENTRE_PINGS = 5;

function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    // ── 1. Geocercas ──────────────────────────────
    let geocercasCreadas = 0;
    for (const g of GEOCERCAS) {
      const existe = await prisma.geocercas.findFirst({
        where: { nombre: g.nombre, eliminado_en: null },
        select: { id: true },
      });
      if (existe) continue;

      await prisma.geocercas.create({
        data: {
          id: randomUUID(),
          nombre: g.nombre,
          tipo: g.tipo,
          color: g.color,
          centro_lat: BASE_LAT + g.dLat,
          centro_lng: BASE_LNG + g.dLng,
          radio_metros: g.radio,
          activa: true,
          actualizado_en: new Date(),
        },
      });
      geocercasCreadas++;
    }
    console.log(`Geocercas: ${geocercasCreadas} creadas, ${GEOCERCAS.length - geocercasCreadas} ya existían.`);

    // ── 2. Historial de posiciones ────────────────
    const maquinas = await prisma.maquinas.findMany({
      where: { eliminado_en: null, activo: true },
      select: { id: true, codigo: true, estado: true, horometro: true },
      orderBy: { codigo: 'asc' },
    });

    if (maquinas.length === 0) {
      console.log('No hay máquinas activas; no se generó historial de GPS.');
      return;
    }

    let maquinasConHistorial = 0;
    let pingsInsertados = 0;

    for (let i = 0; i < maquinas.length; i++) {
      const m = maquinas[i];

      const yaTiene = await prisma.rastreo_gps.findFirst({ where: { maquina_id: m.id }, select: { id: true } });
      if (yaTiene) continue;

      // Cada máquina arranca cerca de una geocerca distinta, para que la vista
      // muestre reparto realista (unas dentro de obra, otras en patio/estación).
      const anclaje = GEOCERCAS[i % GEOCERCAS.length];
      let lat = BASE_LAT + anclaje.dLat + (Math.random() - 0.5) * 0.003;
      let lng = BASE_LNG + anclaje.dLng + (Math.random() - 0.5) * 0.003;
      let heading = Math.random() * 360;
      let horometro = Number(m.horometro) || 0;

      const detenida = m.estado === 'MANTENIMIENTO' || m.estado === 'APAGADA';
      const filas = [];

      for (let p = PINGS_POR_MAQUINA - 1; p >= 0; p--) {
        const fecha = new Date(Date.now() - p * MINUTOS_ENTRE_PINGS * 60000);
        const velocidad = detenida ? 0 : Math.round(5 + Math.random() * 35);

        if (velocidad > 0) {
          heading = (heading + (Math.random() * 40 - 20) + 360) % 360;
          const metros = (velocidad * 1000 * MINUTOS_ENTRE_PINGS) / 60;
          const rad = (heading * Math.PI) / 180;
          lat += (metros * Math.cos(rad)) / 111320;
          lng += (metros * Math.sin(rad)) / (111320 * Math.cos((lat * Math.PI) / 180));
          horometro += (MINUTOS_ENTRE_PINGS / 60) * 0.8;
        }

        filas.push({
          id: randomUUID(),
          maquina_id: m.id,
          fecha_hora: fecha,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          velocidad_kmh: velocidad,
          heading: Number(heading.toFixed(2)),
          precision_metros: Number((3 + Math.random() * 5).toFixed(2)),
          ignition: !detenida,
          horometro: Number(horometro.toFixed(2)),
          temperatura_motor: detenida
            ? Number((20 + Math.random() * 10).toFixed(2))
            : Number((70 + Math.random() * 25).toFixed(2)),
          proveedor_gps: 'SIMULADO',
        });
      }

      await prisma.rastreo_gps.createMany({ data: filas });
      pingsInsertados += filas.length;

      // La posición de cabecera de la máquina queda en su último punto.
      await prisma.maquinas.update({
        where: { id: m.id },
        data: { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), actualizado_en: new Date() },
      });

      maquinasConHistorial++;
    }

    console.log(`Rastreo: ${pingsInsertados} posiciones para ${maquinasConHistorial} máquinas (el resto ya tenía historial).`);

    // ── 3. Estado inicial de cruces de geocerca ───
    const geocercas = await prisma.geocercas.findMany({
      where: { eliminado_en: null, activa: true },
      select: { id: true, nombre: true, centro_lat: true, centro_lng: true, radio_metros: true },
    });

    const ahora = new Date();
    let cruces = 0;

    for (const m of maquinas) {
      const ultimo = await prisma.rastreo_gps.findFirst({
        where: { maquina_id: m.id, activo: true },
        orderBy: { fecha_hora: 'desc' },
        select: { lat: true, lng: true },
      });
      if (!ultimo) continue;

      for (const g of geocercas) {
        const dentro =
          distanciaMetros(Number(ultimo.lat), Number(ultimo.lng), Number(g.centro_lat), Number(g.centro_lng)) <=
          Number(g.radio_metros);
        if (!dentro) continue;

        const ya = await prisma.geocerca_maquinas.findFirst({
          where: { geocerca_id: g.id, maquina_id: m.id },
          select: { id: true },
        });
        if (ya) continue;

        await prisma.geocerca_maquinas.create({
          data: { id: randomUUID(), geocerca_id: g.id, maquina_id: m.id, dentro: true, ultima_entrada: ahora },
        });
        cruces++;
      }
    }
    console.log(`Geocercas: ${cruces} máquinas registradas como "dentro" al momento del seed.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
