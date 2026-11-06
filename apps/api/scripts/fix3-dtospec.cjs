const fs = require('fs');
const path = require('path');
const pack = path.join(process.cwd(), 'apps', 'api', 'src', 'proveedores', 'dto', 'create-orden-compra.dto.spec.ts');
let s = fs.readFileSync(pack, 'utf8').replace(/\s+$/, '');
s = s.replace(/  it\('rechaza articuloId malformado \(no hex-36\)', async \(\) => \{[\s\S]*?\n  \}\);/,
`  it('rechaza articuloId malformado (no hex-36) — constraint en grandchild', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, {
      ...base,
      items: [item({ articuloId: 'no-es-uuid' })],
    });
    const errors = await validate(dto);
    const itemsError = errors.find((e) => e.property === 'items');
    expect(itemsError).toBeTruthy();
    // El constraint vive a nivel grandchild: items → 0 → articuloId
    const str = JSON.stringify(itemsError?.children);
    expect(str).toContain('articuloId debe ser un UUID');
  });`);
fs.writeFileSync(pack, s, 'utf8');
console.log('test de articuloId corregido');
