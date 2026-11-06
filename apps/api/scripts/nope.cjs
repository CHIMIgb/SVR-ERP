const fs = require('fs');
const path = require('path');
const pack = path.join(process.cwd(), 'src', 'proveedores', 'proveedores.service.spec.ts');
let s = fs.readFileSync(pack, 'utf8');
// En el test de linkea: la entrada es del artículo ya existente → altaNueva false
s = s.replace(
  `    expect(res.inventario[0].altaNueva).toBe(false);
  });

  it('respeta el alta explicita cuando el nombre NO existe en el catálogo'`,
  `    expect(res.inventario[0].altaNueva).toBe(false);
  });

  it('respeta el alta explicita cuando el nombre NO existe en el catálogo'`,
);
console.log('noop');
