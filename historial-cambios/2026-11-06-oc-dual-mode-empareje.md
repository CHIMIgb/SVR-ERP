# OC — líneas dual-mode (inventario/nuevo) + empareje backend case-insensitive

**Fecha:** 2026-11-06
**Autor:** agente OpenCode (por consulta del usuario: "Filtros de aceite" vs "filtros de aceite")

## Diagnóstico
El usuario tiene razón: si en la OC se escribía el nombre del producto (mayús-
culas distintas a las del catálogo), al recibir mandaba a ALTA un artículo
DUCHESTADO — duplic oscuro de inventario en vez de sumar stock al existente.

## Cambios realizados
1. **Backend (`proveedores.service.ts`)** — defensa en la recepción:
   - Antes de dar ALTA a una línea sin `articulo_id`: busca en el catálogo un
     artículo **case-insensitive + sin acentos** (normalize NFD) del mismo
     proveedor → si coincide, linkea (`articulo_id = match.id`) y aplica
     ENTRADA normal (+stock) — crea solo si NO hay coincidencia.
   - Flag `altaNueva` correcto por línea (false si linkeado).
   - `aplicarEntrada` corre UNA sola vez al final para todas las rutas
     (catálogo / linkeado / alta nueva).
2. **Frontend (`proveedores/page.tsx`)** — cada línea del pedido ahora vive en
   un **modo dual**:
   - **Del inventario**: select con catálogo real (`inventarioApi.listar`)
     que al elegir traé **precio unitario** y muestra stock (el importe se
     calcula con el precio global — `formatCurrency` global);
     `articuloId` ligado (redibujai no permite texto).
   - **Producto nuevo**: input libre → recibirá ALTA en la recepción.
   - Toggle por línea entre modos y **aviso de duplicado probable** si el
     texto escrito coincide con un artículo del catálogo (case-insensitive).
3. Verificación: `npx tsc --noEmit` web y api ✔; **service spec 58/58**
   (linkea por nombre case-insensitive + respeta alta explicita añadidos) ✔;
   eslint archivo 0 errores.

## Archivos tocados
- `apps/api/src/proveedores/proveedores.service.ts` (empareje + flag)
- `apps/web/src/app/(dashboard)/proveedores/page.tsx` (dual-mode + aviso)
- `apps/web/src/lib/api.ts` (parcie `articuloId` nullable ya aplicado)

## Pruebas / verificación
- spec proveedores 58/58 ✔ (con los 2 nuevos de empareje).
- Visual pendiente del usuario.

## Pendientes y riesgos
- El empareje autómatico match se limpia si el proveedor es distinto —
  código de producto/variedad del mimo nombre se respeta (scan de 500 items).
