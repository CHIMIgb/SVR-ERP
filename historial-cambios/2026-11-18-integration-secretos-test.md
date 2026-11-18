# Secretos JWT de prueba para la integración en CI

**Fecha:** 2026-11-18
**Autor:** Agente (autorizado por el usuario — "Arreglarlo completo")

## Contexto

La primera corrida del workflow `integration` con el dump y los specs corregidos
(run `44411690109`) falló con 15 tests en 2 suites: `auth` y `auth/pin`.
El error de raíz es `TypeError: JwtStrategy requires a secret or key`: en GitHub
no existe `apps/api/.env`, que es de donde `dotenv` sacaba `JWT_ACCESS_SECRET` y
`JWT_REFRESH_SECRET` en local. `integration.yml` ya aporta `DATABASE_URL`, `TZ` y
`TIMEZONE`, pero no los secretos. Todos los demás módulos pasaron (24 suites).

## Cambios realizados

- `apps/api/jest.integration.config.js`: valores dummy para `JWT_ACCESS_SECRET` y
  `JWT_REFRESH_SECRET` con `||=`, es decir solo si no vienen ya del entorno o del
  `.env`. No se tocaron secretos de GitHub ni el workflow. Los valores son
  exclusivos de tests; nunca los de despliegue.

## Archivos tocados

- `apps/api/jest.integration.config.js` (modificado)
- `historial-cambios/2026-11-18-integration-secretos-test.md` (creado)

## Pruebas / verificación

- Simulando CI en local (`DOTENV_CONFIG_PATH` apuntando a un archivo vacío, sin
  `JWT_*` en el entorno, contra el dump limpio restaurado): **26 suites, 292
  tests pasados**.
- Pendiente: nueva corrida del workflow `integration` en GitHub.

## Pendientes y riesgos

- El comentario del workflow `integration.yml` dice que el dump pesa 0.22 MB;
  con el dump regenerado son 0.66 MB. Es solo un comentario, no afecta el restore.
- Los secretos dummy viven en la config de Jest: si alguien reutiliza esa config
  para apuntar a una BD de producción, los tokens emitidos serían predecibles.
  Es un archivo de tests, no se usa en el arranque de la API.
