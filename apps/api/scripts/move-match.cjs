const fs = require('fs');
const path = require('path');
const pack = path.join(process.cwd(), 'apps', 'api', 'src', 'proveedores', 'proveedores.service.spec.ts');
let lines = fs.readFileSync(pack, 'utf8').split('\n');

// cortar el bloque top-level desde la línea del comentario de linkea hasta el cierre final
let cutStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('linkea por nombre')) { cutStart = i; break; }
}
// el bloque corre desde cutStart hasta el final del archivo; retroceder 1 línea
// (la línea en blanco previa se conserva) y extraer el contenido útil
const bloque = lines.slice(cutStart, lines.length - 1); // quitar el último '});' de cierre del archivo
// restar la primera línea en vacía si corresponde
lines = lines.slice(0, cutStart - 1); // quitar bloque + línea vacía previa + el '});' del archivo

// insertar el bloque ANTES del cierre del outer describe: el outer cierra con la última '});'
// disponible tras el recorte (hasta aquí el status: depth 1 al final)
// localizar la última línea '  });' (cierre de la última describe interna)
let outerClose = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === '});') { outerClose = i; break; }
}
lines = [...lines.slice(0, outerClose), ...bloque, ...lines.slice(outerClose)];
fs.writeFileSync(pack, lines.join('\n'), 'utf8');
console.log('bloque movido dentro del outer describe; final:');
const t = fs.readFileSync(pack, 'utf8').split('\n');
for (let j = t.length - 4; j < t.length; j++) console.log(j + 1 + ': ' + t[j]);
