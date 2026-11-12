# 2026-11-12 — docs: estructura organizacional (roles, puestos, torres) en el README

## Qué se documentó

Al README, tras la consolidación al modelo de 5 roles:

1. **"Estructura organizacional (roles, puestos y torres)"** — la tabla de los
   5 roles de negocio + Administrador (sistema) con su nivel, para quién es y
   los puestos del catálogo con la torre que cada uno lleva. La regla de una
   línea: *el rol decide qué puede hacer; el puesto decide quién es y a qué
   torre pertenece para /reportes*.
2. **"⚠️ Vigilancia de permisos"** — la regla para el permiso #107 en
   adelante: verificar que no exista duplicado en otro recurso del mismo
   módulo, agregarlo al seed y al rol correcto en el mismo cambio, y que un
   endpoint nuevo use SU permiso propio (no pedir prestado el de otra vista).
   Aplica en especial al construir la Vista B (P12).
3. Actualización de la sección de credenciales/torres que quedó desactualizada
   por la consolidación: el rol de `rrhh@` es Administrativo (80) con los
   permisos RRHH absorbidos; los 4 técnicos demo son rol **Técnico**; la nota
   de la torre ahora dice que **vive en el puesto** (`categorias_puesto.torre`)
   y se escribe en `users.torre` — el rol ya no la define.

## Verificación / pruebas

- Solo docs (README.md) — sin código.
- grep del README: sin referencias activas a los roles viejos (solo queda la
  mención de los desactivados, intencional).

## Pendientes / riesgos

- Ninguno funcional.
