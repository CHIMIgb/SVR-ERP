const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..', 'apps', 'web', 'src', 'app', '(dashboard)');

const files = [
  'reportes/page.tsx',
  'operaciones/page.tsx',
  'criba/page.tsx',
  'inventario/page.tsx',
  'proyectos/page.tsx',
  'clientes/page.tsx',
  'cotizaciones/page.tsx',
  'facturas/page.tsx',
  'finanzas/page.tsx',
  'cobranza/page.tsx',
  'ventas/page.tsx',
  'ventas/cierres/page.tsx',
  'ventas/corte/page.tsx',
];

const mapas = [
  ['bg-slate-50 border border-slate-200 rounded-xl p-4', 'bg-ui-50 border border-ui-200 rounded-xl p-4'],
  ['h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary/50', 'h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50'],
];

let total = 0;
for (const rel of files) {
  const file = path.join(base, ...rel.split('/'));
  let src = fs.readFileSync(file, 'utf-8');
  let cambios = 0;
  for (const [de, a] of mapas) {
    const partes = src.split(de);
    cambios += partes.length - 1;
    src = partes.join(a);
  }
  if (cambios) {
    fs.writeFileSync(file, src, 'utf-8');
    console.log(`${rel}: ${cambios} reemplazos`);
    total += cambios;
  }
}
console.log(`fase 1 lista — total: ${total}`);
