const fs = require('fs');
const path = require('path');
const cssPath = path.join(process.cwd(), '..', '..', 'apps', 'web', '.next', 'dev', 'static', 'chunks', '[root-of-the-server]__0_4c36b._.css');
const css = fs.readFileSync(cssPath, 'utf8');
const flat = css.replace(/\s+/g, ''); // sin espacios: .dark{--color-...
const darkBlockRe = /\.dark\{([^{}]{0,3000})\}/g;
let bloques = [];
let m;
while ((m = darkBlockRe.exec(flat))) bloques.push(m[1]);
console.log('bloques .dark en el CSS servido:', bloques.length);
console.log('define --color-surface #1e293b:', bloques.some((b) => b.includes('--color-surface:#1e293b')));
console.log('define --color-ui-100 #243146:', bloques.some((b) => b.includes('--color-ui-100:#243146')));
console.log('´variante utilizada bg-surface voltea:', /\.bg-surface\{background-color:var\(--color-surface\)/.test(flat) || flat.includes('.bg-surface{background-color:var(--color-surface)'));
console.log('bg-white residual en CSS:', flat.includes('background-color:#fff') || /bg-white\{/.test(flat));
