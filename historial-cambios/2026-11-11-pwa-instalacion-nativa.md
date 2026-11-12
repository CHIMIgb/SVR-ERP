# PWA — retirada del código custom de instalación + documentación del CA en el teléfono

**Fecha:** 2026-11-11
**Autor:** agent (GLM-5.3-Flash / ponytail)
**Rama:** `pwa-base`

## Cambios realizados

**Decisión del cliente:** el diálogo de instalación debe ser el NATIVO del
navegador (como su ejemplo), no un modal custom — y la causa del
«No se puede instalar esta app» es el certificado de mkcert sin confianza
EN EL TELÉFONO.

1. **Fuera todo el código custom de instalación:**
   - `components/pwa/ModalInstalar.tsx` (eliminado)
   - `lib/pwa/instalar.ts` (eliminado)
   - El script de captura en el layout raíz ya no existía (se perdió con el
     incidente del disco lleno) — y conforme a la independencia
     escritorio/PWA, NO vuelve: el SW de la PWA se registra solo en el
     shell móvil.
   - `(pwa)/layout.tsx`: fuera el render del modal y sus estados
     (`promptEvent` ya no existía; `instalada`/`cerrarModal` fuera).
   El diálogo nativo de Chrome se muestra SOLO cuando el certificado es de
   confianza en el teléfono — sin código que lo intercepte.
2. **README**: documentado el paso que faltaba — instalar el `rootCA.pem`
   como certificado CA EN EL TELÉFONO (Configuración → certificado CA), el
   cierre completo de Chrome tras instalarlo, y el porqué: aceptar el aviso
   con "Avanzado → Ir a" NO cuenta como contexto de confianza para Chrome
   (es el motivo del «No se puede instalar esta app»).
3. Los íconos del casco SVR quedan (paso D) — Chrome los muestra en el
   diálogo nativo y en el ícono instalado.

## Archivos tocados

- `apps/web/src/components/pwa/ModalInstalar.tsx` (eliminado)
- `apps/web/src/lib/pwa/instalar.ts` (eliminado)
- `apps/web/src/app/(pwa)/layout.tsx` (limpieza)
- `README.md` (paso del CA en el teléfono)

## Pruebas / verificación

- `tsc` web ✅ (sin errores tras la limpieza).
- La verificación del diálogo nativo es en el TELÉFONO tras el paso del CA
  (Configuración → certificado CA → cerrar Chrome → reabrir).

## Pendientes y riesgos

- Sin push (orden del usuario).
- **El paso del CA en el teléfono queda como acción del usuario** (2 min,
  instrucciones en README): sin eso Chrome jamás instalará la PWA —
  condición del navegador, no forzable por código.
