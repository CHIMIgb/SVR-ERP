const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', 'web', 'src');
const scopeDirs = [
  'app/(dashboard)/operaciones', 'app/(dashboard)/criba', 'app/(dashboard)/inventario',
  'app/(dashboard)/proyectos', 'app/(dashboard)/clientes', 'app/(dashboard)/cotizaciones',
  'app/(dashboard)/facturas', 'app/(dashboard)/finanzas', 'app/(dashboard)/cobranza',
  'app/(dashboard)/ventas', 'app/(dashboard)/configuracion', 'app/(dashboard)/reportes',
  'app/(dashboard)/proveedores',
  'components/pos', 'components/finanzas', 'components/layout',
  'components/projects', 'components/workers', 'components/machinery',
];
let list = [];
for (const dir of scopeDirs) {
  const d = path.join(base, dir);
  if (!fs.existsSync(d)) continue;
  const walk = (p0) => {
    for (const e of fs.readdirSync(p0, { withFileTypes: true })) {
      const p = path.join(p0, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx$/.test(e.name)) list.push(p);
    }
  };
  walk(d);
}
// Estandarizar avatar: el fondo negro de claro es bg-secondary (no ui-900 que
// se invierte a claro en dark), con dark:bg-ui-200 — letra blanca visible.
const pares = [
  ['bg-ui-900 text-white', 'bg-secondary dark:bg-ui-200 text-white'],
  ['bg-slate-900 text-white', 'bg-secondary dark:bg-ui-200 text-white'],
];
let total = 0;
for (const f of list) {
  let src = fs.readFileSync(f, 'utf-8');
  let cambios = 0;
  for (const [de, a] of pares) {
    const partes = src.split(de);
    cambios += partes.length - 1;
    src = partes.join(a);
  }
  // excluir explicito el bloque de impresion (ticket)
  if (/ticketPaper/i.test(src) && cambios) { /* igual aplicado ya arriba */ }
  if (cambios) {
    fs.writeFileSync(f, src, 'utf-8');
    console.log(`${f.slice(13)}: ${cambios}`);
    total += cambios;
  }
}
console.log('TOTAL:', total);
