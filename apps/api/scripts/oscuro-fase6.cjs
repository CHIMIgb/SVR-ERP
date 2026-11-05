const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..');

const files = [
  'apps/web/src/app/(dashboard)/cotizaciones/page.tsx',
  'apps/web/src/app/(dashboard)/cobranza/page.tsx',
  'apps/web/src/app/(dashboard)/ventas/page.tsx',
  'apps/web/src/components/pos/CartItemRow.tsx',
  'apps/web/src/components/pos/CorteCaja.tsx',
  'apps/web/src/components/pos/pos.styles.ts',
];

// Fase 6: soft-colors restantes del alcance — solo AÑADIR pares dark:
const pares = [
  ['bg-red-50 border border-red-200 rounded-xl', 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl'],
  ['bg-green-50 border border-green-100 p-3', 'bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-3'],
  ['bg-red-50 border border-red-100 p-3', 'bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3'],
  ['hover:bg-red-50 transition-colors', 'hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors'],
  ['bg-amber-50 border border-amber-200 px-4 py-3', 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3'],
  ['bg-red-50 border border-red-200 rounded-2xl', 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl'],
  ['bg-red-50 text-red-500 rounded-xl', 'bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl'],
  ['hover:bg-red-50 transition-colors shrink-0', 'hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0'],
  ["'bg-amber-50 border-amber-200 text-amber-700'", "'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300'"],
  ["'bg-blue-50 border-blue-200 text-blue-700'", "'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300'"],
  ["'bg-red-50 border-red-200 text-red-700 mt-2'", "'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 mt-2'"],
  ['bg-amber-50 border border-amber-200 rounded-xl', 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl'],
];

let total = 0;
for (const rel of files) {
  const file = path.join(base, ...rel.split('/'));
  if (!fs.existsSync(file)) { console.log(`NO EXISTE: ${rel}`); continue; }
  let src = fs.readFileSync(file, 'utf-8');
  let cambios = 0;
  for (const [de, a] of pares) {
    const partes = src.split(de);
    cambios += partes.length - 1;
    src = partes.join(a);
  }
  if (cambios) {
    fs.writeFileSync(file, src, 'utf-8');
    console.log(`${rel}: ${cambios}`);
    total += cambios;
  }
}
console.log(`fase 6 lista — total: ${total}`);
