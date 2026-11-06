// Fase del review PR#15 (bloqueadores #1 y #2): alinear /proveedores al
// contrato Fase 7 (items[]), catálogo para albass de articulos nuevos, RFC
// validado en la UI y toasts con los details reales.
const fs = require('fs');

let cambios = 0;
function patch(file, fn) {
  const src = fs.readFileSync(file, 'utf8');
  const out = fn(src);
  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    cambios++;
    console.log('patched:', file);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────
// 1) lib/api.ts — contrato con items[] y tipos de catálogo
// ────────────────────────────────────────────────────────────────
patch(
  'apps/web/src/lib/api.ts',
  (s) =>
    s.replace(
      `export interface OrdenCompraCreateInput {
  proveedorId: string;
  descripcion: string;
  monto: number;
  fecha?: string; // YYYY-MM-DD
}

export type OrdenCompraUpdateInput = Partial<
  Pick<OrdenCompraCreateInput, 'descripcion' | 'monto'>
>;`,
      `export interface OrdenCompraItemInput {
  articuloId?: string; // artículo del catálogo; si es null → línea de ALTA
  nombre?: string; // obligatorio si articuloId no viene (nuevo producto)
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompraCreateInput {
  proveedorId: string;
  descripcion?: string;
  fecha?: string; // YYYY-MM-DD
  items: OrdenCompraItemInput[]; // monto se deriva de la suma en el backend
}

export type OrdenCompraUpdateInput = Partial<
  Pick<OrdenCompraCreateInput, 'descripcion' | 'items'>
>;`,
    ).replace(
      `  /** Recibir OC aprobada: aplica al inventario (alta/entrada) y marca RECIBIDA. */
  recibir: (`,
      `  /** Catálogo de artículos de inventario para las líneas de OC. */
  catalogoArticulos: (params?: { search?: string; page?: number; limit?: number }) =>
    inventarioApi.listar(params),

  /** Recibir OC aprobada: aplica al inventario (alta/entrada) y marca RECIBIDA. */
  recibir: (`,
    ),
);

// inventarioApi debe estar anteriormente en el archivo — verificar import order
// (si ordenesCompraApi va antes que inventarioApi, mueve el add del catálogo al root).
console.log('1 done');
