# Roles tecnicos descriptivos (Técnico Mecánico/Soldador/Diésel/Mantenimiento)

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

El rol generico "Técnico" se separo en 4 roles descriptivos, uno por area de la
guía del cliente (evita confusiones entre tecnicos de distintas torres):

- **Técnico Mecanico** (torre MECANICO)
- **Técnico Soldador** (torre SOLDADOR)
- **Técnico Diesel** (torre DIESEL)
- **Técnico Mantenimiento** (torre MANTENIMIENTO)

Cada uno con nivel 70, reportes (ver/crear/editar) + dashboard, y las vistas
/dashboard y /reportes. Los usuarios demo (tecnico@/soldador@/diesel@/
mantenimiento@) se reasignaron al rol de su torre. El rol generico 'Técnico'
quedo eliminado (sin usuarios). README actualizado (tabla de credenciales +
tabla de areas).

## Archivos tocados

- `apps/api/prisma/migrations/20261108221000_roles_tecnicos_descriptivos` (nuevo)
- `apps/api/scripts/migra_tecnicos_descriptivos.sql` (quirúrgico oportuno — ver riegos)
- `README.md`

## Pruebas / verificación

- E2E real: los 4 logins entregan rol descriptivo y su torre (tecnico →
  Tecnico Mecanico/MECANICO…); "Misma area" con el nuevo rol nace
  categoria=Mecanico/tipo=Mecanico (INC, demo borrado con admin).
- Unitarios/integración no cambian (no tocan nombres de roles).

## Pendientes y riesgos

- La migración 20261108221000 reasigna por users.torre pero busca el rol viejo
  SIN acento ('Tecnico') — la reasignación/limpieza real se ejecuto con el SQL
  quirúrgico `scripts/migra_tecnicos_descriptivos.sql` (con acento). En un
  rebuild fresco aplicarian ambos en orden y funcionan igual (el generic queda
  solo si alguien lo recreo con acento; limite conocido).
