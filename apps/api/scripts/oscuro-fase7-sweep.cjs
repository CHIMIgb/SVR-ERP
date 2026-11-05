const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..');

const files = [
  'apps/web/src/app/(dashboard)/proyectos/page.tsx',
  'apps/web/src/app/(dashboard)/reportes/page.tsx',
  'apps/web/src/app/(dashboard)/cobranza/page.tsx',
  'apps/web/src/app/(dashboard)/clientes/page.tsx',
  'apps/web/src/app/(dashboard)/criba/page.tsx',
  'apps/web/src/components/ui/DataTable/DataTable.styles.ts',
];

// Regla de migración impresa en globals.css: bg-white → bg-surface, slate-N → ui-N
// (en claro valen lo mismo; en dark el componente/UI se invierte solo).
const grises = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const pares = [['bg-white', 'bg-surface']];
for (const n of grises) {
  pares.push([`slate-${n}`, `ui-${n}`]);
}

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
  fs.writeFileSync(file, src, 'utf-8');
  console.log(`${rel}: ${cambios}`);
}
