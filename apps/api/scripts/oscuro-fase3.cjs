const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..');

const files = [
  'apps/web/src/app/(dashboard)/finanzas/page.tsx',
  'apps/web/src/components/finanzas/ConciliacionBancaria.tsx',
  'apps/web/src/app/(dashboard)/facturas/page.tsx',
  'apps/web/src/app/(dashboard)/clientes/page.tsx',
  'apps/web/src/app/(dashboard)/cotizaciones/page.tsx',
];

// Fase 3: crudos de claro → tokens que se voltean con .dark (mismo patrón PR #13)
const pares = [
  ['bg-white', 'bg-surface'],
  ['bg-slate-50', 'bg-ui-50'],
  ['bg-slate-100', 'bg-ui-100'],
  ['border-slate-200', 'border-ui-200'],
  ['border-slate-100', 'border-ui-100'],
  ['border-slate-300', 'border-ui-300'],
  ['text-slate-900', 'text-ui-900'],
  ['text-slate-800', 'text-ui-800'],
  ['text-slate-700', 'text-ui-700'],
  ['text-slate-600', 'text-ui-600'],
  ['text-slate-500', 'text-ui-500'],
  ['text-slate-400', 'text-ui-400'],
  ['placeholder:text-slate-600', 'placeholder:text-ui-400'],
];

let totalTodos = 0;
for (const rel of files) {
  const file = path.join(base, ...rel.split('/'));
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
    totalTodos += cambios;
  }
}
console.log(`fase 3 lista — total: ${totalTodos}`);
