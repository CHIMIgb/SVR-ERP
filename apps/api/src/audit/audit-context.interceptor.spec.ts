import { ExecutionContext, CallHandler } from '@nestjs/common';
import { AuditContextInterceptor } from './audit-context.interceptor';
import { AuditContextService } from './audit-context.service';

describe('AuditContextInterceptor', () => {
  let interceptor: AuditContextInterceptor;
  let auditContext: AuditContextService;

  const mockRequest = (
    user?: { id?: string; email?: string; nombre?: string; sessionId?: string; jti?: string; iat?: number },
    ip?: string,
    userAgent?: string,
    method = 'GET',
    url = '/api/incidentes?page=1',
    originalUrl?: string,
    extra: Record<string, unknown> = {},
  ) =>
    ({
      ip,
      socket: { remoteAddress: ip },
      headers: { 'user-agent': userAgent, ...((extra.headers as object) ?? {}) },
      user,
      method,
      url,
      originalUrl: originalUrl ?? url,
      query: extra.query ?? {},
      auditRoles: extra.auditRoles,
      ...extra,
    } as never);

  const createContext = (req: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as ExecutionContext);

  beforeEach(() => {
    auditContext = new AuditContextService();
    interceptor = new AuditContextInterceptor(auditContext);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should populate ipAddress, userAgent, sessionId, endpoint, method and JWT info from request', (done) => {
    const req = mockRequest(
      { id: 'user-1', email: 'admin@svr.com', nombre: 'Carlos SVR', sessionId: 'session-1', jti: 'jti-1', iat: 1756000000 },
      '192.168.1.1',
      'Mozilla/5.0',
      'POST',
      '/api/incidentes',
      undefined,
      { auditRoles: ['Administrador'] },
    );
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx).toMatchObject({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-1',
          endpoint: '/api/incidentes',
          method: 'POST',
          jwtUserId: 'user-1',
          jwtEmail: 'admin@svr.com',
          jwtNombre: 'Carlos SVR',
          jti: 'jti-1',
          jwtIat: 1756000000,
          roles: ['Administrador'],
          statusCode: 200,
          origen: { plataforma: 'web', appVersion: undefined },
        });
        expect(ctx?.requestId).toEqual(expect.any(String));
        expect(ctx?.correlationId).toBe(ctx?.requestId);
        expect(ctx?.startedAt).toEqual(expect.any(Number));
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should capture sanitized query params only for GET requests', (done) => {
    const req = mockRequest(
      { id: 'user-1' },
      '10.0.0.1',
      'Mozilla/5.0',
      'GET',
      '/api/incidentes?estado=ABIERTO&prioridad=CRITICA&page=2',
    );
    (req as Record<string, unknown>).query = {
      estado: 'ABIERTO',
      prioridad: 'CRITICA',
      page: '2',
      password_hash: 'secreto',
    };
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx?.query).toEqual({
          estado: 'ABIERTO',
          prioridad: 'CRITICA',
          page: '2',
          password_hash: '[REDACTED]',
        });
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should NOT capture query params for non-GET methods', (done) => {
    const req = mockRequest({ id: 'user-1' }, '10.0.0.1', 'UA', 'POST', '/api/incidentes');
    (req as Record<string, unknown>).query = { algo: 'valor' };
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        expect(auditContext.getContext()?.query).toBeUndefined();
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should reuse X-Request-Id and X-Correlation-Id headers when present', (done) => {
    const req = mockRequest(
      undefined,
      '10.0.0.1',
      'UA',
      'GET',
      '/x',
      undefined,
      { headers: { 'x-request-id': 'req-externo', 'x-correlation-id': 'corr-externa' } },
    );
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx?.requestId).toBe('req-externo');
        expect(ctx?.correlationId).toBe('corr-externa');
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should detect plataforma movil via user-agent de Capacitor', (done) => {
    const req = mockRequest(undefined, '10.0.0.1', 'Mozilla/5.0 CapacitorJS/6', 'GET', '/x');
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        expect(auditContext.getContext()?.origen).toMatchObject({ plataforma: 'movil' });
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should handle requests without user (unauthenticated) but keep endpoint/method', (done) => {
    const req = mockRequest(undefined, '10.0.0.1', 'UnknownAgent', 'POST', '/api/auth/login');
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx).toMatchObject({
          ipAddress: '10.0.0.1',
          userAgent: 'UnknownAgent',
          sessionId: undefined,
          endpoint: '/api/auth/login',
          method: 'POST',
          jwtUserId: undefined,
          jwtEmail: undefined,
          jwtNombre: undefined,
          jti: undefined,
        });
        expect(ctx?.roles).toBeUndefined();
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should fall back to socket.remoteAddress when req.ip is missing', (done) => {
    const req = {
      ip: undefined,
      socket: { remoteAddress: '172.16.0.1' },
      headers: {},
      user: undefined,
      method: 'GET',
      url: '/x',
      originalUrl: '/x',
    } as never;
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx?.ipAddress).toBe('172.16.0.1');
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });
});
