import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, AuditResult } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PinService } from './pin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthService } from '../auth.service';
import { BloqueoService } from '../../bloqueo/bloqueo.service';
import { IntentosLoginService } from '../intentos-login.service';

describe('PinService', () => {
  let service: PinService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let mockAudit: { log: jest.Mock; logFailure: jest.Mock };
  let mockAuth: { crearSesionYTokens: jest.Mock; getProfile: jest.Mock };
  let mockBloqueo: { verificarBloqueoPorIP: jest.Mock; registrarIntentoFallidoPorIP: jest.Mock };
  let mockIntentos: { registrar: jest.Mock };

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
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      users_roles: {
        findFirst: jest.fn().mockResolvedValue(null), // ni objetivo ni actor son Administrador
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
    mockAudit = { log: jest.fn().mockResolvedValue(undefined), logFailure: jest.fn().mockResolvedValue(undefined) };
    mockBloqueo = {
      verificarBloqueoPorIP: jest.fn().mockResolvedValue({ bloqueado: false }),
      registrarIntentoFallidoPorIP: jest.fn().mockResolvedValue({ bloqueado: false }),
    };
    mockIntentos = { registrar: jest.fn().mockResolvedValue(undefined) };
    mockAuth = {
      crearSesionYTokens: jest.fn().mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        session: { id: 's-1', iniciadaEn: new Date(), expiraEn: new Date() },
      }),
      // el login-pin ahora devuelve el perfil COMPLETO (UserAuth) — paso 3
      getProfile: jest.fn().mockResolvedValue({
        id: USER_ID,
        email: 't@svr',
        persona: { nombre: 'Test' },
        roles: [{ id: 'r1', nombre: 'Trabajador', nivel: 20, esPrincipal: true }],
        vistas: [],
        permisos: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: AuthService, useValue: mockAuth },
        { provide: BloqueoService, useValue: mockBloqueo },
        { provide: IntentosLoginService, useValue: mockIntentos },
      ],
    }).compile();
    service = module.get(PinService);
  });

  describe('loginPin', () => {
    const dto = { numeroEmpleado: NUM, pin: PIN_OK };
    const MENSAJE_GENERICO = 'Número de empleado o PIN incorrecto';

    it('login exitoso: resetea intentos y bloqueo, registra intento, audit LOGIN_EXITOSO y pinEstado', async () => {
      const r = await service.loginPin(dto, '1.1.1.1', 'UA');
      expect(r.accessToken).toBe('at');
      expect(r.pinEstado).toBeTruthy();
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ intentos_pin: 0, cuenta_bloqueada_en: null }),
        }),
      );
      expect(mockIntentos.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ email: NUM, exitoso: true, ip: '1.1.1.1' }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.LOGIN_EXITOSO, result: AuditResult.SUCCESS }),
      );
    });

    it('PIN incorrecto: incrementa atómicamente, registra intento+IP, audit LOGIN_FALLIDO PIN_INVALIDO', async () => {
      prisma.users.update.mockResolvedValueOnce({ intentos_pin: 1 } as never);
      await expect(service.loginPin({ ...dto, pin: 'PQ7W2N9K' }, '1.1.1.1', 'UA')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ intentos_pin: { lt: 5 } }),
          data: expect.objectContaining({ intentos_pin: { increment: 1 } }),
        }),
      );
      expect(mockIntentos.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ email: NUM, exitoso: false, ip: '1.1.1.1' }),
      );
      expect(mockBloqueo.registrarIntentoFallidoPorIP).toHaveBeenCalledWith('1.1.1.1');
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_FALLIDO,
          errorCode: 'PIN_INVALIDO',
        }),
      );
    });

    it('5º intento fallido BLOQUEA la cuenta (CUENTA_BLOQUEADA) — audit FAIL', async () => {
      prisma.users.findFirst.mockResolvedValue(
        usuario({ intentos_pin: 4 }) as never,
      );
      prisma.users.update.mockResolvedValueOnce({ intentos_pin: 5 } as never); // 4 → 5
      await expect(service.loginPin({ ...dto, pin: 'PQ7W2N9K' }, '1.1.1.1', 'UA')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ intentos_pin: 5, cuenta_bloqueada_en: expect.any(Date) }),
        }),
      );
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CUENTA_BLOQUEADA' }),
      );
    });

    it('cuenta bloqueada (ventana viva): rechaza ANTES de validar el PIN con mensaje genérico', async () => {
      prisma.users.findFirst.mockResolvedValue(
        usuario({ cuenta_bloqueada_en: new Date() }) as never,
      );
      await expect(service.loginPin(dto, '1.1.1.1', 'UA')).rejects.toThrow(MENSAJE_GENERICO);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CUENTA_BLOQUEADA' }),
      );
    });

    it('bloqueo TEMPORAL: vencidos los 15 min la cuenta se auto-desbloquea (PR #18 #3)', async () => {
      prisma.users.findFirst.mockResolvedValue(
        usuario({ cuenta_bloqueada_en: new Date(Date.now() - 16 * 60_000), intentos_pin: 5 }) as never,
      );
      const r = await service.loginPin(dto, '1.1.1.1', 'UA');
      expect(r.accessToken).toBe('at'); // entró
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ intentos_pin: 0, cuenta_bloqueada_en: null }),
        }),
      );
    });

    it('temporal expirado: PIN_TEMPORAL_EXPIRADO con el mismo mensaje genérico (anti-enumeración)', async () => {
      prisma.users.findFirst.mockResolvedValue(
        usuario({ pin_temporal_hasta: new Date(Date.now() - 1000) }) as never,
      );
      await expect(service.loginPin(dto, '1.1.1.1', 'UA')).rejects.toThrow(MENSAJE_GENERICO);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_TEMPORAL_EXPIRADO' }),
      );
    });

    it('usuario inexistente: CREDENCIALES_INVALIDAS con el mismo mensaje genérico', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.loginPin(dto, '1.1.1.1', 'UA')).rejects.toThrow(MENSAJE_GENERICO);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CREDENCIALES_INVALIDAS' }),
      );
    });

    it('IP bloqueada: rechaza con la maquinaria del login por email (IP_BLOCKED auditado)', async () => {
      mockBloqueo.verificarBloqueoPorIP.mockResolvedValue({ bloqueado: true, minutosRestantes: 42 });
      await expect(service.loginPin(dto, '1.1.1.1', 'UA')).rejects.toThrow('Demasiados intentos desde esta IP');
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'IP_BLOCKED', ipAddress: '1.1.1.1' }),
      );
    });

    it('anti-enumeración: inexistente, bloqueada y temporal expirado responden EXACTAMENTE lo mismo', async () => {
      const mensajes: string[] = [];
      prisma.users.findFirst.mockResolvedValueOnce(null as never);
      prisma.users.findFirst.mockResolvedValueOnce(usuario({ cuenta_bloqueada_en: new Date() }) as never);
      prisma.users.findFirst.mockResolvedValueOnce(
        usuario({ pin_temporal_hasta: new Date(Date.now() - 1000) }) as never,
      );
      for (const caso of [dto, dto, dto]) {
        try {
          await service.loginPin(caso, '1.1.1.1', 'UA');
        } catch (e) {
          mensajes.push((e as Error).message);
        }
      }
      expect(new Set(mensajes).size).toBe(1);
      expect(mensajes[0]).toBe(MENSAJE_GENERICO);
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
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_INVALIDO' }),
      );
      expect(prisma.users.update).not.toHaveBeenCalled();
    });

    it('PIN nuevo débil (solo números): PIN_DEBIL + FAIL auditado', async () => {
      await expect(
        service.cambiarPin({ pinActual: PIN_OK, pinNuevo: '12345678' }, USER_ID, 's-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_DEBIL' }),
      );
    });

    it('PIN nuevo igual al actual: PIN_REPETIDO + FAIL auditado', async () => {
      await expect(
        service.cambiarPin({ pinActual: PIN_OK, pinNuevo: PIN_OK }, USER_ID, 's-1'),
      ).rejects.toThrow('últimos 3');
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PIN_REPETIDO' }),
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
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'USUARIO_NO_ENCONTRADO' }),
      );
    });

    it('jerarquía: un no-administrador NO puede reiniciar a un Administrador (403 auditado, PR #18 #5)', async () => {
      prisma.users_roles.findFirst
        .mockResolvedValueOnce({ id: 'ur-1' }) // objetivo = Administrador
        .mockResolvedValueOnce(null); // actor NO es Administrador
      await expect(service.reiniciarPin('admin-target', ACTOR)).rejects.toThrow(ForbiddenException);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'JERARQUIA_INSUFICIENTE' }),
      );
      // nada tocado: ni PIN ni sesiones
      expect(prisma.users.update).not.toHaveBeenCalled();
      expect(prisma.sessions.updateMany).not.toHaveBeenCalled();
    });

    it('jerarquía: un Administrador SÍ puede reiniciar a otro Administrador', async () => {
      prisma.users_roles.findFirst.mockResolvedValue({ id: 'ur-1' }); // ambos Administrador
      const r = await service.reiniciarPin('admin-target', 'admin-actor');
      expect(r.pinTemporal).toHaveLength(8);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.PIN_REINICIADO, result: 'SUCCESS' }),
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

    it('jerarquía: un no-administrador NO puede desbloquear a un Administrador (403 auditado, PR #18 #5)', async () => {
      prisma.users.findUnique.mockResolvedValue(
        usuario({ cuenta_bloqueada_en: new Date() }) as never,
      );
      prisma.users_roles.findFirst
        .mockResolvedValueOnce({ id: 'ur-1' }) // objetivo = Administrador
        .mockResolvedValueOnce(null); // actor NO es Administrador
      await expect(service.desbloquear('admin-target', 'rrhh-user')).rejects.toThrow(ForbiddenException);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'JERARQUIA_INSUFICIENTE' }),
      );
      expect(prisma.users.update).not.toHaveBeenCalled();
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
