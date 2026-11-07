import * as fs from 'fs';
import * as path from 'path';

const schemaPath = process.argv[2] || path.join(__dirname, 'prisma', 'schema.prisma');
const lines = fs.readFileSync(schemaPath, 'utf-8').split('\n');

let changed = 0;

const updatedLines = lines.map((line) => {
  const trimmed = line.trim();
  const isFieldLine = /^\w+\s+DateTime/.test(trimmed);
  if (!isFieldLine) {
    return line;
  }

  if (line.includes('@db.')) {
    return line;
  }

  // Caso A: DateTime seguido de espacios y más atributos
  // Caso B: DateTime al final de línea
  const newLine = line.replace(/(DateTime\??)(?=\s|$)/, '$1 @db.Timestamptz()');
  if (newLine !== line) {
    changed++;
  }
  return newLine;
});

fs.writeFileSync(schemaPath, updatedLines.join('\n'));
console.log(`Campos DateTime convertidos a @db.Timestamptz(): ${changed}`);
console.log(`Archivo actualizado: ${schemaPath}`);
