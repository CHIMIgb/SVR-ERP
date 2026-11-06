const fs = require('fs');
const path = require('path');
const pack = path.join(process.cwd(), 'apps', 'api', 'src', 'proveedores', 'proveedores.service.spec.ts');
let lines = fs.readFileSync(pack, 'utf8').split('\n');
// quitar líneas vacías al final
while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
// el archivo debe terminar con:  (alto it)  ... });  (outer describ cierre) (cierre final)
// falta el cierre del outer describe y el cierre final del archivo:
lines.push('  });'); // cierra el outer describe
lines.push('});'); // cierra el archivo
fs.writeFileSync(pack, lines.join('\n'), 'utf8');
console.log('cierre agregado; últimas líneas:');
const finalLines = fs.readFileSync(pack, 'utf8').split('\n');
for (let j = finalLines.length - 5; j < finalLines.length; j++) console.log(j + 1 + ': ' + finalLines[j]);
