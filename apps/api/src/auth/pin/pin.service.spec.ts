import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, AuditResult } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PinService } from './pin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthService } from '../auth.service';

describe('PinService', () => {
  let service: PinService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let mockAudit: { log: jest.Mock };
  let mockAuth: { crearSesionYTokens: jest.Mock };

  const USER_ID = 'u-1';
  const NUM = 'TRA-0142';
  const PIN_OK = 'HV4K5R7M';
  const PIN_HASH_OK = bcrypt.hashSync(PIN_OK, 4);

  const usuario = (over: Record<string, unknown> = {}) => ({
    id: USER_ID,
    email: 't@svr',
    numero_empleado: NUM,
    pin_hash: PIN_HASH_OK,
    pin_temporal_hasta: null,
    pin_cambiado_en: new Date('2026-11-01'),
    pin_historial: [],
    intentos_pin: 0,
    cuenta_bloqueada_en: null,
    activo: true,
    eliminado_en: null,
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      users: {
        findFirst: jest.fn().mockResolvedValue(usuario()),
        findUnique: jest.fn().mockResolvedValue(usuario()),
        update: jest.fn().mockResolvedValue(usuario()),
      },
      sessions: {
        findMany: jest.fn().mockResolvedValue([{ id: 's-2' }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      refresh_tokens: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prisma)),
    };
    mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
    mockAuth = {
      crearSesionYTokens: jest.fn().mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        session: { id: 's-1', iniciadaEn: new Date(), expiraEn: new Date() },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compile();
    service = module.get(PinService);
  });

  describe('loginPin', () => {
    const dto = { numeroEmpleado: NUM, pin: PIN_OK };

    it('login exitoso: resetea intentos, crea sesión, audit LOGIN_EXITOSO y devuelve pinEstado', async () => {
      const r = await service.loginPin(dto, '1.1.1.1', 'UA');
      expect(r.accessToken).toBe('at');
      expect(r.pinEstado).toBeTruthy();
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ intentos_pin: 0 }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.LOGIN_EXITOSO, result: AuditResult.SUCCESS }),
      );
    });

    it('PIN incorrecto: incrementa intentos, audit LOGIN_FALLIDO PIN_INVALIDO', async () => {
      await expect(service.loginPin({ ...dto, pin: 'PQ7W2N9K' }, '1.1.1.1', 'UA')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ intentos_pin: 1 }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_FALLIDO,
          result: AuditResult.FAIL,
          errorCode: 'PIN_INVALIDO',
        }),
      );
    });

    it('5º intento fallido BLOQUEA la cuenta (CUENTA_BLOQUEADA) — audit FAIL', async () => {
      prisma.users.findFirst.mockResolvedValue(
        usuario({ intentos_pin: 4 }) as never,
      );
      await expect(service.loginPin({ ...dto, pin: 'PQ7W2N9K' }, '1.1.1.1', 'UA')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ intentos_pin: 5, cuenta_bloqueada_en: expect.any(Date) }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CUENTA_BLOQUEADA', result: AuditResult.FAIL }),
      );
    });

    it('cuenta bloqueada: rechaza ANTES de validar el PIN', async () => {
      prisma.users.findFirst.mockResolvedValue(
        usuario({ cuenta_bloqueada_en: new Date() }) as never,
      );
      await expect(service.loginPin(dto, '1.1.1.1', 'UA')).rejects.toThrow(
        'Cuenta bloqueada por intentos fallidos',
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CUENTA_BLOQUEADA' }),
      );
    });

    it('temporal expirado: PIN_TEMPORAL_EXPIRADO (solo reinicio lo re-activa)', async () => {
      prisma.users.findFirst.mockResolvedValue(
        usuario({ pin_temporal_hasta: new Date(Date.now() - 1000) }) as never,
      );
      await expect(service.loginPin(dto, '1.1.1.1', 'UA')).rejects.toThrow('expiró');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_TEMPORAL_EXPIRADO' }),
      );
    });

    it('usuario inexistente: CREDENCIALES_INVALIDAS (mismo mensaje anti-enumeración)', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.loginPin(dto, '1.1.1.1', 'UA')).rejects.toThrow(
        'Número de empleado o PIN incorrecto',
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CREDENCIALES_INVALIDAS' }),
      );
    });
  });

  describe('cambiarPin', () => {
    const dto = { pinActual: PIN_OK, pinNuevo: 'PQ7W2N9K' };

    it('cambio exitoso: re-hashea, guarda historial (últimos 3), cierra OTRAS sesiones, audit SUCCESS', async () => {
      const r = await service.cambiarPin(dto, USER_ID, 's-1', '1.1.1.1', 'UA');
      expect(r.message).toContain('otras sesiones');
      const data = prisma.users.update.mock.calls[0][0].data;
      expect(data.pin_temporal_hasta).toBeNull();
      expect(data.pin_historial).toHaveLength(1); // el hash viejo
      expect(prisma.sessions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['s-2'] } },
          data: expect.objectContaining({ activa: false }),
        }),
      );
      expect(prisma.refresh_tokens.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { session_id: { in: ['s-2'] } },
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.PIN_CAMBIADO, result: AuditResult.SUCCESS }),
      );
    });

    it('PIN actual incorrecto: PIN_INVALIDO + FAIL auditado, sin cambios', async () => {
      await expect(
        service.cambiarPin({ pinActual: 'PQ7W2N9K', pinNuevo: 'PQ7W2N9K' }, USER_ID, 's-1'),
      ).rejects.toThrow('PIN actual es incorrecto');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_INVALIDO', result: AuditResult.FAIL }),
      );
      expect(prisma.users.update).not.toHaveBeenCalled();
    });

    it('PIN nuevo débil (solo números): PIN_DEBIL + FAIL auditado', async () => {
      await expect(
        service.cambiarPin({ pinActual: PIN_OK, pinNuevo: '12345678' }, USER_ID, 's-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_DEBIL', result: AuditResult.FAIL }),
      );
    });

    it('PIN nuevo igual al actual: PIN_REPETIDO + FAIL auditado', async () => {
      await expect(
        service.cambiarPin({ pinActual: PIN_OK, pinNuevo: PIN_OK }, USER_ID, 's-1'),
      ).rejects.toThrow('últimos 3');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_REPETIDO', result: AuditResult.FAIL }),
      );
    });
  });

  describe('reiniciarPin (mesa de ayuda)', () => {
    const ACTOR = 'admin-1';

    it('genera temporal sin confusos, vence en 24h, cierra TODAS las sesiones, audit SUCCESS', async () => {
      const r = await service.reiniciarPin(USER_ID, ACTOR, '1.1.1.1', 'UA');
      expect(r.pinTemporal).toHaveLength(8);
      expect(r.pinTemporal).not.toMatch(/[0O1lI]/);
      const data = prisma.users.update.mock.calls[0][0].data;
      expect(data.pin_temporal_hasta).toBeInstanceOf(Date);
      expect(data.cuenta_bloqueada_en).toBeNull();
      expect(prisma.sessions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: USER_ID, activa: true }),
          data: expect.objectContaining({ activa: false }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.PIN_REINICIADO, result: AuditResult.SUCCESS }),
      );
    });

    it('usuario inexistente: FAIL USUARIO_NO_ENCONTRADO auditado', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      await expect(service.reiniciarPin('missing', ACTOR)).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'USUARIO_NO_ENCONTRADO', result: AuditResult.FAIL }),
      );
    });
  });

  describe('desbloquear (mesa de ayuda)', () => {
    it('limpia bloqueo e intentos, audit CUENTA_DESBLOQUEADA SUCCESS', async () => {
      prisma.users.findUnique.mockResolvedValue(
        usuario({ cuenta_bloqueada_en: new Date() }) as never,
      );
      const r = await service.desbloquear(USER_ID, 'admin-1');
      expect(r.message).toContain('desbloqueada');
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cuenta_bloqueada_en: null, intentos_pin: 0 }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CUENTA_DESBLOQUEADA,
          result: AuditResult.SUCCESS,
        }),
      );
    });
  });

  describe('estado', () => {
    it('avisa a los 25 días (avisar=true) y vencido a los 30', async () => {
      prisma.users.findUnique.mockResolvedValue(
        usuario({ pin_cambiado_en: new Date(Date.now() - 26 * 86_400_000) }) as never,
      );
      const r = await service.estado(USER_ID);
      expect(r.avisar).toBe(true);
      expect(r.vencido).toBe(false);

      prisma.users.findUnique.mockResolvedValue(
        usuario({ pin_cambiado_en: new Date(Date.now() - 31 * 86_400_000) }) as never,
      );
      const r2 = await service.estado(USER_ID);
      expect(r2.vencido).toBe(true);
      expect(r2.requiereCambio).toBe(true);
    });
  });
});
