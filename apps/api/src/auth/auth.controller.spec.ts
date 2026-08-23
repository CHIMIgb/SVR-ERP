import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    register: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    getProfile: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'access-mock',
        refreshToken: 'refresh-mock',
        user: { id: 'user-1', email: 'test@test.com', persona: { nombre: 'Test' } },
        session: { id: 'session-1', iniciadaEn: new Date(), expiraEn: new Date() },
      }),
      register: jest.fn().mockResolvedValue({
        accessToken: 'access-mock',
        refreshToken: 'refresh-mock',
        user: { id: 'user-2', email: 'nuevo@test.com', persona: { nombre: 'Nuevo' } },
        session: { id: 'session-2', iniciadaEn: new Date(), expiraEn: new Date() },
      }),
      refresh: jest.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }),
      logout: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        roles: [],
        vistas: [],
        permisos: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (overrides: Record<string, any> = {}) => ({
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'TestAgent/1.0' },
    user: { id: 'user-1', jti: 'jti-1' },
    ...overrides,
  });

  describe('login', () => {
    it('debe llamar a authService.login con dto, ip y userAgent', async () => {
      const dto = { email: 'test@test.com', password: '123456' };
      const req = mockRequest();

      const resultado = await controller.login(dto, req as any);

      expect(authService.login).toHaveBeenCalledWith(
        dto,
        '127.0.0.1',
        'TestAgent/1.0',
      );
      expect(resultado.accessToken).toBe('access-mock');
    });
  });

  describe('register', () => {
    it('debe llamar a authService.register con dto, ip y userAgent', async () => {
      const dto = {
        email: 'nuevo@test.com',
        password: '123456',
        nombre: 'Nuevo',
      };
      const req = mockRequest();

      const resultado = await controller.register(dto, req as any);

      expect(authService.register).toHaveBeenCalledWith(
        dto,
        '127.0.0.1',
        'TestAgent/1.0',
      );
      expect(resultado.accessToken).toBe('access-mock');
    });
  });

  describe('refresh', () => {
    it('debe llamar a authService.refresh con userId y jti', async () => {
      const req = mockRequest({ user: { id: 'user-1', jti: 'jti-old' } });

      const resultado = await controller.refresh({ refreshToken: 'token' } as any, req as any);

      expect(authService.refresh).toHaveBeenCalledWith('user-1', 'jti-old');
      expect(resultado.accessToken).toBe('new-access');
    });
  });

  describe('logout', () => {
    it('debe llamar a authService.logout con userId, jti y tokenHash', async () => {
      const req = mockRequest({
        headers: {
          'user-agent': 'TestAgent/1.0',
          authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.test-token.signature',
        },
      });

      const resultado = await controller.logout(req as any);

      expect(authService.logout).toHaveBeenCalledWith(
        'user-1',
        'jti-1',
        expect.any(String), // SHA-256 hash del token
      );
      expect(resultado.message).toBe('Sesión cerrada exitosamente');
    });
  });

  describe('getProfile', () => {
    it('debe llamar a authService.getProfile con userId', async () => {
      const req = mockRequest();

      const resultado = await controller.getProfile(req as any);

      expect(authService.getProfile).toHaveBeenCalledWith('user-1');
      expect(resultado).not.toBeNull();
      expect(resultado!.id).toBe('user-1');
    });
  });
});
