# COMPONENTS-PWA.md — documentación propia de la PWA + regla en AGENTS.md

**Fecha:** 2026-11-19
**Autor:** agente

## Cambios realizados
- **`COMPONENTS-PWA.md` (nuevo, raíz):** documentación exclusiva de los
  componentes de `src/components/pwa/*`, con el mismo formato de
  `COMPONENTS.md` (tabla de props, import, uso, «cuándo usar», «cuándo NO
  usar»). Contenido: RoleNav (nueva sección — no estaba documentado),
  PinInput, PantallaPlaceholder, ModalInstalar (portados de la ex-§16 de
  `COMPONENTS.md`), y TarjetaReporte, EstadoCola y ModalNuevoReporte.
- **`COMPONENTS.md`:** el capítulo §16 (PWA) se reemplazó por un APUNTADOR
  al nuevo archivo — una sola fuente de verdad (el contenido íntegro vive
  ahora en `COMPONENTS-PWA.md`; el §17 de escritorio queda intacto).
- **`AGENTS.md` — regla de documentación obligatoria:**
  - Regla PWA #2: los componentes de `src/components/pwa/*` se documentan
    en `COMPONENTS-PWA.md` (antes decía `COMPONENTS.md`).
  - Critical Rules: nueva regla **DOCUMENT PWA COMPONENTS** — todo
    componente de `src/components/pwa/` se documenta en
    `COMPONENTS-PWA.md` en el MISMO cambio (no negociable).
  - Guías §10 («Documentación no negociable»): ahora distingue los dos
    archivos por carpeta (`ui/*` → `COMPONENTS.md`; `pwa/*` →
    `COMPONENTS-PWA.md`).

## Archivos tocados
- `COMPONENTS-PWA.md` (creado)
- `COMPONENTS.md` (§16 → apuntador)
- `AGENTS.md` (3 ediciones)
- `historial-cambios/2026-11-19-components-pwa-doc.md` (creado)

## Verificación / pruebas
- `git diff --check`: pendiente de correr en el commit (se valida al agregar).
- Cambio solo de documentación: no aplica gates de código.

## Pendientes y riesgos
- El archivo de instrucciones del agente `.opencode/agent/svr-erp.md`
  todavía menciona "documéntalos en `COMPONENTS.md`" para la PWA: falta
  sincronizarlo (queda pendiente de autorización, toque ajeno).
- Los componentes flat antiguos (`RoleNav.tsx`, `PinInput.tsx`,
  `PantallaPlaceholder.tsx`, `ModalInstalar.tsx`) no siguen el patrón de
  carpeta (`.tsx` + `.styles.ts` + `index.ts`): deuda cosmética registrada;
  migrarlos solo si se tocan.
- Sin push: el commit queda local.
