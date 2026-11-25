# PWA del Técnico: "Flota y obras" con datos reales

**Fecha:** 2026-11-24
**Autor:** P4chec0php

## Cambios realizados
- **Antes**, `/m/flota-obras` era un placeholder. El Técnico no tenía de dónde ver la flota: la API completa de
  flota (`maquinaria.flota:ver`) trae costos, horómetro, combustible y mantenimiento, y no está abierta para su rol.
- **Ahora**, la pantalla muestra cada máquina con:
  - su estado: Operando, En taller o Detenida;
  - la obra de hoy;
  - su operador o chofer;
  - la última posición GPS, con su liga al mapa.
- Tiene tres pestañas (Maquinaria, Obras y En taller) y una búsqueda sin acentos por máquina, código, tipo, obra,
  ubicación o encargado.
- **Endpoint nuevo `GET /api/maquinas/campo`** con su propio permiso `maquinaria.flota_campo:ver`, para Técnico y
  Administrador. Devuelve solo lo que pinta la pantalla. Lo que se ve en cada tarjeta:

  | Campo | De dónde sale |
  |-------|---------------|
  | Estado | `maquinas.estado`, la misma regla que el panel del Administrador (encendida o en movimiento = operando) |
  | Obra de hoy | El despacho vigente en el día de la empresa (`hoyEnZona()`) → proyecto → obra 1:1. Si el proyecto no tiene obra, se muestra el nombre del proyecto |
  | Encargado | `maquinas.operador_id`; dice "Chofer" u "Operador" según el puesto |
  | Posición | El último ping de `rastreo_gps` (`DISTINCT ON`). Es "sin señal" después de 15 min. Sin ping no hay posición: no se usa el punto por defecto de `maquinas.lat/lng` |

- **Sin señal:**
  - La pantalla guarda una copia por usuario (`flota-campo:v1`) y, sin red o con la API caída, la muestra con
    el aviso "Sin conexión".
  - Si la copia es de otro día, lo dice ("Estas asignaciones son del …, no de hoy") y quita el "hoy" de los
    textos.
  - La antigüedad del GPS se recalcula con la hora actual, así que una copia vieja no presume "GPS hace 2 min".
  - Si falla "Actualizar" con datos en pantalla, los datos se conservan y se avisa arriba.
  - Una copia corrupta o de otra versión se ignora.

## Cosas nuevas
- Módulo `apps/api/src/flota-campo/` (controller, service, module y pruebas).
- Migración `20261124010000_flota_campo_permiso`:
  - crea el permiso y lo asigna a Tecnico y Administrador;
  - es idempotente;
  - avisa con `WARNING` si no quedó asignado al Técnico.
- `MINUTOS_SIN_SENAL` exportado desde `gps.service.ts` (antes era local), para usar la misma regla de 15 min.
- `maquinasApi.campo()` y los tipos `FlotaCampoDTO` / `MaquinaCampoDTO` en `lib/api.ts` (solo aditivo).
- `lib/pwa/flota-campo.ts`: estado para la UI, sin señal, validación de la copia, búsqueda sin acentos,
  agrupado por obra, conteos y la liga al mapa.
- Componente `components/pwa/TarjetaMaquina/` (`.tsx` + `.styles.ts` + `index.ts`), documentado en
  `COMPONENTS-PWA.md` §5b.
- `RBAC.md`: `flota_campo` en las tablas del módulo y una sección "Flota en campo de la PWA".

## Archivos tocados
- `apps/api/src/flota-campo/flota-campo.controller.ts` (nuevo)
- `apps/api/src/flota-campo/flota-campo.service.ts` (nuevo)
- `apps/api/src/flota-campo/flota-campo.module.ts` (nuevo)
- `apps/api/src/flota-campo/flota-campo.controller.spec.ts` (nuevo)
- `apps/api/src/flota-campo/flota-campo.service.spec.ts` (nuevo)
- `apps/api/src/flota-campo/flota-campo.integration.spec.ts` (nuevo)
- `apps/api/prisma/migrations/20261124010000_flota_campo_permiso/migration.sql` (nuevo)
- `apps/api/src/app.module.ts` (modificado)
- `apps/api/src/gps/gps.service.ts` (modificado)
- `apps/web/src/app/(pwa)/m/flota-obras/page.tsx` (modificado: reemplaza el placeholder)
- `apps/web/src/app/(pwa)/m/flota-obras/page.test.tsx` (nuevo)
- `apps/web/src/components/pwa/TarjetaMaquina/TarjetaMaquina.tsx` (nuevo)
- `apps/web/src/components/pwa/TarjetaMaquina/TarjetaMaquina.styles.ts` (nuevo)
- `apps/web/src/components/pwa/TarjetaMaquina/index.ts` (nuevo)
- `apps/web/src/lib/pwa/flota-campo.ts` (nuevo)
- `apps/web/src/lib/pwa/flota-campo.test.ts` (nuevo)
- `apps/web/src/lib/api.ts` (modificado)
- `COMPONENTS-PWA.md` (modificado)
- `RBAC.md` (modificado)

## Pruebas / verificación
- **Unitarias de la API:** 19 de `flota-campo`, que cubren:
  - el metadata del permiso y los guards;
  - los cuatro estados;
  - la obra, el proyecto sin obra y la máquina sin despacho;
  - el chofer y el operador dado de baja;
  - el ping fresco, el viejo y la falta de ping;
  - que no viajen datos sensibles y que el tope de catálogo marque `truncado`.

  Suite completa de la API: 1506/1506.
- **Integración contra Postgres real:** 6, que revisan:
  - el despacho vigente con columnas `@db.Date` (los vencidos, futuros o inactivos no cuentan);
  - la obra 1:1;
  - el ping más reciente;
  - que no salgan las máquinas inactivas ni las eliminadas.

  Crean y borran sus datos.
- **Web:**
  - 38 pruebas de la pantalla y de `lib/pwa/flota-campo`;
  - suite completa 109/109;
  - `tsc` limpio y `eslint` sin errores (los mismos 38 avisos que ya había).
- **Smoke contra la API real, con login real**, sobre una copia desechable de la BD local con la migración
  aplicada (se borró al terminar):
  - Técnico (login con PIN) y Administrador: 200, con estado, obra, encargado y GPS correctos en las 5 máquinas;
  - RRHH: 403 (`No tienes permiso para maquinaria.flota_campo.ver`);
  - sin token o con token inválido: 401;
  - solo viajan las claves de la pantalla;
  - el Técnico sigue con 403 en `GET /maquinas` y `GET /gps/maquinas`: el permiso nuevo no le abre la API
    completa.

  La migración aplicada dos veces no duplica nada.
- **Navegador (Chrome headless emulando Android, login real del Técnico):**
  - capturas de Maquinaria y Obras a 390, 768, 1024 y 1440, y de En taller a 390 y 1440, en claro y oscuro;
  - sin desborde horizontal en ningún ancho;
  - la búsqueda "atizapan" encuentra "Puente Atizapán";
  - sin excepciones de JS.
- **Sin red, probado en el navegador:**
  - con la página sin red: la flota se queda con el aviso y vuelve sola al regresar la señal;
  - con la API apagada de verdad: "Actualizar" conserva la flota con el aviso, y al recargar abre con la copia
    guardada;
  - con la API de vuelta: datos frescos sin aviso.

## Pendientes y riesgos
- **Va después del #31 (zona horaria UTC).** En el smoke, con el código de antes del #31, un ping escrito fuera
  del ORM se leía 6 h más viejo y la tarjeta decía "sin señal". Con la sesión en UTC (lo que hace el #31) sale
  bien. Esta rama integra `main` con el #31 antes de su PR.
- `maquinas.estado` no lo actualiza ningún flujo: es lo sembrado o lo que capture la oficina. La pantalla lo
  muestra igual que el escritorio.
- El Técnico ve **toda** la flota con su ubicación, como en el diseño del cliente (varias obras). Falta que el
  cliente lo confirme.
- No muestra al ingeniero de obra: espera la respuesta de "residente por obra o por persona".
- El GPS sigue simulado hasta que llegue el feed del proveedor.
- La migración del permiso se aplica en local y en el servidor. En el servidor, revisar después con:
  `SELECT r.nombre FROM role_permissions rp JOIN roles r ON r.id = rp.rol_id JOIN permissions p ON p.id = rp.permiso_id WHERE p.modulo = 'maquinaria' AND p.recurso = 'flota_campo';`
  Debe dar Administrador y Tecnico.
