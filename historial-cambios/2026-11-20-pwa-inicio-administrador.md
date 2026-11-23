# PWA: Inicio del Administrador con panel de empresa

**Fecha:** 2026-11-20
**Autor:** P4chec0php

## Cambios realizados
- **Panel de empresa en `/m`** para los roles con vistas de oficina (Administrador; Administrativo cuando tenga
  vistas `/m`). Mismas fuentes y permisos que el Dashboard de escritorio: cada bloque se muestra solo si el rol
  tiene esa vista de escritorio y cada fuente carga por separado con su propio error y Reintentar.
  - Personal activo y con asistencia hoy (`/asistencia/semanal`).
  - Flota operando / total y en mantenimiento (`/maquinas`).
  - Por cobrar y cobrado del mes (`/cobranza/stats`), en formato corto ("$340K", "$1.2M").
  - Alertas: reportes críticos sin cerrar y sin atender (`/reportes-campo/stats`, con enlace a `/m/reportes`),
    faltas y omisiones de hoy, cobranza vencida. Sin alertas: "Sin alertas por ahora".
- **Quien no tiene `/m/asistencia` en su menú** (el Administrador, como en el diseño) ya no carga ni ve la
  tarjeta de su asistencia; su subtítulo muestra rol y fecha.

## Cosas nuevas
- `apps/web/src/app/(pwa)/m/PanelEmpresa.tsx`.

## Archivos tocados
- `apps/web/src/app/(pwa)/m/page.tsx`
- `apps/web/src/app/(pwa)/m/PanelEmpresa.tsx`

## Verificación
- `npx tsc --noEmit` y `eslint` en `apps/web`: sin errores en el código.
- Navegador: Chrome headless emulando un Android, login real por PIN con una cuenta temporal de rol
  Administrador (dada de baja al terminar), contra los datos reales de la BD local. Capturas a 390, 768, 1024 y
  1440 px en claro y oscuro.

## Pendientes
- Del diseño faltan, por no haber datos: "Ventas del mes" (no hay agregado mensual de ventas), "Documentos por
  vencer" (no hay API de documentos) y "Tanque de diésel" (no hay modelo de tanque).
- `/m/modulos` (lista de todos los módulos): queda pendiente porque el shell manda los módulos de escritorio de
  regreso a `/m` en el teléfono; hay que decidir qué abre cada módulo desde el celular.
