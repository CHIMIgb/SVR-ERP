import { Test, TestingModule } from '@nestjs/testing';
import { BloqueoService } from './bloqueo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BloqueoService', () => {
  let service: BloqueoService;
  let prisma: {
    usuarios_bloqueados: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    niveles_bloqueo: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      usuarios_bloqueados: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      niveles_bloqueo: {
        findFirst: jest.fn(),
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

  describe('verificarBloqueo', () => {
    it('debe retornar bloqueado: false si no hay registro activo', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);

      const resultado = await service.verificarBloqueo('user-1');

      expect(resultado.bloqueado).toBe(false);
      expect(prisma.usuarios_bloqueados.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
          activo: true,
          bloqueado_hasta: { gt: expect.any(Date) },
        },
        orderBy: { creado_en: 'desc' },
      });
    });

    it('debe retornar bloqueado: true con minutos restantes si hay bloqueo activo', async () => {
      const futuro = new Date(Date.now() + 30 * 60000); // 30 min en el futuro
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'bloqueo-1',
        user_id: 'user-1',
        bloqueado_hasta: futuro,
        activo: true,
      });

      const resultado = await service.verificarBloqueo('user-1');

      expect(resultado.bloqueado).toBe(true);
      expect(resultado.minutosRestantes).toBeGreaterThanOrEqual(29);
      expect(resultado.minutosRestantes).toBeLessThanOrEqual(30);
    });
  });

  describe('registrarIntentoFallido', () => {
    it('debe incrementar intentos sin bloquear si es menor a 5', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);
      prisma.usuarios_bloqueados.create.mockResolvedValue({});

      const resultado = await service.registrarIntentoFallido('user-1', '127.0.0.1');

      expect(resultado.bloqueado).toBe(false);
      expect(resultado.intentosRestantes).toBe(4);
      expect(prisma.usuarios_bloqueados.create).toHaveBeenCalled();
    });

    it('debe bloquear al usuario al alcanzar 5 intentos fallidos', async () => {
      // Simular 4 intentos previos
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'reg-1',
        user_id: 'user-1',
        intentos_fallidos_consecutivos: 4,
        nivel_numero: 0,
        activo: true,
      });

      // determinarNivelBloqueo: nivel > 0 encontrado
      prisma.niveles_bloqueo.findFirst.mockResolvedValue({
        id: 'nivel-1',
        nivel: 1,
        duracion_minutos: 1,
        activo: true,
      });

      prisma.usuarios_bloqueados.update.mockResolvedValue({});

      const resultado = await service.registrarIntentoFallido('user-1');

      expect(resultado.bloqueado).toBe(true);
      expect(resultado.minutosBloqueo).toBe(1);
      expect(prisma.usuarios_bloqueados.update).toHaveBeenCalled();
    });

    it('debe escalar nivel de bloqueo si ya tuvo bloqueos previos', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'reg-1',
        user_id: 'user-1',
        intentos_fallidos_consecutivos: 4,
        nivel_numero: 1, // Ya tuvo nivel 1 antes
        activo: true,
      });

      // determinarNivelBloqueo: nivel > 1 encontrado
      prisma.niveles_bloqueo.findFirst.mockResolvedValue({
        id: 'nivel-2',
        nivel: 2,
        duracion_minutos: 5,
        activo: true,
      });

      prisma.usuarios_bloqueados.update.mockResolvedValue({});

      const resultado = await service.registrarIntentoFallido('user-1');

      expect(resultado.bloqueado).toBe(true);
      expect(resultado.minutosBloqueo).toBe(5);
    });
  });

  describe('resetearIntentos', () => {
    it('debe resetear intentos si hay registro con intentos > 0', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue({
        id: 'reg-1',
        user_id: 'user-1',
        intentos_fallidos_consecutivos: 3,
        activo: true,
      });
      prisma.usuarios_bloqueados.update.mockResolvedValue({});

      await service.resetearIntentos('user-1');

      expect(prisma.usuarios_bloqueados.update).toHaveBeenCalledWith({
        where: { id: 'reg-1' },
        data: {
          intentos_fallidos_consecutivos: 0,
          desbloqueado_en: expect.any(Date),
          actualizado_en: expect.any(Date),
        },
      });
    });

    it('no debe hacer nada si no hay registro con intentos', async () => {
      prisma.usuarios_bloqueados.findFirst.mockResolvedValue(null);

      await service.resetearIntentos('user-1');

      expect(prisma.usuarios_bloqueados.update).not.toHaveBeenCalled();
    });
  });

  describe('desbloquear', () => {
    it('debe desbloquear usuario por un administrador', async () => {
      prisma.usuarios_bloqueados.updateMany.mockResolvedValue({ count: 1 });

      await service.desbloquear('user-1', 'admin-1');

      expect(prisma.usuarios_bloqueados.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
          activo: true,
          bloqueado_hasta: { gt: expect.any(Date) },
        },
        data: {
          activo: false,
          desbloqueado_en: expect.any(Date),
          desbloqueado_manualmente_por: 'admin-1',
          actualizado_en: expect.any(Date),
        },
      });
    });
  });
});
