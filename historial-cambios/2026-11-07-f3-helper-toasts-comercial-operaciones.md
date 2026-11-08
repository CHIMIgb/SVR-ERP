# F3 — helper mensajeErrorApi aplicado en Comercial + Operaciones (50 toasts)

**Fecha:** 2026-11-07
**Autor:** agente OpenCode

## Objetivo (punto 4 del Tier 0)
Que el toast de error diga QUÉ campo falló (los `details[]` del 422 de
class-validator) en vez del genérico "Error de validación", en TODAS las vistas
de Comercial y Operaciones. Alcance decidido por el usuario: el resto de
módulos es de otro dev — NO se tocaron (asistencia, gps, horometro,
mantenimiento, maquinaria, combustible, nomina, trabajadores, configuracion,
dashboard, documentos, ui-showcase).

## Cambios realizados
1. **Helper en `lib/api.ts`:** `mensajeErrorApi(res.error, fallback)` —
   prioridad `details[].map(String).join(' · ')` → `error.message` → fallback
   (seguro con `details: unknown[]`; objetos → JSON.stringify).
2. **50 ramas de fallo reescritas en 13 vistas** (auditoría previa: 40 con
   `?.message ||`, 10 con `??`, 2 manuales details-join en proveedores):
   operaciones 3, inventario 4, proyectos 4, criba 3, reportes 7, clientes 5,
   cotizaciones 3 (una con fallback template literal hecha a mano), facturas 6,
   cobranza 1, finanzas 3, proveedores 7 (2 manuales ya en helper y su doble
   envoltorio aplanado), ventas 2, ventas/cierres 2. `/ventas/corte` no tiene
   ramas de fallo de API (0).
3. Regla única en `AGENTS.md` ("Toasts de error — helper único"):
   prohibido `res.error?.message || ...` a mano; los catch de red no pasan por
   el helper; el resto de módulos debe adoptar el MISMO patrón cuando los toque.
4. `IMPLEMENTACIONES-A-FUTURO.md`: F3 → ✅ en Tier 0, §7 y §11 (con alcance
   explícito y la referencia del helper).

## Verificación
- `npx tsc --noEmit`: 0 errores. `grep res.error` en las vistas del alcance:
  0 fuera del helper (los residuos del grep final son SOLO de módulos de otro
  dev, por diseño).
- Muestra manual: `showToast(mensajeErrorApi(res.error, 'Error al guardar
  proveedor.'), 'error')` en proveedores l348 y l415 (los detalles migraron).
- Sin unit front (no hay runner en web — el doc ya lo anota) — verificación =
  tsc + visual.

## Pendientes y riesgos
- **Pendiente del backend (fuera de F3):** los `details[]` del 422 a veces traen
  mensajes class-validator en INGLÉS (`cliente_id should not be empty`) — el
  repo pide UI en español; ese fix global es del backend (mensajes custom del
  ValidationPipe o DTOs con mensajes en español) y queda apuntado.
- El helper pierde el `code` (p. ej. CODIGO_DUPLICADO tiene message propio
  legible en español que el helper muestra; los códigos sin message no cambian).
