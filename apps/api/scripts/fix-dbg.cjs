const fs = require('fs');
const PAGE = 'apps/web/src/app/(dashboard)/proveedores/page.tsx';
let s = fs.readFileSync(PAGE, 'utf8');

// replace handleGuardarProveedor (RFC check) again with correct spacing
const guardOld = s.match(/const handleGuardarProveedor = async\(\) => \{[\s\S]{0,80}/); // dummy
// Find the RFC validation closure that got inserted weirdly
console.log('space check rfc:', s.includes('  }\n  const rfc = provForm.rfc.trim().toUpperCase();') || 'no');

fs.writeFileSync(PAGE, s, 'utf8');
