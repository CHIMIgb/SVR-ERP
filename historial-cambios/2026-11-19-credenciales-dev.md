# Credenciales de dev fuera del README — archivo local no versionado

**Fecha:** 2026-11-19
**Autor:** agente

## Cambios realizados
- **`credenciales-dev.md`** (raíz, archivo local NO versionado — el repo es público) recoge las cuentas que antes estaban en el README, **separadas por uso**:
  - **PWA (una cuenta por rol):** admin, residente, tecnico, cobrador, trabajador — con las pestañas `/m/*` de cada rol **verificadas en `role_vistas`** el 2026-11-19. Notas: el rol **Administrativo (80) no tiene vistas móviles concedidas** (solo Mi perfil) y la pestaña Diésel es solo del técnico de torre Diesel.
  - **Escritorio (todas las cuentas):** tabla completa de 10 usuarios (incluye `admin`, `rrhh` y las 4 variantes de técnico por torre) con su columna "En /reportes puede" y la nota de que la torre vive en el PUESTO.
- **`README.md`:** las secciones "Credenciales de Acceso (API)" (bloques de admin/rrhh y la tabla de roles de plantilla) se reemplazaron por un apuntador al archivo local. Se conserva el contexto de seguridad (PR #17: las cuentas se siembran a mano con `prisma/demo-seed.sql`, nunca con `migrate`) y la nota de la torre en el puesto.
- **`.gitignore`:** `/credenciales-dev.md` para que ni un `git add .` accidental lo suba.

## Cosas nuevas
- Primera pieza local-no-versionada del repo (patrón similar a `/docs-svr/` pero para texto plano).

## Archivos tocados
- `README.md` (limpieza de credenciales)
- `.gitignore` (+1 línea)
- `credenciales-dev.md` (creado, fuera del git)
- `historial-cambios/2026-11-19-credenciales-dev.md` (creado)

## Verificación / pruebas
- `git diff --check`: sin errores.
- `git status`/`git check-ignore`: el archivo nuevo aparece ignorado, no como untracked.
- El commit solo lleva `README.md` + `.gitignore` + este registro — **sin** el archivo de credenciales.

## Pendientes y riesgos
- El README **todavía menciona** `admin123` en dos lugares NO de cuentas: la `DATABASE_URL` de ejemplo (contraseña de la BD local de cada máquina) y el curl de login de ejemplo. Quedaron a decisión del dueño; también lo anota `credenciales-dev.md` al final.
- Cada desarrollador necesita su copia de `credenciales-dev.md`; quien clone el repo no lo tendrá (intencional). Si se pierde, las contraseñas sugeridas están en el historial de este registro local y en `prisma/demo-seed.sql` (el hash real va por variable de psql).
- Sin push: el commit queda local, como indica la regla del repo.
