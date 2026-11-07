const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'src');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return e.name.endsWith('.service.ts') && !e.name.includes('.spec') ? [p] : [];
  });
}

const results = [];
for (const file of walk(root)) {
  const rel = path.relative(process.cwd(), file);
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/findMany\(/.test(lines[i])) {
      const block = lines.slice(i, i + 14).join(' ');
      if (!/\btake\b/.test(block)) {
        results.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
      }
    }
  }
}
console.log(`findMany SIN take: ${results.length}\n`);
console.log(results.join('\n'));
