# 2026-11-12 — docs: carpeta docs-svr-dudas movida dentro de docs-svr + INDEX con vistas por archivo

## Qué pasó

1. **El usuario movió la carpeta** `docs-svr-dudas/` (raíz) a
   **`docs-svr/docs-svr-dudas/`** y editó los archivos: quitó los párrafos de
   contexto/intro de cada uno y dejó solo **DUDAS + SUGERENCIAS DE MEJORA**
   (también acortó algunas líneas). Sus cambios se respetan tal cual.
2. **INDEX.txt reescrito** (en la nueva ubicación) con la tabla de a qué
   vistas pertenece cada archivo:
   - PRODUCTIVIDAD → /operaciones, /ventas, /cobranza, /facturas, /proyectos
   - ESTADO DE CUENTA (CLIENTE) → /cobranza, /clientes, /facturas
   - LISTA DE PRECIOS → /cotizaciones, /ventas
   - COTIZACIONES (WORD) → /cotizaciones, /facturas
   - NOMINA → /operaciones (solo operadores)
   - CONTROL DE GASTOS → /finanzas (borde /ventas/corte)
   - PROVEEDORES y EXTERNOS 01 → /proveedores, /finanzas
   - PROYECTO AILIN → /proyectos, /operaciones
   - REGISTRO DE VENTAS → /ventas, /ventas/corte, /finanzas
   + reglas ya adoptadas por la app + temas nuevos del cliente (crédito).
3. **⚠️ Situación de git:** como la carpeta ahora vive DENTRO de `docs-svr/`
   (que está en `.gitignore`), **los txt de dudas quedaron fuera del
   versionamiento** — git muestra la copia vieja `docs-svr-dudas/` como
   eliminada (D) y la nueva no se trackea. Se deja así (decisión del
   usuario); si algún día se quieren versionar, basta mover la carpeta fuera
   de `docs-svr/` o excluir `docs-svr/docs-svr-dudas` del ignore.

## Archivos tocados

- `docs-svr/docs-svr-dudas/INDEX.txt` (reescrito, nueva ubicación)
- Movimiento/edits de los demás txt: del usuario (no commiteados, carpeta ignorada)

## Pendientes / riesgos

- **El historial versionado de las dudas quedó congelado en el último commit
  (`docs-svr-dudas/`, raíz)**; los cambios del usuario a los txt solo viven
  local. Confirmar con el usuario si quiere: (a) dejarlas sin versionar, o
  (b) versionarlas (mover fuera / ajustar ignore).
- La eliminación de `docs-svr-dudas/` en git sigue pendiente de commit.
