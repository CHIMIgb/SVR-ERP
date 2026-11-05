const fs = require('fs');
const path = require('path');
const srcRoot = path.join(process.cwd(), 'src');

const targets = [
  'asistencia.service.ts',
  'bitacora.service.ts',
  'criba.service.ts',
  'inventario.service.ts',
  'proyectos.service.ts',
  'clientes.service.ts',
  'cotizaciones.service.ts',
  'facturas.service.ts',
  'finanzas.service.ts',
  'proveedores.service.ts',
  'ventas.service.ts',
  'cobranza.service.ts',
  'conciliacion-bancaria.service.ts',
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return targets.includes(e.name) ? [p] : [];
  });
}

for (const file of walk(srcRoot)) {
  const rel = path.relative(process.cwd(), file);
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  let method = '(module-scope)';
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/async (\w+)\(/);
    if (m) method = m[1];
    if (/findMany\(/.test(lines[i])) {
      const block = lines.slice(i, i + 14).join(' ');
      console.log(`${path.basename(file)} :: metodo=${method} :: linea ${i + 1} :: ${/\btake\b/.test(block) ? 'PAGINADO' : 'SIN-TAKE'}`);
    }
  }
}
