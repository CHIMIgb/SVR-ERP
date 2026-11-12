# 2026-11-12 — docs: nota de despliegue (trust proxy y el bloqueo por IP) en los 3 documentos

## Qué se documentó

La advertencia del despliegue con servidor — el bloqueo por IP de la
autenticación usa `req.ip`, que sin `trust proxy` es la IP directa de la
conexión (hoy, en LAN, la real de cada dispositivo ✓). Cuando exista servidor
detrás de nginx: `app.set('trust proxy', 1)` en `apps/api/src/main.ts` (SOLO
el primer salto) y nginx SIEMPRE pisando `X-Forwarded-For` con
`$remote_addr` — sin eso todos comparten la IP del proxy (un mal actor
bloquea a la oficina entera); con trust proxy abierto un atacante suplanta
la cabecera y rota IPs falsas para esquivar el bloqueo. Preferible dominio +
Let's Encrypt (nadie instala CA propia en los teléfonos).

En los 3 lugares (para humanos y agentes de IA):

1. **README.md** — sección nueva **"Despliegue con servidor — trust proxy y
   el bloqueo por IP (⚠️ día del despliegue)"** (tras "Zona horaria",
   antes de "Build para Móvil"), con los dos errores a no cometer y la
   configuración correcta.
2. **AGENTS.md** — subsección en "Backend (NestJS + Prisma)".
3. **.opencode/agent/svr-erp.md** — bullet en "Gotchas que matan horas".

## Verificación / pruebas

- Solo docs — sin código.

## Pendientes / riesgos

- Ninguno funcional. La configuración de `trust proxy` se hace EL DÍA del
  despliegue, no antes.
