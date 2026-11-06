const fs = require('fs');
const path = require('path');
const pack = path.join(process.cwd(), 'apps', 'api', 'src', 'proveedores', 'proveedores.service.spec.ts');
const f = fs.readFileSync(pack, 'utf8').replace(/\s+$/, '');
fs.writeFileSync(pack, f + '\n});\n', 'utf8');
console.log('cierre final agregado');
