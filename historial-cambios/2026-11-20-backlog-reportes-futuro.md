# Backlog documentado de /m/reportes (mockups del cliente)

**Fecha:** 2026-11-20
**Autor:** agente
**Origen:** «ya funciona todo, el resto de cosas a implementar en un futuro déjalo documentado»

## Cambios realizados
- **`docs-planes/docs-pwa/PLAN-REPORTES-PWA-FUTURO.md` (nuevo):** backlog de
  los elementos de los 3 mockups que NO entraron en el lote A, ordenado por
  valor/efecto y con el análisis de cada uno:
  1. KPI mensual del técnico (endpoint nuevo + tarjeta con delta).
  2. Flujo «Presionar» del residente (caja «¿Por qué no se resuelve?» +
     nudge a la torre + Llamar técnico — requiere teléfono del asignado en
     el DTO).
  3. Badge «Atrasado» (regla SLA a definir con el cliente).
  4. Chips específicos por rol (Disponibles/Mis aceptados/...).
  5. Menores: deep-link por referencia en las notificaciones, «+ Nuevo
     reporte» full-width, fecha en la burbuja.
  Incluye convenciones: cada item con plan propio + autorización; alertas
  nuevas SOLO por el catálogo; KPIs/badges derivados calculados en el
  service (misma regla en ambas apps).
- **`PLAN-NOTIFICACIONES-PUSH-PWA.md`:** estado actualizado — el push
  quedó **verificado en dispositivo por el usuario** (instalada vía HTTPS
  de LAN): el ciclo completo funciona (SW modo dev, suscripción, push con
  la app cerrada, campana en tiempo real).

## Archivos tocados
- `docs-planes/docs-pwa/PLAN-REPORTES-PWA-FUTURO.md` (creado)
- `docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md` (estado)
- `historial-cambios/2026-11-20-backlog-reportes-futuro.md` (creado)

## Verificación / pruebas
- `git diff --check`: sin errores. Cambio solo de documentación.

## Pendientes y riesgos
- Nada pendiente del sistema de push: implementado y verificado por el
  usuario en el teléfono.
- Sin push: el commit queda local.
