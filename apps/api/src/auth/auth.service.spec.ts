import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { BloqueoService } from '../bloqueo/bloqueo.service';
import { IntentosLoginService } from './intentos-login.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, any>;
  let bloqueoService: {
    verificarBloqueo: jest.Mock;
    verificarBloqueoPorIP: jest.Mock;
    registrarIntentoFallido: jest.Mock;
    registrarIntentoFallidoPorIP: jest.Mock;
    resetearIntentos: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };
  let intentosLoginService: {
    registrar: jest.Mock;
    contarFallidosRecientes: jest.Mock;
  };

  const mockUser = {
    id: 'user-1',
    email: 'admin@svr-constructora.com',
    password_hash: '$2b$12$hashvalido',
    activo: true,
    eliminado_en: null,
    ultimo_login: null,
    personas_users_persona_idTopersonas: {
      nombre: 'Carlos',
      apellido_paterno: 'SVR',
      apellido_materno: null,
      correo: 'admin@svr-constructora.com',
    },
    users_roles_users_roles_user_idTousers: [
      {
        es_principal: true,
        roles: {
          id: 'rol-1',
          nombre: 'Administrador',
          nivel: 100,
          role_vistas: [
            {
              vista_id: 'vista-1',
              puede_ver: true,
              puede_crear: true,
              puede_editar: true,
              puede_eliminar: true,
              puede_exportar: true,
              vistas: {
                id: 'vista-1',
                nombre: 'Dashboard',
                ruta: '/dashboard',
                icono: 'LayoutDashboard',
                orden: 1,
              },
            },
          ],
          role_permissions: [
            {
              permissions: {
                modulo: 'dashboard',
                recurso: 'dashboard',
                accion: 'ver',
                activo: true,
              },
            },
          ],
        },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      users: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      sessions: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      refresh_tokens: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      personas: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      roles: {
        findFirst: jest.fn(),
      },
      users_roles: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    bloqueoService = {
      verificarBloqueo: jest.fn().mockResolvedValue({ bloqueado: false }),
      verificarBloqueoPorIP: jest.fn().mockResolvedValue({ bloqueado: false }),
      registrarIntentoFallido: jest.fn().mockResolvedValue({
        bloqueado: false,
        intentosRestantes: 4,
      }),
      registrarIntentoFallidoPorIP: jest.fn().mockResolvedValue({
        bloqueado: false,
      }),
      resetearIntentos: jest.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token-mock'),
    };

    intentosLoginService = {
      registrar: jest.fn().mockResolvedValue(undefined),
      contarFallidosRecientes: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: BloqueoService, useValue: bloqueoService },
        { provide: JwtService, useValue: jwtService },
        { provide: IntentosLoginService, useValue: intentosLoginService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debe retornar tokens y datos del usuario en login exitoso', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      prisma.sessions.create.mockResolvedValue({
        id: 'session-1',
        iniciada_en: new Date(),
        expira_en: new Date(),
      });
      prisma.refresh_tokens.create.mockResolvedValue({});
      prisma.users.update.mockResolvedValue({});

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashed');

      const resultado = await service.login(
        { email: 'admin@svr-constructora.com', password: 'password123' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(resultado.accessToken).toBeDefined();
      expect(resultado.refreshToken).toBeDefined();
      expect(resultado.user.email).toBe('admin@svr-constructora.com');
      expect(resultado.user.persona.nombre).toBe('Carlos');
      expect(resultado.user.roles).toHaveLength(1);
      expect(resultado.user.vistas).toHaveLength(1);
      expect(resultado.user.vistas[0].ruta).toBe('/dashboard');
      expect(resultado.user.permisos).toHaveLength(1);
      expect(prisma.sessions.create).toHaveBeenCalled();
      expect(bloqueoService.resetearIntentos).toHaveBeenCalledWith('user-1');
    });

    it('debe lanzar 401 si el email no existe', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar 401 si el usuario está desactivado', async () => {
      prisma.users.findUnique.mockResolvedValue({
        ...mockUser,
        activo: false,
      });

      await expect(
        service.login({ email: 'admin@svr-constructora.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar 401 si el usuario está eliminado', async () => {
      prisma.users.findUnique.mockResolvedValue({
        ...mockUser,
        eliminado_en: new Date(),
      });

      await expect(
        service.login({ email: 'admin@svr-constructora.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar 401 si la contraseña es incorrecta', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@svr-constructora.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bloqueoService.registrarIntentoFallido).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
    });

    it('debe lanzar 401 con mensaje de cuenta bloqueada si el usuario está bloqueado', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      bloqueoService.verificarBloqueo.mockResolvedValue({
        bloqueado: true,
        minutosRestantes: 15,
      });

      await expect(
        service.login({ email: 'admin@svr-constructora.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe llamar a registrarIntentoFallido cuando la contraseña falla y puede bloquear', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      bloqueoService.registrarIntentoFallido.mockResolvedValue({
        bloqueado: true,
        minutosBloqueo: 1,
      });

      await expect(
        service.login({ email: 'admin@svr-constructora.com', password: 'wrong' }),
      ).rejects.toThrow('Cuenta bloqueada por 1 minutos');
    });

    it('debe lanzar 401 si la IP está bloqueada antes de buscar el usuario', async () => {
      bloqueoService.verificarBloqueoPorIP.mockResolvedValue({
        bloqueado: true,
        minutosRestantes: 30,
      });

      await expect(
        service.login(
          { email: 'admin@svr-constructora.com', password: '123456' },
          '192.168.1.100',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow('Demasiados intentos desde esta IP');

      // No debe siquiera buscar el usuario
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
      expect(intentosLoginService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          motivoFallo: expect.stringContaining('IP bloqueada'),
        }),
      );
    });

    it('debe registrar intento por IP cuando el usuario no existe', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(
        service.login(
          { email: 'noexiste@test.com', password: '123456' },
          '10.0.0.1',
          'Mozilla/5.0',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(bloqueoService.registrarIntentoFallidoPorIP).toHaveBeenCalledWith(
        '10.0.0.1',
      );
    });
  });

  describe('register', () => {
    it('debe crear persona, usuario y retornar tokens', async () => {
      const nuevoUser = {
        id: 'user-2',
        email: 'juan@test.com',
        password_hash: '$2b$12$hashed',
        activo: true,
        eliminado_en: null,
        ultimo_login: null,
        personas_users_persona_idTopersonas: {
          nombre: 'Juan',
          apellido_paterno: 'Pérez',
          apellido_materno: null,
          correo: 'juan@test.com',
        },
        users_roles_users_roles_user_idTousers: [],
      };

      // 1ra llamada: verificar email no existe
      prisma.users.findUnique
        .mockResolvedValueOnce(null)
        // 2da llamada: login automático posterior al registro
        .mockResolvedValueOnce(nuevoUser);

      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashed');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      prisma.$transaction.mockImplementation(async (fn: Function) => {
        return fn({
          personas: {
            create: jest.fn().mockResolvedValue({ id: 'persona-1', nombre: 'Juan' }),
          },
          users: {
            create: jest.fn().mockResolvedValue({ id: 'user-2', email: 'juan@test.com' }),
          },
          roles: {
            findFirst: jest.fn().mockResolvedValue({ id: 'rol-1', nombre: 'Administrador' }),
          },
          users_roles: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      prisma.sessions.create.mockResolvedValue({
        id: 'session-2',
        iniciada_en: new Date(),
        expira_en: new Date(),
      });
      prisma.refresh_tokens.create.mockResolvedValue({});
      prisma.users.update.mockResolvedValue({});

      const resultado = await service.register(
        {
          email: 'juan@test.com',
          password: 'password123',
          nombre: 'Juan',
          apellido_paterno: 'Pérez',
        },
        '127.0.0.1',
      );

      expect(resultado.accessToken).toBeDefined();
      expect(resultado.refreshToken).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'admin@svr-constructora.com',
          password: 'password123',
          nombre: 'Carlos',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('logout', () => {
    it('debe cerrar sesiones y revocar tokens', async () => {
      prisma.sessions.updateMany.mockResolvedValue({ count: 1 });
      prisma.refresh_tokens.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('user-1');

      expect(prisma.sessions.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
          activa: true,
        },
        data: {
          activa: false,
          cerrada_en: expect.any(Date),
          motivo_cierre: 'Logout manual',
          actualizado_en: expect.any(Date),
        },
      });
    });
  });

  describe('getProfile', () => {
    it('debe retornar perfil con roles, vistas y permisos', async () => {
      prisma.users.findUnique.mockResolvedValue({
        ...mockUser,
        personas_users_persona_idTopersonas: mockUser.personas_users_persona_idTopersonas,
        users_roles_users_roles_user_idTousers: [
          {
            es_principal: true,
            roles: {
              id: 'rol-1',
              nombre: 'Administrador',
              nivel: 100,
              role_vistas: [
                {
                  vista_id: 'vista-1',
                  puede_ver: true,
                  puede_crear: true,
                  puede_editar: true,
                  puede_eliminar: true,
                  puede_exportar: true,
                  vistas: {
                    id: 'vista-1',
                    nombre: 'Dashboard',
                    ruta: '/dashboard',
                    icono: 'LayoutDashboard',
                    orden: 1,
                  },
                },
              ],
              role_permissions: [
                {
                  permissions: {
                    modulo: 'rrhh',
                    recurso: 'trabajadores',
                    accion: 'ver',
                    activo: true,
                  },
                },
              ],
            },
          },
        ],
      });

      const perfil = await service.getProfile('user-1');

      expect(perfil).not.toBeNull();
      expect(perfil!.id).toBe('user-1');
      expect(perfil!.roles).toHaveLength(1);
      expect(perfil!.roles[0].nombre).toBe('Administrador');
      expect(perfil!.vistas).toHaveLength(1);
      expect(perfil!.vistas[0].nombre).toBe('Dashboard');
      expect(perfil!.permisos).toHaveLength(1);
      expect(perfil!.permisos[0].modulo).toBe('rrhh');
    });

    it('debe retornar null si el usuario no existe', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      const perfil = await service.getProfile('user-inexistente');

      expect(perfil).toBeNull();
    });
  });
});
