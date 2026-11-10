# /reportes — detalle con dirección del proyecto, link a Google Maps y GPS con mensajes claros

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **Detalle — "Ubicación" inteligente:**
   - **Proyecto:** nombre + **dirección guardada** (`proyectoDireccion` armado en
     el serialize con calle/colonia/ciudad de la tabla proyectos — ya existían,
     sin columnas nuevas; solo se exponen por el include).
   - **GPS:** coordenadas + **link "Ver en Google Maps"** generado con las
     coords almacenadas (`maps.google.com/?q=lat,lng`, target blank) — sin
     consumo externo, sin guardar nada afuera.
   - Sin ubicación → "Sin ubicación" apagado.
2. **Detalle "Levantó" dividido en 3 celdas tituladas:** Levantó (nombre) /
   **Teléfono** (con su título propio) / **Puesto / Rol**.
3. **GPS que explica por qué falla:** la geolocalización **no existe fuera de
   HTTPS/localhost** (por IP LAN HTTP el navegador la bloquea). En guardar:
   - detección previa `isSecureContext`/`geolocation` → toast claro:
     "Tu navegador bloquea el GPS fuera de HTTPS — usa localhost, activa el
     HTTPS (requisito del PWA) o elige Proyecto";
   - reintento con timeout 15s y cache 30s (señal lenta);
   - sin señal/permiso → mensaje con causa y alternativas;
   - hints permanentes en las cards "Ubicación GPS" (alta y editar);
   - doble toast eliminado (el catch de create/edit ya no repite si GPS falló;
     buildPayload manda el mensaje específico una sola vez).

## Archivos tocados

- `apps/api/src/reportes-campo/service.ts` (include + serialize proyectoDireccion)
- `apps/web/src/lib/api.ts` (type proyectoDireccion)
- `apps/web/src/app/(dashboard)/reportes/page.tsx` (celda ubicación, link Maps,
  celdas Levantó/Teléfono/Rol, GPS con detección y mensajes)

## Pruebas / verificación

- Unitarios **78/78** (nuevo: detalle con proyecto trae `proyectoDireccion`
  armado de la BD). `tsc --noEmit` api+web, eslint 0.
- Auditoría: estos son cambios de **lectura** (detalle/serialize) — no generan
  filas nuevas en `registro_auditoria` (las 4 reglas/audits aplican a
  mutaciones, y TODAS las mutaciones de /reportes ya dejan su SUCCESS/FAIL:
  crear/editar/aceptar/cerrar/comentar/adjuntar/eliminar).

## Pendientes y riesgos

- La captura GPS automáticamente seguirá bloqueada mientras la app corra por
  IP LAN HTTP (limitación del navegador, no del código); con el PWA en HTTPS
  funcionará sin cambios. La ruta para el usuario hoy: modo Proyecto.
