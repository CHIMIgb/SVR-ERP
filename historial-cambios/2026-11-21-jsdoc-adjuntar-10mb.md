# JSDoc del adjuntar alineado con el tope real (10 MB)

**Fecha:** 2026-11-21
**Autor:** SVR-ERP Dev (agente)

## Cambios realizados
- Último menor de la segunda revisión del PR #23: el JSDoc del endpoint de
  adjuntos en el CONTROLLER (`reportes-campo.controller.ts`) decía
  "base64, máx 2 MB" cuando el tope real es 10 MB decodificados
  (`MAX_BYTES_DECODIFICADOS_ADJUNTO` en `dto/adjunto.dto.ts`). Ahora cita
  la constante para que no vuelva a desalinearse.
- El JSDoc del front (`lib/api.ts adjuntar`) ya estaba correcto (no
  menciona cifra) — el desalineado era solo del backend.
- Comentario de docs: no toca código ejecutable ni BD.

## Archivos tocados
- apps/api/src/reportes-campo/reportes-campo.controller.ts (comentario)

## Pruebas / verificación
- `npm run build` (apps/api): OK (comentario no afecta ejecución).
- `git diff --check`: limpio.
- No aplica corrida de tests: cambio de documentación.

## Pendientes y riesgos
- Ninguno.
