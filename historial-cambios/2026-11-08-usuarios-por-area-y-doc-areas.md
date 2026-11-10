# Usuarios demo por area + documentacion de areas del sistema

**Fecha:** 2026-11-08
**Autor:** agent (GLM-5.3-Flash / ponytail)

## Cambios realizados

1. **Usuarios demo para cubrir TODAS las areas:** creados
   `soldador@` / `diesel@` / `mantenimiento@svr-constructora.com`
   (password `tecnico123`, rol Tecnico 70) con `users.torre` explicita
   (SOLDADOR / DIESEL / MANTENIMIENTO) — asi cada torre tiene usuario(s) y
   "misma area" resuelve directo. El base tecnico@ queda con torre MECANICO fija.
2. **README documentado** (seccion Credenciales + nueva subseccion "Areas del
   sistema"): tabla de usuarios ampliada (8 roles-de-plantilla), y tabla de las
   **6 areas** con la guia del cliente: Administrativo (ADMIN/jefes/oficina +
   cobrador de criba/POS), Residente (ingenieros encargados de obra y personal),
   Mecanico/Soldador/Diesel/Mantenimiento (tecnicos), y Trabajadores
   (operador/chofer/otros — sin area propia, envian a la torre que corresponda).

## Archivos tocados

- `apps/api/prisma/migrations/20261108230000_usuarios_por_area/migration.sql` (nuevo)
- `README.md` (credenciales + areas)

## Pruebas / verificacion

- `migrate deploy` aplicado; login e2e real de los 3 nuevos: torre
  SOLDADOR/DIESEL/MANTENIMIENTO entregada por el perfil, con las 2 vistas
  (dashboard + reportes) del rol Tecnico.

## Pendientes y riesgos

- Los Trabajadores siguen sin area propia (por diseño de la guia): sus
  incidentes "Misma area" caen en Administrativo hasta asignarles jefe o torre.
