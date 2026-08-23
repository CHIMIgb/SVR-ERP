import { AuditContextService } from './audit-context.service';

describe('AuditContextService', () => {
  let service: AuditContextService;

  beforeEach(() => {
    service = new AuditContextService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store and retrieve context synchronously', () => {
    const ctx = { ipAddress: '127.0.0.1', userAgent: 'TestAgent' };
    service.run(ctx, () => {
      expect(service.getContext()).toEqual(ctx);
    });
  });

  it('should propagate context through async code', async () => {
    const ctx = { ipAddress: '10.0.0.1', userAgent: 'AsyncAgent', sessionId: 'session-1' };

    await service.run(ctx, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(service.getContext()).toEqual(ctx);
    });
  });

  it('should return undefined outside of context', () => {
    expect(service.getContext()).toBeUndefined();
  });

  it('should isolate contexts between concurrent runs', async () => {
    const promiseA = service.run({ ipAddress: 'A' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return service.getContext()?.ipAddress;
    });

    const promiseB = service.run({ ipAddress: 'B' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return service.getContext()?.ipAddress;
    });

    const [ipA, ipB] = await Promise.all([promiseA, promiseB]);
    expect(ipA).toBe('A');
    expect(ipB).toBe('B');
  });
});
