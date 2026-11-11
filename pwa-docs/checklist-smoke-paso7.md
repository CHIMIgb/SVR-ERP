# Checklist de humo — paso 7 de la PWA (probar en el teléfono)

> Ejecutado con: web en `http://192.168.0.104:3000` (tu LAN) · API en `:3001`
> **Sin HTTPS el GPS/cámara/instalación no funcionan** — el marcado ✅📷/📶
> requiere HTTPS (servir por un túnel o el servidor final).
> Server smoke HTTP ya corrido por el agente: login-pin ✅, estado ✅,
> cambio ✅, reinicio ✅, repetidos/débiles rechazados ✅ (ver commit y
> `historial-cambios/`).

## Cuentas para probar

| Número | PIN | Rol |
|---|---|---|
| `TRA-0142` | **temporal de 24 h: `7KPDR3BA`** (generado hoy para tu smoke — la app te OBLIGARÁ a crear tu propio PIN al entrar ✅ paso 3 del ciclo) | Trabajador |
| `RES-014` | `SVR26DEM` | Residente |
| `TEC-007` | `SVR26DEM` | Técnico Mecánico |
| `COB-003` | `SVR26DEM` | Cobrador |
| `ADM-01` | `SVR26DEM` | Administrador |

⚠️ El PIN `SVR26DEM` de TRA-0142 ya NO sirve ( quedó en su historial de
últimos 3 — regla "distinto de los últimos 3" ✅ probado).

## Qué probar (en orden)

1. **Login dual:** abre la web desde el teléfono → debe aparecer el formulario
   **número + PIN** (no email/password). ❌ si pide email en el teléfono.
2. **Teclado alfanumérico:** al tocar las casillas del PIN el teclado debe ser
   el completo (con letras), no el numérico.
3. **Primer ingreso con temporal (TRA-0142 / 7KPDR3BA):** debe ENTRAR y
   mandarte directo a **"Cambia tu PIN"** — crea tu PIN propio (8 caracteres,
   sin repetidos, con letra y número) → te deja en /m.
4. **Shell + nav por rol:** pestañas del fondo = Inicio · Asistencia ·
   Reportes · Contactos · Perfil (para TRA). Sin pestañas ajenas a tu rol.
5. **Guard por vista:** escribe directo `/m/pos` en el teléfono con la cuenta
   TRA → debe regresarte a `/m` (RBAC).
6. **Guards de ancho:** abre `/dashboard` en el teléfono → debe mandarte a
   `/m`. En el escritorio abre `/m` → debe mandarte al dashboard.
7. **Interruptores:** en el shell móvil, "Ver versión de escritorio" →
   dashboard; en el sidebar, "Versión móvil" → PWA.
8. **Banner 25 días:** con una cuenta con PIN recién cambiado NO debe
   aparecer; aparece a los 25 días (los demo quedaron con PIN fresco —
   cambiarán la fecha si quieres verlo).
9. **Mesa de ayuda (escritorio, admin):** bloquear una cuenta (5 PINs
   mal en el teléfono) → desde el escritorio reiniciar PIN con clic →
   temporal 24h → el trabajador vuelve a entrar.
10. **📷/📶 Con HTTPS:** instalación de la PWA, cámara y GPS. Requiere
    servir por HTTPS (túnel o servidor final) — sin eso, marcar como
    pendiente de infraestructura.
