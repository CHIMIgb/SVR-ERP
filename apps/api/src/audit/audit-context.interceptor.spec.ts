import { ExecutionContext, CallHandler } from '@nestjs/common';
import { AuditContextInterceptor } from './audit-context.interceptor';
import { AuditContextService } from './audit-context.service';

describe('AuditContextInterceptor', () => {
  let interceptor: AuditContextInterceptor;
  let auditContext: AuditContextService;

  const mockRequest = (
    user?: { id?: string; email?: string; nombre?: string; sessionId?: string; jti?: string },
    ip?: string,
    userAgent?: string,
    method = 'GET',
    url = '/api/incidentes?page=1',
    originalUrl?: string,
  ) =>
    ({
      ip,
      socket: { remoteAddress: ip },
      headers: { 'user-agent': userAgent },
      user,
      method,
      url,
      originalUrl: originalUrl ?? url,
    } as never);

  const createContext = (req: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
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
      { id: 'user-1', email: 'admin@svr.com', nombre: 'Carlos SVR', sessionId: 'session-1', jti: 'jti-1' },
      '192.168.1.1',
      'Mozilla/5.0',
      'POST',
      '/api/incidentes',
    );
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx).toEqual({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-1',
          endpoint: '/api/incidentes',
          method: 'POST',
          jwtUserId: 'user-1',
          jwtEmail: 'admin@svr.com',
          jwtNombre: 'Carlos SVR',
          jti: 'jti-1',
        });
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
        expect(ctx).toEqual({
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
