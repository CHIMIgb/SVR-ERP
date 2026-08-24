import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, AuditResult } from '@prisma/client';
import { AuditService } from './audit.service';
import { AuditContextService } from './audit-context.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let auditContext: AuditContextService;

  const mockPrisma = {
    registro_auditoria: {
      create: jest.fn().mockResolvedValue(undefined),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        AuditContextService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AuditService);
    auditContext = module.get(AuditContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const baseDto = {
    action: AuditAction.LOGIN_EXITOSO,
    entityType: 'users',
    entityId: 'c0000000-0000-0000-0000-000000000001',
    result: AuditResult.SUCCESS,
    actorUserId: 'c0000000-0000-0000-0000-000000000001',
  };

  it('should write explicit ipAddress/userAgent/sessionId from DTO', async () => {
    await service.log({
      ...baseDto,
      ipAddress: '10.0.0.1',
      userAgent: 'ExplicitAgent',
      sessionId: 'session-123',
    });

    expect(mockPrisma.registro_auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ip_address: '10.0.0.1',
          user_agent: 'ExplicitAgent',
          session_id: 'session-123',
        }),
      }),
    );
  });

  it('should fall back to AsyncLocalStorage context for ip/userAgent/sessionId', async () => {
    await auditContext.run(
      {
        ipAddress: '127.0.0.1',
        userAgent: 'AsyncAgent',
        sessionId: 'session-als',
      },
      async () => {
        await service.log(baseDto);
      },
    );

    expect(mockPrisma.registro_auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ip_address: '127.0.0.1',
          user_agent: 'AsyncAgent',
          session_id: 'session-als',
        }),
      }),
    );
  });

  it('should let DTO fields override AsyncLocalStorage context', async () => {
    await auditContext.run(
      {
        ipAddress: '127.0.0.1',
        userAgent: 'AsyncAgent',
        sessionId: 'session-als',
      },
      async () => {
        await service.log({
          ...baseDto,
          ipAddress: '10.0.0.2',
          sessionId: 'session-dto',
        });
      },
    );

    expect(mockPrisma.registro_auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ip_address: '10.0.0.2',
          user_agent: 'AsyncAgent',
          session_id: 'session-dto',
        }),
      }),
    );
  });

  it('should default ip_address and user_agent to "unknown" when no context', async () => {
    await service.log(baseDto);

    expect(mockPrisma.registro_auditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ip_address: 'unknown',
          user_agent: 'unknown',
          session_id: null,
        }),
      }),
    );
  });

  describe('metadata automática', () => {
    it('should always register metadata with endpoint, method and JWT info from context', async () => {
      await auditContext.run(
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Agent',
          sessionId: 'session-als',
          endpoint: '/api/proyectos?page=2',
          method: 'POST',
          jwtUserId: 'user-1',
          jwtEmail: 'admin@svr.com',
          jwtNombre: 'Carlos SVR',
          jti: 'jti-abc',
        },
        async () => {
          await service.log(baseDto);
        },
      );

      expect(mockPrisma.registro_auditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              endpoint: '/api/proyectos?page=2',
              method: 'POST',
              jwt: {
                userId: 'user-1',
                email: 'admin@svr.com',
                nombre: 'Carlos SVR',
                jti: 'jti-abc',
              },
            }),
          }),
        }),
      );
    });

    it('should let DTO metadata add keys without removing the minimum ones', async () => {
      await auditContext.run(
        {
          endpoint: '/api/incidentes',
          method: 'PATCH',
          jwtUserId: 'user-1',
          jwtEmail: 'a@b.com',
        },
        async () => {
          await service.log({ ...baseDto, metadata: { motivo: 'prueba' } });
        },
      );

      const call = mockPrisma.registro_auditoria.create.mock.calls[0][0];
      expect(call.data.metadata).toMatchObject({
        endpoint: '/api/incidentes',
        method: 'PATCH',
        motivo: 'prueba',
        jwt: { userId: 'user-1' },
      });
    });

    it('should fall back to { source: SYSTEM } when there is no HTTP context (never empty metadata)', async () => {
      await service.log(baseDto);

      const call = mockPrisma.registro_auditoria.create.mock.calls[0][0];
      expect(call.data.metadata).toEqual({ source: 'SYSTEM' });
    });
  });

  it('should never propagate audit failures to caller', async () => {
    mockPrisma.registro_auditoria.create.mockRejectedValue(new Error('DB down'));

    await expect(service.log(baseDto)).resolves.toBeUndefined();
  });

  describe('logFailure', () => {
    it('should log a failure with CRITICAL severity', async () => {
      await service.logFailure({
        action: AuditAction.STOCK_INSUFICIENTE,
        entityType: 'articulos_inventario',
        entityId: '',
        errorCode: 'INSUFFICIENT_STOCK',
      });

      expect(mockPrisma.registro_auditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            result: 'FAIL',
            severity: 'CRITICAL',
            entity_id: expect.any(String),
          }),
        }),
      );
    });

    it('should log a denied access with WARNING severity', async () => {
      await service.logFailure({
        action: AuditAction.LOGIN_FALLIDO,
        entityType: 'users',
        entityId: '',
        denied: true,
      });

      expect(mockPrisma.registro_auditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            result: 'DENIED',
            severity: 'WARNING',
          }),
        }),
      );
    });
  });
});
