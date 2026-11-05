const fs = require('fs');
const path = require('path');
const cssPath = path.join(process.cwd(), '..', '..', 'apps', 'web', '.next', 'dev', 'static', 'chunks', '[root-of-the-server]__0_4c36b._.css');
const css = fs.readFileSync(cssPath, 'utf8');
const lines = css.split('\n');
let found = 0;
for (let i = 0; i < lines.length; i++) {
  if (/bg-white\{|background-color:\s*#fff\b|background:\s*#fff\b/.test(lines[i])) {
    found++;
    const ctxPrev = lines.slice(Math.max(0, i - 3), i).join(' ').slice(-90);
    console.log(`@var línea ${i + (found - found)}:\n  regla: ${lines[i].trim().slice(0, 140)}\n  cerca de: ...${ctxPrev}`);
    if (found > 6) break;
  }
}
console.log('total líneas con blanco sólido:', found);
