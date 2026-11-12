# PWA base — paso C: modal automático de instalación con prompt nativo

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

**Fuera el banner custom** (`BannerInstalar.tsx` eliminado) — la UX nueva es la
que pidió el cliente con su ejemplo (Webby's Barbershop):

1. **Modal automático** (`components/pwa/ModalInstalar.tsx`, nuevo): sale SOLO
   cada vez que se accede desde el navegador cuando la app NO está instalada
   (check `display-mode: standalone` en el layout). Estilo como el ejemplo:
   ícono de marca + "SVR Constructora" + origen + **Cancelar/Instalar**.
2. **«Instalar» lanza el DIÁLOGO NATIVO del navegador** (`promptEvent.prompt()`
   — `beforeinstallprompt` capturado en el layout): el diálogo clásico
   "Instalar aplicación — Cancelar/Instalar" que muestra el cliente en su
   ejemplo. Sin cajas de texto propias: el navegador hace su diálogo.
3. **Cancelar** cierra el modal solo por la visita (`sessionStorage` — vuelve
   en el próximo acceso, como pidió el cliente: "cada que se acceda").
4. Tras instalar (`appinstalled`), el layout detecta `standalone` y el modal
   desaparece para siempre — la app queda **instalada como PWA real**
   (ícono SVR en el escritorio del teléfono, no acceso directo de Chrome).

## Archivos tocados

- `apps/web/src/components/pwa/ModalInstalar.tsx` (nuevo)
- `apps/web/src/app/(pwa)/layout.tsx` (promptEvent/instalada/cerrarModal + modal)
- `apps/web/src/components/pwa/BannerInstalar.tsx` (eliminado)

## Pruebas / verificación

- `tsc` ✅; eslint ✅.
- Requiere el **certificado de confianza en el teléfono** (mkcert de la IP +
  rootCA instalado en el teléfono) para que el navegador entregue el prompt —
  ver README §HTTPS (paso B documentado).

## Pendientes y riesgos

- Sin push (orden del usuario).
- Sin el cert confiable, `beforeinstallprompt` no existe y el modal muestra
  la nota de instrucciones (menú ⋮) — correcto pero no instala.
