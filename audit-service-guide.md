# Servicio de Auditoría — SVR-ERP

Guía de la implementación actual del sistema de auditoría en `apps/api/src/audit/`.

## 1. Propósito

El módulo de auditoría registra eventos relevantes en la tabla `registro_auditoria`. Su objetivo es que **ningún service ni controller tenga que pasar manualmente** datos HTTP como `ip_address`, `user_agent` o `session_id`; esos campos se capturan automáticamente desde el request mediante `AsyncLocalStorage`.

## 2. Arquitectura Actual

```
Request HTTP
     │
     ▼
┌─────────────────────────────────────────────────────┐
│ JwtAuthGuard / PermissionsGuard                     │
│  • Valida JWT y asigna req.user = {id, email, jti,  │
│    sessionId}                                        │
├─────────────────────────────────────────────────────┤
│ AuditContextInterceptor (APP_INTERCEPTOR global)    │
│  • Se ejecuta DESPUÉS de los guards                 │
│  • Lee req.ip, req.headers['user-agent'],           │
│    req.user.sessionId                                │
│  • Guarda el contexto en AsyncLocalStorage          │
├─────────────────────────────────────────────────────┤
│ Controller                                            │
│  • Solo delega al Service; no toca auditoría        │
├─────────────────────────────────────────────────────┤
│ Service                                               │
│  • Ejecuta lógica de negocio                         │
│  • Llama AuditService.log({action, entityType,      │
│    entityId, result, ...})                           │
├─────────────────────────────────────────────────────┤
│ AuditService                                          │
│  • Combina el DTO con el contexto del request       │
│  • Persiste en registro_auditoria                   │
└─────────────────────────────────────────────────────┘
```

## 3. Componentes

### 3.1 `AuditContextService`

Wrapper de `AsyncLocalStorage` que mantiene un contexto por request:

```ts
export interface AuditRequestContext {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}
```

- `run(context, callback)`: ejecuta código dentro de un contexto.
- `getContext()`: devuelve el contexto actual o `undefined`.

### 3.2 `AuditContextInterceptor`

Interceptor global registrado en `AuditModule` como `APP_INTERCEPTOR`. Se ejecuta después de los guards y almacena en `AsyncLocalStorage`:

```ts
const store: AuditRequestContext = {
  ipAddress: req.ip ?? req.socket?.remoteAddress ?? undefined,
  userAgent: req.headers['user-agent'] ?? undefined,
  sessionId: user?.sessionId ?? undefined,
  endpoint: req.originalUrl ?? req.url,
  method: req.method,
  jwtUserId: user?.id,
  jwtEmail: user?.email,
  jwtNombre: user?.nombre,   // viene del JwtStrategy (persona vinculada al user)
  jti: user?.jti,
};
```

### 3.3 `AuditService`

Punto único de contacto para registrar auditoría.

```ts
await this.auditService.log({
  action: AuditAction.ARTICULO_CREADO,
  entityType: 'articulos_inventario',
  entityId: articulo.id,
  result: AuditResult.SUCCESS,
  actorUserId: userId,          // obligatorio para saber quién actuó
  actorType: 'USER',
  actorRole: 'autenticado',
  newValue: serialized,
});
```

Campos que `AuditService.log()` completa automáticamente desde el contexto:

| Campo en DB    | Origen automático                                          |
| -------------- | ---------------------------------------------------------- |
| `ip_address`   | `dto.ipAddress` > `ctx.ipAddress` > `'unknown'`            |
| `user_agent`   | `dto.userAgent` > `ctx.userAgent` > `'unknown'`            |
| `session_id`   | `dto.sessionId` > `ctx.sessionId` > `null`                 |
| `metadata`     | **Mínimo obligatorio** (ver abajo) + `dto.metadata`        |

Los valores explícitos del DTO siempre tienen prioridad (útil para login/logout u operaciones sin JWT).

#### Metadata mínima obligatoria

Todo registro incluye SIEMPRE un objeto `metadata` con, al mínimo:

```json
{
  "endpoint": "/api/proyectos?page=2",
  "method": "POST",
  "jwt": {
    "userId": "550e8400-...",
    "email": "admin@svr-constructora.com",
    "nombre": "Carlos García López",
    "jti": "id-del-token"
  }
}
```

Reglas:

1. `endpoint` y `method` provienen del request capturado por el interceptor global — presentes en toda operación HTTP.
2. `jwt` se llena con la información del token validado por `JwtAuthGuard`. El nombre completo viene de la persona vinculada al usuario (`JwtStrategy`). En endpoints públicos (login) el bloque puede venir parcial o ausente.
3. `dto.metadata` puede **agregar** claves (ej. `{ motivo }`) pero nunca eliminar las mínimas.
4. Si no hay contexto HTTP (job del sistema, cron), la metadata queda `{ "source": "SYSTEM" }` — un registro nunca queda sin metadata.

Para que el JWT incluya el nombre, `JwtStrategy.validate()` lo resuelve desde la persona vinculada al usuario y lo expone en `req.user.nombre`.

### 3.4 `AuditModule`

```ts
@Module({
  providers: [
    AuditService,
    AuditContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
  exports: [AuditService, AuditContextService],
})
export class AuditModule {}
```

`AuditModule` se importa en `AppModule`; el interceptor se aplica globalmente a todos los controllers.

## 4. Captura Automática de `session_id`

El access token JWT ahora incluye `sessionId`:

```ts
export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  tipo: 'access' | 'refresh';
  sessionId?: string;
}
```

- `AuthService.login()` firma el access token con `sessionId: session.id`.
- `AuthService.refreshTokens()` hace lo mismo al rotar tokens.
- `JwtStrategy.validate()` devuelve `{ id, email, jti, sessionId }`.
- `AuditContextInterceptor` lee `req.user.sessionId` y lo pone en el contexto.

Tokens antiguos sin `sessionId` simplemente dejan el campo como `null` en `registro_auditoria`.

## 5. Cómo Usar el Servicio de Auditoría

### 5.1 Caso común — endpoint autenticado

```ts
@Injectable()
export class InventarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateArticuloDto, userId: string) {
    // ... lógica de negocio ...

    await this.auditService.log({
      action: AuditAction.ARTICULO_CREADO,
      entityType: 'articulos_inventario',
      entityId: articulo.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }
}
```

**No es necesario pasar `ipAddress`, `userAgent` ni `sessionId`.**

### 5.2 Caso especial — endpoint sin JWT (login)

En login no hay JWT, así que el contexto no tiene `sessionId`. El service lo pasa explícitamente:

```ts
await this.auditService.log({
  action: AuditAction.LOGIN_EXITOSO,
  entityType: 'sessions',
  entityId: session.id,
  result: AuditResult.SUCCESS,
  actorUserId: user.id,
  actorType: 'USER',
  actorRole: 'autenticado',
  sessionId: session.id,      // override explícito
});
```

`ip_address` y `user_agent` aún se obtienen automáticamente del request porque el interceptor sí corre, aunque `req.user` esté vacío.

### 5.3 Registrar fallos

```ts
await this.auditService.logFailure({
  action: AuditAction.STOCK_INSUFICIENTE,
  entityType: 'articulos_inventario',
  entityId: dto.articuloId,
  actorUserId: userId,
  actorType: 'USER',
  actorRole: 'autenticado',
  errorCode: 'INSUFFICIENT_STOCK',
  metadata: { stockActual, solicitado: dto.cantidad },
});
```

`logFailure` asigna automáticamente `result: 'FAIL'` y `severity: 'CRITICAL'`.

## 6. Seguridad y Resiliencia

- `AuditService.log()` **nunca propaga errores**. Si falla el INSERT, solo se loguea; la operación de negocio continúa.
- `previousValue` y `newValue` se sanitizan con `AUDIT_SENSITIVE_FIELDS` para evitar guardar contraseñas, hashes o tokens.

## 7. Tests

- **Unitarios**: `audit-context.service.spec.ts`, `audit-context.interceptor.spec.ts`, `audit.service.spec.ts`.
- **Integración**: `inventario.integration.spec.ts` y `auth.integration.spec.ts` verifican registros reales en `registro_auditoria`.

Comando para correr:

```bash
npm run test                    # unitarios
npm run test:integration        # integración
```

## 8. Hoja de Ruta (no implementado aún)

Funcionalidades que pueden agregarse en el futuro según necesidad:

- `request_id` / `correlation_id` por request.
- Decoradores `@SkipAudit()` y `@Auditable()`.
- Helpers `logUpdate()`, `logSystem()`, `logBatch()`.
- Auditoría automática de errores 500 desde `AllExceptionsFilter`.
- Middleware previo a guards para cubrir también endpoints públicos sin interceptor.

## 9. Archivos Relacionados

```
apps/api/src/
├── audit/
│   ├── audit.module.ts
│   ├── audit.service.ts
│   ├── audit.service.spec.ts
│   ├── audit-context.service.ts
│   ├── audit-context.service.spec.ts
│   ├── audit-context.interceptor.ts
│   ├── audit-context.interceptor.spec.ts
│   ├── audit.types.ts
│   └── audit.constants.ts
├── auth/
│   ├── auth.service.ts
│   ├── strategies/jwt.strategy.ts
│   └── types/auth.types.ts
└── inventario/
    ├── inventario.service.ts
    └── inventario.controller.ts
```
