import { Test, TestingModule } from '@nestjs/testing';
import { IntentosLoginService } from './intentos-login.service';
import { PrismaService } from '../prisma/prisma.service';

describe('IntentosLoginService', () => {
  let service: IntentosLoginService;
  let prisma: {
    intentos_login: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      intentos_login: {
        create: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntentosLoginService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(IntentosLoginService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrar', () => {
    it('debe crear un registro con los datos correctos', async () => {
      await service.registrar({
        email: 'test@test.com',
        userId: 'user-1',
        exitoso: true,
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(prisma.intentos_login.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          email_intentado: 'test@test.com',
          exitoso: true,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
        }),
      });
    });

    it('debe registrar intento fallido con motivo', async () => {
      await service.registrar({
        email: 'test@test.com',
        exitoso: false,
        motivoFallo: 'Contraseña incorrecta',
      });

      expect(prisma.intentos_login.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: null,
          email_intentado: 'test@test.com',
          exitoso: false,
          motivo_fallo: 'Contraseña incorrecta',
        }),
      });
    });

    it('no debe lanzar error si falla la inserción', async () => {
      prisma.intentos_login.create.mockRejectedValue(new Error('DB error'));

      // No debe lanzar — fire-and-forget
      await expect(
        service.registrar({
          email: 'test@test.com',
          exitoso: true,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('contarFallidosRecientes', () => {
    it('debe contar intentos fallidos de los últimos 15 minutos', async () => {
      prisma.intentos_login.count.mockResolvedValue(3);

      const count = await service.contarFallidosRecientes('test@test.com');

      expect(count).toBe(3);
      expect(prisma.intentos_login.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email_intentado: 'test@test.com',
          exitoso: false,
          creado_en: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      });
    });

    it('debe aceptar un rango de tiempo personalizado', async () => {
      prisma.intentos_login.count.mockResolvedValue(0);

      await service.contarFallidosRecientes('test@test.com', 30);

      expect(prisma.intentos_login.count).toHaveBeenCalled();
    });

    it('debe retornar 0 si no hay intentos', async () => {
      prisma.intentos_login.count.mockResolvedValue(0);

      const count = await service.contarFallidosRecientes('nuevo@test.com');

      expect(count).toBe(0);
    });
  });

  describe('buscarPorUsuario', () => {
    it('debe retornar intentos ordenados por fecha descendente', async () => {
      const mockIntentos = [
        {
          id: '1',
          email_intentado: 'test@test.com',
          exitoso: true,
          motivo_fallo: null,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla',
          creado_en: new Date(),
        },
      ];
      prisma.intentos_login.findMany.mockResolvedValue(mockIntentos);

      const result = await service.buscarPorUsuario('user-1');

      expect(result).toHaveLength(1);
      expect(prisma.intentos_login.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        orderBy: { creado_en: 'desc' },
        take: 20,
        select: expect.any(Object),
      });
    });

    it('debe aceptar un límite personalizado', async () => {
      prisma.intentos_login.findMany.mockResolvedValue([]);

      await service.buscarPorUsuario('user-1', 5);

      expect(prisma.intentos_login.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe('buscarPorEmail', () => {
    it('debe retornar intentos por email', async () => {
      prisma.intentos_login.findMany.mockResolvedValue([]);

      const result = await service.buscarPorEmail('test@test.com');

      expect(result).toEqual([]);
      expect(prisma.intentos_login.findMany).toHaveBeenCalledWith({
        where: { email_intentado: 'test@test.com' },
        orderBy: { creado_en: 'desc' },
        take: 20,
        select: expect.any(Object),
      });
    });
  });
});
