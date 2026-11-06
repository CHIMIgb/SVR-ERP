const fs = require('fs');
const path = require('path');
const pack = path.join(process.cwd(), 'apps', 'api', 'src', 'proveedores', 'proveedores.service.spec.ts');
let lines = fs.readFileSync(pack, 'utf8').split('\n');

// 2 fix: findMany mock dentro de articulos_inventario (causaba TypeError tx.findMany)
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('      articulos_inventario: {') && !lines[i + 1].includes('findMany')) {
    lines.splice(i + 1, 0, "        findMany: jest.fn().mockResolvedValue([]),");
    fixed++;
    break;
  }
}

// Quitar el cierre final extra si depth queda negativo al final (debería estar balanceado en HEAD)
fs.writeFileSync(pack, lines.join('\n'), 'utf8');
console.log('fixes aplicados: ', fixed);
