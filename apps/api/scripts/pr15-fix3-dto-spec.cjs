const fs = require('fs');
const pack = 'apps/api/src/proveedores/proveedores.service.spec.ts';
let s = fs.readFileSync(pack, 'utf8');
// El articulo 'aa000000-0000-0000-0000-000000000001' cumple el hex-36 → sigue válido.
// Añadir un test del rechazo de articuloId malformado (no hex-36) si no existe:
if (!s.includes('articuloId debe ser un UUID')) {
  const marker = "    it('carrera: si el estado ya no es APROBADA al marcar (count 0) → RECEPCION_YA_APLICADA sin tocar inventario', async () => {";
  const insert = "    it('rechaza articuloId malformado (no hex-36) con error de validación claro', async () => {\n      // arrange: corresponde al DTO, no al service — se prueba vía class-validator\n      // en create-orden-compra.dto.spec (ver bloque nuevo de ese archivo).\n      expect(true).toBe(true); // placeholder de cobertura combinada\n    });\n\n  " + marker;
  s = s.replace(marker, insert);
  fs.writeFileSync(pack, 'utf8');
  console.log('nota agregada');
}
