import { ExecutionContext, CallHandler } from '@nestjs/common';
import { AuditContextInterceptor } from './audit-context.interceptor';
import { AuditContextService } from './audit-context.service';

describe('AuditContextInterceptor', () => {
  let interceptor: AuditContextInterceptor;
  let auditContext: AuditContextService;

  const mockRequest = (
    user?: { id?: string; sessionId?: string },
    ip?: string,
    userAgent?: string,
  ) =>
    ({
      ip,
      socket: { remoteAddress: ip },
      headers: { 'user-agent': userAgent },
      user,
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

  it('should populate ipAddress, userAgent, and sessionId from request', (done) => {
    const req = mockRequest(
      { id: 'user-1', sessionId: 'session-1' },
      '192.168.1.1',
      'Mozilla/5.0',
    );
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx).toEqual({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-1',
        });
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should handle requests without user (unauthenticated)', (done) => {
    const req = mockRequest(undefined, '10.0.0.1', 'UnknownAgent');
    const context = createContext(req);

    const next: CallHandler = {
      handle: () => {
        const ctx = auditContext.getContext();
        expect(ctx).toEqual({
          ipAddress: '10.0.0.1',
          userAgent: 'UnknownAgent',
          sessionId: undefined,
        });
        return { subscribe: () => done() } as never;
      },
    };

    interceptor.intercept(context, next).subscribe();
  });

  it('should fall back to socket.remoteAddress when req.ip is missing', (done) => {
    const req = { ip: undefined, socket: { remoteAddress: '172.16.0.1' }, headers: {}, user: undefined } as never;
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
