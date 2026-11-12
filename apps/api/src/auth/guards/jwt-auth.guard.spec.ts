import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard, bloqueadoPorCambioPin } from './jwt-auth.guard';

describe('JwtAuthGuard — enforcement del cambio de PIN (PR #18 #4)', () => {
  const ctx = (ruta: string, user: unknown): ExecutionContext => {
    const req = { route: { path: ruta }, user };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  };

  const mockUserSinClaim = { id: 'u-1', requierePinCambio: false };
  const mockUserConClaim = { id: 'u-1', requierePinCambio: true };

  it('sin claim rpc: deja pasar TODO', async () => {
    expect(bloqueadoPorCambioPin(mockUserSinClaim, 'auth/profile')).toBe(false);
    expect(bloqueadoPorCambioPin(undefined, 'criba')).toBe(false);
  });

  it('con claim rpc: bloquea rutas fuera de la whitelist', () => {
    expect(bloqueadoPorCambioPin(mockUserConClaim, 'criba')).toBe(true);
    expect(bloqueadoPorCambioPin(mockUserConClaim, 'trabajadores/:id')).toBe(true);
  });

  it('con claim rpc: permite pin/cambio, pin/estado, logout y profile', () => {
    expect(bloqueadoPorCambioPin(mockUserConClaim, 'auth/pin/cambio')).toBe(false);
    expect(bloqueadoPorCambioPin(mockUserConClaim, 'auth/pin/estado')).toBe(false);
    expect(bloqueadoPorCambioPin(mockUserConClaim, 'auth/logout')).toBe(false);
    expect(bloqueadoPorCambioPin(mockUserConClaim, 'auth/profile')).toBe(false);
    // Nest 11 + Express 5: req.route.path incluye el prefijo global
    expect(bloqueadoPorCambioPin(mockUserConClaim, '/api/auth/profile')).toBe(false);
    expect(bloqueadoPorCambioPin(mockUserConClaim, '/api/auth/pin/cambio')).toBe(false);
    expect(bloqueadoPorCambioPin(mockUserConClaim, '/api/trabajadores')).toBe(true);
  });

  it('canActivate: autentica y lanza 403 si el claim bloquea la ruta', async () => {
    const guard = new JwtAuthGuard();
    jest
      // canActivate de AuthGuard('jwt') — se stubbea la cadena de passport
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockResolvedValue(true as never);

    await expect(
      guard.canActivate(ctx('criba', mockUserConClaim)),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      guard.canActivate(ctx('auth/pin/cambio', mockUserConClaim)),
    ).resolves.toBe(true);
  });
});
