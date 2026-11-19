// Anonimiza los datos de negocio del dump que usa el workflow de integración.
// El repo es público: no debe contener nombres, correos ni RFC reales de demo.
// Determinista por fila e idempotente: se puede volver a ejecutar sin cambiar el resultado.
const fs = require('fs');
const path = require('path');

const RUTA = process.argv[2] || path.resolve(__dirname, '../../../svr_erp_export/svr_erp_sin_postgis.sql');
const CORREO_DEMO = '@svr-constructora.com';
const pad = (n, ancho) => String(n).padStart(ancho, '0');

const CAMPOS = {
  clientes: {
    nombre: (n) => `DEMO Cliente ${n}`,
    empresa: (n) => `DEMO Empresa ${n}`,
    correo: (n) => `cliente${n}@ejemplo.invalid`,
    telefono: (n) => `DEMO5550${pad(n, 4)}`,
    direccion_fiscal: (n) => `DEMO Calle ${n}`,
    rfc: (n) => `DEMO${pad(n, 8)}`,
  },
  personas: {
    nombre: (n) => `DEMO Persona ${n}`,
    apellido_paterno: () => 'DEMO Paterno',
    apellido_materno: () => 'DEMO Materno',
    rfc: (n) => `DEMO${pad(n, 8)}`,
    curp: (n) => `DEMO${pad(n, 14)}`,
    correo: (n) => `persona${n}@ejemplo.invalid`,
    telefono: (n) => `DEMO5551${pad(n, 4)}`,
    direccion: (n) => `DEMO Calle ${n}`,
    avatar_url: (n) => `https://ejemplo.invalid/avatar/${n}.png`,
  },
  proveedores: {
    nombre: (n) => `DEMO Proveedor ${n}`,
    rfc: (n) => `DEMO${pad(n, 8)}`,
    correo: (n) => `proveedor${n}@ejemplo.invalid`,
    telefono: (n) => `DEMO5552${pad(n, 4)}`,
    direccion: (n) => `DEMO Calle ${n}`,
  },
  proyectos: {
    nombre: (n) => `DEMO Proyecto ${n}`,
    calle: (n) => `DEMO Calle ${n}`,
    colonia: () => 'DEMO Colonia',
    ciudad: () => 'DEMO Ciudad',
    estado_ubicacion: () => 'DEMO Estado',
    codigo_postal: () => '00000',
    municipio: () => 'DEMO Municipio',
  },
  obras: {
    ubicacion: (n) => `DEMO Obra ${n}`,
  },
  trabajadores: {
    nombre: (n) => `DEMO Trabajador ${n}`,
    telefono: (n) => `DEMO5553${pad(n, 4)}`,
  },
  reportes_campo: {
    usuario: (n) => `DEMO Reportante ${n}`,
    asignado_nombre: (n) => `DEMO Asignado ${n}`,
    obra_texto: (n) => `DEMO Obra ${n}`,
  },
  firmas_cliente: {
    nombre_residente: (n) => `DEMO Residente ${n}`,
    cargo_residente: () => 'DEMO Residente de Obra',
  },
  users: {
    email: (n) => `usuario${n}@ejemplo.invalid`,
  },
};

const yaAnonimo = (valor) =>
  valor === '\\N' ||
  valor.startsWith('DEMO') ||
  valor.includes('ejemplo.invalid') ||
  valor === '00000';

const conservar = (campo, valor) =>
  (campo === 'correo' || campo === 'email') &&
  valor.toLowerCase().endsWith(CORREO_DEMO);

const texto = fs.readFileSync(RUTA, 'utf8');
const lineas = texto.split('\n');
const consecutivos = {};
const reemplazos = {};
let tabla = null;
let indices = null;

const salida = lineas.map((linea) => {
  const copia = linea.match(/^COPY public\.(\w+) \(([^)]*)\) FROM stdin;$/);
  if (copia) {
    tabla = CAMPOS[copia[1]] ? copia[1] : null;
    indices = tabla
      ? Object.fromEntries(copia[2].split(', ').map((nombre, i) => [nombre, i]))
      : null;
    return linea;
  }
  if (linea === '\\.') {
    tabla = null;
    indices = null;
    return linea;
  }
  if (!tabla || !linea.includes('\t')) return linea;

  consecutivos[tabla] = (consecutivos[tabla] || 0) + 1;
  const n = consecutivos[tabla];
  const columnas = linea.split('\t');
  for (const [campo, generar] of Object.entries(CAMPOS[tabla])) {
    const i = indices[campo];
    if (i === undefined) continue;
    const valor = columnas[i];
    if (yaAnonimo(valor) || conservar(campo, valor)) continue;
    columnas[i] = generar(n);
    reemplazos[`${tabla}.${campo}`] = (reemplazos[`${tabla}.${campo}`] || 0) + 1;
  }
  return columnas.join('\t');
});

fs.writeFileSync(RUTA, salida.join('\n'), 'utf8');
console.log(`Dump anonimizado: ${RUTA}`);
for (const [clave, total] of Object.entries(reemplazos)) {
  console.log(`  ${clave}: ${total}`);
}
