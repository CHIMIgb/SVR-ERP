import { Test, TestingModule } from '@nestjs/testing';
import { BloqueoService } from './bloqueo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BloqueoService', () => {
  let service: BloqueoService;
  let prisma: Record<string, any>;

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
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloqueoService,
        { provide: PrismaService, useValue: prisma },
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
      const futuro = new Date(Date.now() + 30 * 60000); // 30 min en el futuro
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
      const pasado = new Date(Date.now() - 10 * 60000); // hace 10 min

      // Mock inteligente: solo retorna si bloqueado_hasta > now
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
    it('debe incrementar intentos sin bloquear si es menor a 5', async () => {
      const result = await service.registrarIntentoFallido('user-1', '10.0.0.1');

      expect(result.bloqueado).toBe(false);
      expect(result.intentosRestantes).toBe(4);
      expect(prisma.usuarios_bloqueados.create).toHaveBeenCalled();
    });

    it('debe bloquear al usuario al alcanzar 5 intentos fallidos', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'b1',
        user_id: 'user-1',
        intentos_fallidos_consecutivos: 4,
        nivel_numero: 0,
        activo: true,
      });

      const result = await service.registrarIntentoFallido('user-1');

      expect(result.bloqueado).toBe(true);
      expect(result.intentosRestantes).toBe(0);
      expect(result.minutosBloqueo).toBe(5);
    });

    it('debe escalar nivel de bloqueo si ya tuvo bloqueos previos', async () => {
      prisma.usuarios_bloqueados.findFirst
        .mockResolvedValueOnce({
          id: 'b1',
          user_id: 'user-1',
          intentos_fallidos_consecutivos: 4,
          nivel_numero: 1,
          activo: true,
        })
        .mockResolvedValueOnce(null); // verificarBloqueoPorIP

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

    it('debe registrar intento por IP cuando se proporciona IP', async () => {
      // IP no bloqueada actualmente, menos de 10 fallos
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);
      prisma.intentos_login.count.mockResolvedValue(3);

      const result = await service.registrarIntentoFallido('user-1', '192.168.1.1');

      expect(result.bloqueado).toBe(false);
      expect(result.bloqueadoPorIP).toBe(false);
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
      // No debe contar intentos ni crear nuevo registro
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
});
