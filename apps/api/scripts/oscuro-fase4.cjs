const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..');

const files = [
  'apps/web/src/app/(dashboard)/ventas/page.tsx',
  'apps/web/src/components/pos/CorteCaja.tsx',
  'apps/web/src/components/pos/CartItemRow.tsx',
  'apps/web/src/components/pos/PaymentPanel.tsx',
  'apps/web/src/components/pos/ProductPicker.tsx',
];

// Fase 4: POS y corte — crudos de claro → tokens (los que se voltean con .dark)
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
  ['text-slate-300', 'text-ui-400'],
  ['placeholder:text-slate-600', 'placeholder:text-ui-400'],
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
console.log(`fase 4 lista — total: ${total}`);
