const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), '..', '..', 'apps', 'web', 'src');
const scopeDirs = [
  'app/(dashboard)/operaciones', 'app/(dashboard)/criba', 'app/(dashboard)/inventario',
  'app/(dashboard)/proyectos', 'app/(dashboard)/clientes', 'app/(dashboard)/cotizaciones',
  'app/(dashboard)/facturas', 'app/(dashboard)/finanzas', 'app/(dashboard)/cobranza',
  'app/(dashboard)/ventas', 'app/(dashboard)/configuracion',
  'components/pos', 'components/finanzas',
];
const re = /bg-(red|green|blue|orange|amber|yellow|emerald|teal|indigo|purple|pink|rose|violet|sky|lime)-50\b/;
let sinDark = 0;
for (const dir of scopeDirs) {
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(base, d), { withFileTypes: true })) {
      const p = path.join(base, d, e.name);
      if (e.isDirectory()) { walk(path.join(d, e.name)); continue; }
      if (!/\.(tsx|ts)$/.test(e.name)) continue;
      const lines = fs.readFileSync(p, 'utf-8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i]) && !/dark:/.test(lines[i])) {
          sinDark++;
          console.log(`SIN dark → ${path.basename(e.name)}:${i + 1}: ${lines[i].trim().slice(0, 100)}`);
        }
      }
    }
  };
  walk(dir);
}
console.log(`soft-50 SIN dark: ${sinDark}`);
