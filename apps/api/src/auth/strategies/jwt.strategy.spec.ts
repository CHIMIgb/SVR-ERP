import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/auth.types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: Record<string, any>;

  const validPayload: JwtPayload = {
    sub: 'user-1',
    email: 'admin@svr-constructora.com',
    jti: 'jti-access-123',
    tipo: 'access',
  };

  beforeEach(() => {
    prisma = {
      token_blacklist: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      users: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'admin@svr-constructora.com',
          activo: true,
          eliminado_en: null,
        }),
      },
    };

    strategy = new JwtStrategy(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── BLACKLIST ──
  describe('blacklist check', () => {
    it('debe rechazar 401 si el token está en la blacklist', async () => {
      prisma.token_blacklist.findUnique.mockResolvedValue({
        jti: 'jti-access-123',
        tipo: 'ACCESS',
        razon: 'Logout manual',
      });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'Token de acceso revocado',
      );
    });

    it('debe permitir si el token NO está en la blacklist', async () => {
      const result = await strategy.validate(validPayload);

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('admin@svr-constructora.com');
      expect(result.jti).toBe('jti-access-123');
    });

    it('debe consultar la blacklist con el JTI del token', async () => {
      await strategy.validate(validPayload);

      expect(prisma.token_blacklist.findUnique).toHaveBeenCalledWith({
        where: { jti: 'jti-access-123' },
      });
    });
  });

  // ── USER VALIDATION ──
  describe('user validation', () => {
    it('debe rechazar 401 si el usuario no existe', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'Usuario no válido o deshabilitado',
      );
    });

    it('debe rechazar 401 si el usuario está desactivado', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@svr-constructora.com',
        activo: false,
        eliminado_en: null,
      });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe rechazar 401 si el usuario fue eliminado (soft delete)', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@svr-constructora.com',
        activo: true,
        eliminado_en: new Date(),
      });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe retornar id, email y jti si todo es válido', async () => {
      const result = await strategy.validate(validPayload);

      expect(result).toEqual({
        id: 'user-1',
        email: 'admin@svr-constructora.com',
        jti: 'jti-access-123',
      });
    });

    it('debe consultar el usuario por el sub del payload (con nombre de persona)', async () => {
      await strategy.validate(validPayload);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          activo: true,
          eliminado_en: true,
          personas_users_persona_idTopersonas: {
            select: { nombre: true, apellido_paterno: true, apellido_materno: true },
          },
        },
      });
    });

    it('debe incluir el nombre completo de la persona en req.user', async () => {
      prisma.users.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@svr.com',
        activo: true,
        eliminado_en: null,
        personas_users_persona_idTopersonas: {
          nombre: 'Carlos',
          apellido_paterno: 'García',
          apellido_materno: 'López',
        },
      });

      const result = await strategy.validate(validPayload);

      expect(result.nombre).toBe('Carlos García López');
    });
  });

  // ── SECUENCIA DE VERIFICACIÓN ──
  describe('verification order', () => {
    it('debe verificar blacklist ANTES de buscar el usuario', async () => {
      // Token en blacklist: no debe ni buscar el usuario
      prisma.token_blacklist.findUnique.mockResolvedValue({ jti: 'jti-access-123' });

      await expect(strategy.validate(validPayload)).rejects.toThrow();

      expect(prisma.token_blacklist.findUnique).toHaveBeenCalled();
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
    });

   it('debe verificar usuario DESPUÉS de pasar el check de blacklist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        'Usuario no válido',
      );

      expect(prisma.token_blacklist.findUnique).toHaveBeenCalled();
      expect(prisma.users.findUnique).toHaveBeenCalled();
    });
  });
});
