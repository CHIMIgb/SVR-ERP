# 2026-11-12 — Modal: la página ya no "salta" al abrirse un modal

## Qué se hizo

- **`apps/web/src/components/ui/Modal/Modal.tsx`** — al abrir un modal, además
  de bloquear el scroll del fondo (`overflow: hidden`, que ya existía), se
  compensa el ancho de la barra de scroll con un `padding-right` en el body
  igual al ancho real del scrollbar (`window.innerWidth -
  document.documentElement.clientWidth`, calculado ANTES de bloquear). Al
  cerrar, se limpia. Como es ancho calculado en runtime, entra en la excepción
  de la regla de estilos inline (igual que el `overflow` que ya estaba).
- **Modales anidados** (modal abierto desde otro modal): contador
  `modalesAbiertos` a nivel de módulo — solo el primero en abrir mide/compensa
  y solo el último en cerrarse libera el bloqueo, para que cerrar el modal
  interior no descompense la página.
- Con scrollbar de overlay (celular) el ancho medido es 0 → no hace nada:
  comportamiento anterior intacto en móvil.
- Beneficia a TODOS los modales de la app (es el componente compartido del kit).

## Verificación

- `npx tsc --noEmit` (web): limpio.
- `npx eslint src/components/ui/Modal/Modal.tsx`: sin hallazgos.

## Pendientes / riesgos

- Smoke visual pendiente (sin navegador): abrir/cerrar un modal en una página
  con scroll y confirmar que el contenido no se recorre; y abrir modal dentro
  de modal (detalle → editar) y cerrarlos.
- Si algún modal nuevo se implementara sin pasar por este componente, no
  heredaría la compensación.
