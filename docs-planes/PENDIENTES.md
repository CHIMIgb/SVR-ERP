# Pendientes Reales — SVR-ERP

**Fecha:** 2026-11-03
**Origen:** revisión de la documentación del repo (PLAN-VISTAS.md, workflow/, docs_dudas/, historial-cambios/) cruzada contra el código real.

---

## 1. Export agrupado de morosos por obra (pendiente real de feature)

- **Fuente:** `workflow/02-operaciones-a-cxc.md`, línea 30.
- La dirección puede ver morosos por obra, pero **sin export** aún. Falta el export agrupado de CxC.

## 2. Cuestionarios de requisitos sin responder (bloquean trabajo UX)

- **Fuente:** `docs_dudas/DUDAS-RESPONSIVIDAD-SVR.txt` y `docs_dudas/DUDAS-VISTAS-SVR.txt`.
- 2 cuestionarios por vista sin responder: definen el comportamiento esperado y el
  chequeo responsivo/UX de cada pantalla (regla #1 del repo). Pendientes de que el
  usuario los responda antes de refinar vistas.

## 3. CI/CD en GitHub Actions (no existe; crear solo bajo orden)

- **Fuente:** `historial-cambios/2026-11-03-registro-cambios-agente-y-plantilla-pr.md`.
- El repo no tiene workflow. Propuesta ya definida: job `ci` con PostgreSQL 18 como
  service → checkout, setup-node 26 + `npm ci`, turbo `lint` + `tsc --noEmit` (web),
  jest unitarios (api). **Se creará únicamente cuando el usuario lo ordene.**

## 4. `.env` de web con IP vieja remanente

- **Fuente:** `historial-cambios/2026-11-03-registro-cambios-agente-y-plantilla-pr.md`.
- `apps/web/.env`: `ALLOWED_DEV_ORIGINS` aún incluye `192.168.0.203` (IP muerta).
  La principal (192.168.0.111) ya está correcta. Limpieza menor.

## 5. `PLAN-VISTAS.md` desactualizado (doc mentiroso)

- **Fuente:** `PLAN-VISTAS.md` líneas 26, 480 y 568.
- Declara "Módulo Comercial — PENDIENTE" y "pendiente: persistencia real de ventas",
  pero por código las vistas de `ventas/`, `proveedores/` y `cobranza/` ya consumen
  `ventasApi`/`proveedoresApi`/`cobranzaApi`, y el backend POS de ventas ya existe.
- **Pendiente:** actualizar el doc para que refleje la realidad; falta además confirmar
  en el navegador si `clientes/`, `finanzas/` y `cotizaciones/` están ya cosidas a la API.

## 6. ⚠️ IP real / `trust proxy` no configurado (flag para despliegue)

- **Hallazgo (2026-11-04):** el backend obtiene la IP con `req.ip || req.socket.remoteAddress`
  (`auth.controller.ts`, `audit-context.interceptor.ts`) pero `main.ts` **NO configura
  `trust proxy`** y no hay manejo de `X-Forwarded-For` en ningún lado (grep: cero resultados).
- **Hoy funciona bien** porque el acceso es directo a la API (local/LAN) — `req.ip` es la IP real del cliente y el bloqueo por IP (`usuarios_bloqueados` / `intentos_login`) castiga a quien debe.
- **Riesgo si se despliega detrás de nginx/Cloudflare:** todos los clientes aparecerán con la IP del proxy → el rate limiting (login 5/15min) y el bloqueo por IP castigarían a todos por igual.
- **Corrección cuando toque:** `app.set('trust proxy', 1)` en `main.ts` + validar que `req.ip` refleje el `X-Forwarded-For` correcto (configurar solo el número de saltos/hops confiables del despliegue).

---

### No son pendientes (descartados en la revisión)

- `implementation_plan*.md` (fases 1-7) — históricos, todo implementado.
- `svr_erp_export/schema_recommendations.md` — propuesta de BD ya implementada.
- Los `PENDIENTE` en estados de negocio (CxC, cotizaciones, nóminas, facturas) son
  enums de la BD, no tareas de desarrollo.
