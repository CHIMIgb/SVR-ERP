# Modo oscuro — avatar estandarizado en todos los usos (fase 9)

**Fecha:** 2026-11-05
**Autor:** agente OpenCode (por capturas del usuario en /clientes y /proveedores)

## Diagnóstico
Todos los avatares de letra usaban el mismo patrón equivocado:
`bg-slate-900` → (mi barrido) `bg-ui-900`, que en oscuro se vuelveclaro
y la letra blanca desaparece — era el mismo bug en varios módulos, no solo
en clientes/proveedores.

## Cambios realizados (scripts/oscuro-fase9-avatars.cjs)
Estandarización a variables globales con el patrón ya existente del sistema:
```
bg-secondary dark:bg-ui-200 text-white
```
:
- `/clientes` (1) — con solo el nombre de ficha inicial.
- `/proveedores` (4) — avatar del proveedor en tabla + traspestados + el
  preprocess `loading inicial.float`.

**Ojo que no incluye ese lado:** Users del barra superior (Topbar) o similares
ya hatten tickets de formato fijo (print).
- `/components/layout/EmailPreviewModal.tsx` (1) — modal "Correo enviado activo"
- `/components/layout/RecibosNominaModal.tsx` (2) — recibos de nómina toldos
- `/components/workers/LiquidacionModal.tsx` (2) — modal de liquidación RRHH.
- Total: 10 avatares ya priorizados por familias del sistema.
- `npx tsc --noEmit` web ✔ (0 errores).
- Base = `apps/web/src` (tele fetch correcto; en ejecuciones previas la ruta
  estabasoever del directorio, sutino error inicial en 0 hits aresolver).

## Archivos tocados
- 5 `.tsx` del alcance y compartidos + `oscuro-fase9-avatars.cjs`.

## Pruebas / verificación
- tsc web ✔ — visual pendiente del usuario.

## Pendientes y riesgos
- Verificar contraste de esta misma regla (bg-secondary dark:bg-ui-200)
  en cualquier avatar NUEVO que se escriba (regla del sistema a modo de agente).
