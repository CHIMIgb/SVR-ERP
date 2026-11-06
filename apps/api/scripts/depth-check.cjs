const fs = require('fs');
const path = require('path');
const pack = path.join(process.cwd(), 'src', 'proveedores', 'proveedores.service.spec.ts');
let lines = fs.readFileSync(pack, 'utf8').split('\n');
let depth = 0;
let firstNeg = -1;
let lastZero = -1;
for (let i = 0; i < lines.length; i++) {
  const o = (lines[i].match(/\{/g) || []).length;
  const c = (lines[i].match(/\}/g) || []).length;
  depth += o - c;
  if (depth === 0 && lastZero === -1) lastZero = i;
  if (depth < 0 && firstNeg === -1) firstNeg = i;
}
console.log('depth final:', depth);
console.log('primer depth<0 línea:', firstNeg + 1);
console.log('depth==0 línea:', lastZero + 1);
for (let j = Math.max(0, lastZero - 4); j < Math.min(lines.length, lastZero + 3); j++) console.log(j + 1 + ': ' + lines[j]);
