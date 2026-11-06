const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src', 'proveedores', 'proveedores.service.spec.ts');
let lines = fs.readFileSync(p, 'utf8').split('\n');
// eliminar la línea 901 (extra '});')
if (lines[900] && lines[900].trim() === '});') {
  lines.splice(900, 1);
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
  console.log('linha 901 extra eliminada');
} else {
  console.log('line 901:', JSON.stringify(lines[900]));
}
const out = fs.readFileSync(p, 'utf8').split('\n');
for (let j = out.length - 4; j < out.length; j++) console.log(j + 1 + ': ' + out[j]);
