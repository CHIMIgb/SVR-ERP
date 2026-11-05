const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..', 'apps', 'web', 'src', 'app', '(dashboard)');

const files = ['inventario/page.tsx', 'reportes/page.tsx', 'ventas/corte/page.tsx', 'configuracion/page.tsx'];

// Fase 2: banners/alertas — solo añadir contrapartes dark: (patrón del PR #13)
const pares = [
  ['bg-red-50 border border-red-100 rounded-2xl', 'bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl'],
  ['bg-red-50 border border-red-200 rounded-2xl', 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl'],
  ['bg-amber-50 border-amber-200', 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'],
  ['text-red-900', 'text-red-900 dark:text-red-300'],
  ['text-red-800', 'text-red-800 dark:text-red-300'],
  ['text-red-700', 'text-red-700 dark:text-red-400'],
  ['text-amber-900', 'text-amber-900 dark:text-amber-300'],
  ['text-amber-800', 'text-amber-800 dark:text-amber-300'],
  ['bg-red-100 rounded', 'bg-red-100 dark:bg-red-500/15 rounded'],
  ['bg-amber-100 rounded', 'bg-amber-100 dark:bg-amber-500/15 rounded'],
];

for (const rel of files) {
  const file = path.join(base, ...rel.split('/'));
  let src = fs.readFileSync(file, 'utf-8');
  let total = 0;
  for (const [de, a] of pares) {
    const partes = src.split(de);
    total += partes.length - 1;
    src = partes.join(a);
  }
  fs.writeFileSync(file, src, 'utf-8');
  console.log(`${rel}: ${total}`);
}
