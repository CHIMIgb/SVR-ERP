# /reportes — fix 500 en adjuntos (body limit) + área (torre) asignable por usuario para "misma área"

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

**Fix del 500 al subir imágenes reales:** la API no tenía límite de body
configurado — el default de Express (100 KB) rechazaba una foto convertida a
base64 (~2.7 MB) y el filter lo envolvía como INTERNAL_ERROR. `main.ts` fija
`json({ limit: '15mb' })`. Los adjuntos siguen cappados en 2 MB por imagen a
nivel DTO/service (el límite del body solo permite el payload completo).

**Área (torre) por empleado:** el usuario tenía razón — sin un área asignada
por persona, "misma área" era ambigüa. Implementación:
- Migración `20261108170000_users_torre`: columna `users.torre` (enum
  CategoriaReporte, nullable).
- `GET /auth/profile`(y login, comparten builder) ahora regresa `torre` —
  tipos actualizados en el duplicado local `apps/api/src/auth/types/auth.types.ts`
  (ojo: el API mantiene SUS tipos, no los de shared) y en
  `packages/shared/src/types/auth.ts` (`UserAuth.torne?: string | null`).
- Resolver del service: `user.torre` asignada → esa torre; null → ADMINISTRATIVO
  (oficina). El mapeo por puesto (torrePrefijoPorPuesto) quedó eliminado:
  el valor ya es del mismo enum.
- Front: al elegir "Misma área", las subcategorías ya se cargan con la torre del
  usuario (`user.torre` del perfil) y el select muestra "tu área: X"; si el
  usuario no tiene torre, cae en Administrativo como hoy.

## Cosas nuevas

- `users.torre` — **asignación a mano por BD** por ahora: no existe CRUD de
  usuarios en el API; cuando se construya el panel de usuarios, ahí se exponde.

## Archivos tocados

- `apps/api/src/main.ts` (body limit)
- `apps/api/prisma/schema.prisma` + migration `20261108170000_users_torre`
- `apps/api/src/auth/auth.service.ts` + `apps/api/src/auth/types/auth.types.ts`
- `packages/shared/src/types/auth.ts`
- `apps/api/src/reportes-campo/reportes-campo.service.ts` (resolver por user)
- specs unit/integration; front `reportes/page.tsx`

## Pruebas / verificación

- Unitarios módulo: **70/70** (nuevo: torre MECHANIC asignada al resolver).
- Integración: 24/24; `tsc --noEmit` api+web.
- E2E real: user con torre=RESIDENTE en BD → create "misma área" → nace
  INC0034 con categoria=Residente; adjunto de 1.5MB base64 sube exitoso (antes
  413→500); luego la torre del admin se revirtió a NULL y los demos borrados.
- El incidente INC0031..0033 de pruebas de este día fueron depo/limpiados.

## Pendientes y riesgos

- El frontend lee user.torre del perfil: si un admin cambia la torre por SQL
  mientras el usuario tiene la sesión abierta, su copy queda desalineado hasta
  nuevo login/refresh del perfil (bajo impacto).
- Cuando exista CRUD de usuarios: exponer `torre` en el serializer de usuarios
  del sistema; algo pendiente.
