# Login: validaciones es-MX cliente+servidor y textos de marca

**Fecha:** 2026-11-04
**Autor:** agente OpenCode (a petición del usuario)

## Cambios realizados
- **`apps/web/src/app/page.tsx` (login):**
  - Validación propia en español ANTES de enviar: email con formato válido,
    contraseña mínimo 8 caracteres; mensajes inline bajo el campo con borde rojo
    (se limpian al escribir); `noValidate` para no depender del validador nativo del
    navegador (salía en inglés); `autoComplete` email/current-password; `aria-invalid`.
  - Textos: "Bienvenido a SVR" (antes "al ERP"); botón solo "Iniciar Sesión"
    (se quitó la flecha); footer "SISTEMA DESARROLLADO POR ARAZAK"
    (antes "SVR CONSTRUCTORA © 2025 — V2.0").
- **`apps/api/src/auth/dto/login.dto.ts`:** mínimo de contraseña 6→8 caracteres y
  mensajes class-validator en español (email/tamaño/DoS 128). Se mantiene leniente
  en complejidad (sin `@Matches`: prioridad a longitud, todo carácter permitido),
  hallazgo: bloqueo de contraseñas comunes/HIBP son cosas de REGISTRO (futuro).
- **`apps/web/src/providers/AuthProvider.tsx`:** si el backend devuelve errores de
  validación (`error.details`), ahora se MUSTRAN; antes cualquier error se
  sobreescribía con "Credenciales incorrectas", incluso el 400 de validación.
- **No cambia:** rate limiting/bloqueo (ya existe: Throttler login 5/15min +
  bloqueo por IP escalonado 10/15→60min con 423), complejidad forzada, HIBP.

## Cosas nuevas
- `apps/api/src/auth/dto/login.dto.spec.ts` (6 tests: válido, caracteres libres,
  email inválido, corta 8, larga 128, no-string).

## Archivos tocados
- `apps/web/src/app/page.tsx` (modificado)
- `apps/web/src/providers/AuthProvider.tsx` (modificado)
- `apps/api/src/auth/dto/login.dto.ts` (modificado)
- `apps/api/src/auth/dto/login.dto.spec.ts` (creado)

## Pruebas / verificación
- `npm run test` (apps/api): 998/1000 ✔ — los 2 fallas son pre-existentes en
  `cobranza.service.spec` (export CSV BOM/escapes, commit 89f1605e), ajenos a este
  cambio.
- `npx tsc --noEmit` (apps/web): limpio ✔.
- Pendiente verificar en el navegador (login real con admin@svr-constructora.com).

## Pendientes y riesgos
- Contraseña min 8 en `RegisterDto` quedó pendiente — este cambio solo tocó
  `LoginDto` (el alcance pedido: login); si se quiere en registro,
  es un cambio de 1 línea + spec.
- CI sugerido aún no existe.
