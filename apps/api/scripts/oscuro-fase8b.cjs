const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..');
const files = [
  'apps/web/src/app/(dashboard)/proveedores/page.tsx',
  // controladores compartidos que pinto proveedores (por si acaso del alcance)
  'apps/web/src/components/ui/Avatar/Avatar.styles.ts',
];
// Regla de migración de globals.css: bg-white → bg-surface, slate-N → ui-N
const grises = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const pares = [['bg-white', 'bg-surface'], ['border-white', 'border-surface']];
for (const n of grises) pares.push([`slate-${n}`, `ui-${n}`]);

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
