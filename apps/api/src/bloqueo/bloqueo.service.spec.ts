import { Test, TestingModule } from '@nestjs/testing';
import { BloqueoService } from './bloqueo.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('BloqueoService', () => {
  let service: BloqueoService;
  let prisma: Record<string, any>;
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      usuarios_bloqueados: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
      },
      niveles_bloqueo: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'nivel-1',
          nivel: 1,
          duracion_minutos: 5,
          activo: true,
        }),
      },
      intentos_login: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloqueoService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(BloqueoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── verificarBloqueo ──

  describe('verificarBloqueo', () => {
    it('debe retornar bloqueado: false si no hay registro activo', async () => {
      const result = await service.verificarBloqueo('user-1');
      expect(result).toEqual({ bloqueado: false });
    });

    it('debe retornar bloqueado: true con minutos restantes si hay bloqueo activo', async () => {
      const futuro = new Date(Date.now() + 30 * 60000);
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'b1',
        user_id: 'user-1',
        bloqueado_hasta: futuro,
      });

      const result = await service.verificarBloqueo('user-1');

      expect(result.bloqueado).toBe(true);
      expect(result.minutosRestantes).toBeDefined();
      expect(result.minutosRestantes).toBeGreaterThan(0);
    });
  });

  // ── verificarBloqueoPorIP ──

  describe('verificarBloqueoPorIP', () => {
    it('debe retornar bloqueado: false si la IP no está bloqueada', async () => {
      const result = await service.verificarBloqueoPorIP('192.168.1.1');
      expect(result).toEqual({ bloqueado: false });
    });

    it('debe retornar bloqueado: true si la IP tiene bloqueo activo', async () => {
      const futuro = new Date(Date.now() + 60 * 60000);
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'b-ip-1',
        ip_address: '192.168.1.1',
        user_id: null,
        activo: true,
        bloqueado_hasta: futuro,
      });

      const result = await service.verificarBloqueoPorIP('192.168.1.1');

      expect(result.bloqueado).toBe(true);
      expect(result.minutosRestantes).toBeGreaterThan(0);
    });

    it('debe ignorar bloqueos expirados', async () => {
      prisma.usuarios_bloqueados.findFirst.mockImplementation(
        (args: any) => {
          const hasta = args?.where?.bloqueado_hasta?.gt;
          if (hasta && hasta > new Date()) {
            return Promise.resolve({
              id: 'b-ip-2',
              ip_address: '192.168.1.1',
              user_id: null,
              activo: true,
              bloqueado_hasta: hasta,
            });
          }
          return Promise.resolve(null);
        },
      );

      const result = await service.verificarBloqueoPorIP('192.168.1.1');
      expect(result).toEqual({ bloqueado: false });
    });
  });

  // ── registrarIntentoFallido (usuario) ──

  describe('registrarIntentoFallido', () => {
    it('debe retornar 4 intentos restantes en el primer fallo (sin registro previo)', async () => {
      // Sin registro en usuarios_bloqueados, 0 fallos recientes en intentos_login
      prisma.intentos_login.findFirst.mockResolvedValue(null);
      prisma.intentos_login.count.mockResolvedValue(0);

      const result = await service.registrarIntentoFallido('user-1', '10.0.0.1');

      expect(result.bloqueado).toBe(false);
      expect(result.intentosRestantes).toBe(4);
      // NO debe crear registro en usuarios_bloqueados (CHECK constraint lo impide)
      expect(prisma.usuarios_bloqueados.create).not.toHaveBeenCalled();
      expect(prisma.usuarios_bloqueados.update).not.toHaveBeenCalled();
    });

    it('debe bloquear al alcanzar 5 intentos fallidos contando desde intentos_login', async () => {
      // Sin registro previo en usuarios_bloqueados, pero 4 fallos en intentos_login
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);
      prisma.intentos_login.findFirst.mockResolvedValue(null); // sin último éxito
      prisma.intentos_login.count.mockResolvedValue(4); // 4 fallos previos + 1 actual = 5

      const result = await service.registrarIntentoFallido('user-1');

      expect(result.bloqueado).toBe(true);
      expect(result.intentosRestantes).toBe(0);
      expect(result.minutosBloqueo).toBe(5);
      expect(prisma.usuarios_bloqueados.create).toHaveBeenCalled();
    });

    it('debe incrementar desde registro previo si existe', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'b1',
        user_id: 'user-1',
        intentos_fallidos_consecutivos: 3,
        nivel_numero: 0,
        activo: true,
      });

      const result = await service.registrarIntentoFallido('user-1', '10.0.0.1');

      expect(result.bloqueado).toBe(false);
      expect(result.intentosRestantes).toBe(1); // 5 - (3+1)
      expect(prisma.usuarios_bloqueados.update).toHaveBeenCalled();
    });

    it('debe escalar nivel de bloqueo si ya tuvo bloqueos previos', async () => {
      prisma.usuarios_bloqueados.findFirst
        .mockResolvedValueOnce({
          id: 'b1',
          user_id: 'user-1',
          intentos_fallidos_consecutivos: 4,
          nivel_numero: 1,
          activo: true,
        });

      prisma.niveles_bloqueo.findFirst
        .mockResolvedValueOnce({
          id: 'nivel-2',
          nivel: 2,
          duracion_minutos: 15,
          activo: true,
        });

      const result = await service.registrarIntentoFallido('user-1', '10.0.0.1');

      expect(result.bloqueado).toBe(true);
      expect(result.minutosBloqueo).toBe(15);
    });

    it('debe contar desde intentos_login desde el último éxito', async () => {
      const ultimoExito = new Date('2026-08-22T20:00:00Z');
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);
      prisma.intentos_login.findFirst.mockResolvedValue({
        creado_en: ultimoExito,
      });
      // 4 fallos desde el último éxito + 1 actual = 5
      prisma.intentos_login.count.mockResolvedValue(4);

      const result = await service.registrarIntentoFallido('user-1');

      expect(result.bloqueado).toBe(true);
      // Verificar que contó desde la fecha del último éxito
      expect(prisma.intentos_login.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 'user-1',
            exitoso: false,
            creado_en: { gte: ultimoExito },
          }),
        }),
      );
    });

    it('no debe lanzar error si registrarIntentoUsuario falla (try/catch)', async () => {
      prisma.usuarios_bloqueados.findFirst.mockRejectedValue(
        new Error('DB connection lost'),
      );

      const result = await service.registrarIntentoFallido('user-1', '10.0.0.1');

      // No debe lanzar — fallback seguro
      expect(result.bloqueado).toBe(false);
      expect(result.intentosRestantes).toBe(4);
    });
  });

  // ── registrarIntentoFallidoPorIP ──

  describe('registrarIntentoFallidoPorIP', () => {
    it('debe retornar bloqueado: false si hay menos de 10 fallos', async () => {
      prisma.intentos_login.count.mockResolvedValue(5);

      const result = await service.registrarIntentoFallidoPorIP('10.0.0.1');

      expect(result).toEqual({ bloqueado: false });
    });

    it('debe bloquear la IP al alcanzar 10 fallos', async () => {
      prisma.intentos_login.count.mockResolvedValue(10);

      const result = await service.registrarIntentoFallidoPorIP('10.0.0.1');

      expect(result.bloqueado).toBe(true);
      expect(result.minutosBloqueo).toBe(60);
      expect(prisma.usuarios_bloqueados.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ip_address: '10.0.0.1',
            user_id: null,
          }),
        }),
      );
    });

    it('no debe bloquear si la IP ya está bloqueada', async () => {
      const futuro = new Date(Date.now() + 30 * 60000);
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'b-ip-existing',
        ip_address: '10.0.0.1',
        user_id: null,
        activo: true,
        bloqueado_hasta: futuro,
      });

      const result = await service.registrarIntentoFallidoPorIP('10.0.0.1');

      expect(result.bloqueado).toBe(true);
      expect(prisma.intentos_login.count).not.toHaveBeenCalled();
    });
  });

  // ── resetearIntentos ──

  describe('resetearIntentos', () => {
    it('debe resetear intentos si hay registro con intentos > 0', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'b1',
        intentos_fallidos_consecutivos: 3,
      });

      await service.resetearIntentos('user-1');

      expect(prisma.usuarios_bloqueados.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            intentos_fallidos_consecutivos: 0,
          }),
        }),
      );
    });

    it('no debe hacer nada si no hay registro con intentos', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);

      await service.resetearIntentos('user-1');

      expect(prisma.usuarios_bloqueados.update).not.toHaveBeenCalled();
    });
  });

  // ── desbloquear ──

  describe('desbloquear', () => {
    it('debe desbloquear usuario por un administrador', async () => {
      await service.desbloquear('user-1', 'admin-1');

      expect(prisma.usuarios_bloqueados.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 'user-1' }),
          data: expect.objectContaining({
            activo: false,
            desbloqueado_manualmente_por: 'admin-1',
          }),
        }),
      );
    });
  });

  // ── desbloquearIP ──

  describe('desbloquearIP', () => {
    it('debe desbloquear una IP por un administrador', async () => {
      await service.desbloquearIP('192.168.1.1', 'admin-1');

      expect(prisma.usuarios_bloqueados.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ip_address: '192.168.1.1',
            user_id: null,
          }),
          data: expect.objectContaining({
            activo: false,
            desbloqueado_manualmente_por: 'admin-1',
          }),
        }),
      );
    });
  });

  // ── Auditoría de bloqueos ──

  describe('auditoría de bloqueos', () => {
    it('debe registrar auditoría USUARIO_BLOQUEADO con actorType SYSTEM cuando se bloquea un usuario', async () => {
      // 4 intentos previos en intentos_login → el 5to bloquea
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);
      prisma.intentos_login.findFirst.mockResolvedValue(null);
      prisma.intentos_login.count.mockResolvedValue(4);

      await service.registrarIntentoFallido('user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USUARIO_BLOQUEADO',
          entityType: 'usuarios_bloqueados',
          entityId: 'user-1',
          actorType: 'SYSTEM',
          result: 'SUCCESS',
        }),
      );
    });

    it('debe registrar auditoría IP_BLOQUEADA con actorType SYSTEM cuando se bloquea una IP', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);
      prisma.intentos_login.count.mockResolvedValue(10);

      await service.registrarIntentoFallidoPorIP('10.0.0.1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'IP_BLOQUEADA',
          entityType: 'usuarios_bloqueados',
          entityId: '10.0.0.1',
          actorType: 'SYSTEM',
          result: 'SUCCESS',
        }),
      );
    });

    it('no debe registrar auditoría de bloqueo si el usuario no alcanza el umbral', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);
      prisma.intentos_login.findFirst.mockResolvedValue(null);
      prisma.intentos_login.count.mockResolvedValue(0);

      await service.registrarIntentoFallido('user-1');

      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('no debe registrar auditoría de IP si hay menos de 10 fallos', async () => {
      prisma.intentos_login.count.mockResolvedValue(5);

      await service.registrarIntentoFallidoPorIP('10.0.0.1');

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });
});
