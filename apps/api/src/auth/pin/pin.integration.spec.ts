/**
 * Integration tests del ciclo PIN — BD real, sin mocks.
 * Verifica: login-pin (éxito/bloqueo por cuenta a los 5), cambio con cierre de
 * OTRAS sesiones, reinicio temporal 24h, historial de últimos 3, y auditoría
 * real en registro_auditoria (SUCCESS/FAIL con error_code).
 * Run: npm run test:integration -- --testPathPattern=pin.integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditContextService } from '../../audit/audit-context.service';
import { AuthService } from '../auth.service';
import { IntentosLoginService } from '../intentos-login.service';
import { BloqueoService } from '../../bloqueo/bloqueo.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.strategy';
import { PinService } from './pin.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_ADMIN = 'c0000000-0000-0000-0000-000000000001'; // admin seed user
const PIN_INICIAL = 'HV4K5R7M';

describe('PinService Integration (Real DB)', () => {
  let prisma: PrismaService;
  let service: PinService;
  let userId: string;
  let personaId: string;
  let numeroEmpleado: string;
  const sessionIds: string[] = [];

  const limpiar = async () => {
    // FK-safe: refresh → sessions → user (registro_auditoria es inmutable)
    const ses = await prisma.sessions.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    if (ses.length > 0) {
      await prisma.refresh_tokens.deleteMany({ where: { session_id: { in: ses.map((s) => s.id) } } });
      await prisma.sessions.deleteMany({ where: { id: { in: ses.map((s) => s.id) } } });
    }
    if (userId) {
      await prisma.users.delete({ where: { id: userId } }).catch(() => undefined);
      await prisma.personas.delete({ where: { id: personaId } }).catch(() => undefined);
    }
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: process.env.JWT_ACCESS_SECRET,
          signOptions: { expiresIn: 900 },
        }),
      ],
      providers: [
        PrismaService,
        PinService,
        AuthService,
        IntentosLoginService,
        BloqueoService,
        AuditContextService,
        AuditService,
        JwtStrategy,
        JwtRefreshStrategy,
      ],
    }).compile();
    prisma = module.get(PrismaService);
    service = module.get(PinService);

    // persona + user de prueba con numero_empleado único
    personaId = randomUUID();
    userId = randomUUID();
    await prisma.personas.create({
      data: {
        id: personaId,
        nombre: 'PinInt',
        apellido_paterno: TEST_ID,
        actualizado_en: new Date(),
      },
    });
    numeroEmpleado = `TRA-9${Math.floor(1000 + Math.random() * 9000)}`; // consecutivo numérico, como el alta real
    await prisma.users.create({
      data: {
        id: userId,
        persona_id: personaId,
        email: `pinint-${TEST_ID}@svr-erp.local`,
        password_hash: bcrypt.hashSync('NoUsado123', 4),
        numero_empleado: numeroEmpleado,
        pin_hash: bcrypt.hashSync(PIN_INICIAL, 4),
        pin_cambiado_en: new Date(),
        actualizado_en: new Date(),
      },
    });
  });

  afterAll(async () => {
    await limpiar();
    await prisma.$disconnect();
  });

  it('1. login-pin exitoso: tokens + LOGIN_EXITOSO real en registro_auditoria', async () => {
    const r = await service.loginPin(
      { numeroEmpleado, pin: PIN_INICIAL },
      '10.98.0.1',
      'PinInt/1.0',
    );
    expect(r.accessToken).toBeTruthy();
    expect(r.refreshToken).toBeTruthy();
    sessionIds.push(r.session.id);

    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.LOGIN_EXITOSO, entity_id: r.session.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe('SUCCESS');
  });

  it('2. PIN incorrecto ×5 BLOQUEA la cuenta; intento con PIN correcto también rechaza; FAIL real + desbloqueo SUCCESS', async () => {
    const num = numeroEmpleado;
    for (let i = 0; i < 4; i++) {
      await expect(
        service.loginPin({ numeroEmpleado: num, pin: 'Z9Z9Z9Z9' }, '10.98.0.2', 'PinInt/1.0'),
      ).rejects.toThrow(UnauthorizedException);
    }
    // el 5º bloquea
    await expect(
      service.loginPin({ numeroEmpleado: num, pin: 'Z9Z9Z9Z9' }, '10.98.0.2', 'PinInt/1.0'),
    ).rejects.toThrow('bloqueada por 5 intentos');

    const row = await prisma.users.findUnique({
      where: { id: userId },
      select: { cuenta_bloqueada_en: true, intentos_pin: true },
    });
    expect(row!.cuenta_bloqueada_en).not.toBeNull();
    expect(row!.intentos_pin).toBe(5);

    // el 6º intento (con el PIN CORRECTO) también rechaza por bloqueo
    await expect(
      service.loginPin({ numeroEmpleado: num, pin: PIN_INICIAL }, '10.98.0.2', 'PinInt/1.0'),
    ).rejects.toThrow('bloqueada');

    const fail = await prisma.registro_auditoria.findFirst({
      where: { error_code: 'CUENTA_BLOQUEADA', entity_type: 'users' },
      orderBy: { timestamp: 'desc' },
    });
    expect(fail).not.toBeNull();
    expect(fail!.result).toBe('FAIL');

    // desbloqueo por mesa de ayuda (audit SUCCESS real)
    const r = await service.desbloquear(userId, ACTOR_ADMIN, '10.98.0.3', 'PinInt/1.0');
    expect(r.message).toContain('desbloqueada');
    const unlock = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.CUENTA_DESBLOQUEADA, entity_id: userId },
      orderBy: { timestamp: 'desc' },
    });
    expect(unlock!.result).toBe('SUCCESS');
  });

  it('3. cambio de PIN: cierra las OTRAS sesiones, reinicia 30 días y audita PIN_CAMBIADO SUCCESS', async () => {
    // sesión 1 (la actual del cambio) + sesión 2 (que debe morir)
    const s1 = await prisma.sessions.create({
      data: { id: randomUUID(), user_id: userId, refresh_token_jti: randomUUID(), activa: true, expira_en: new Date(Date.now() + 7 * 86_400_000), actualizado_en: new Date() },
    });
    const s2 = await prisma.sessions.create({
      data: { id: randomUUID(), user_id: userId, refresh_token_jti: randomUUID(), activa: true, expira_en: new Date(Date.now() + 7 * 86_400_000), actualizado_en: new Date() },
    });
    sessionIds.push(s1.id, s2.id);
    await prisma.refresh_tokens.create({
      data: { id: randomUUID(), session_id: s2.id, jti: randomUUID(), token_hash: 'x', activo: true, expira_en: new Date(Date.now() + 7 * 86_400_000) },
    });

    const r = await service.cambiarPin(
      { pinActual: PIN_INICIAL, pinNuevo: 'PQ7W2N9K' },
      userId,
      s1.id,
      '10.98.0.4',
      'PinInt/1.0',
    );
    expect(r.message).toContain('otras sesiones');

    const s1row = await prisma.sessions.findUnique({ where: { id: s1.id } });
    const s2row = await prisma.sessions.findUnique({ where: { id: s2.id } });
    expect(s1row!.activa).toBe(true); // la actual vive
    expect(s2row!.activa).toBe(false); // la otra muere
    const rt = await prisma.refresh_tokens.findFirst({ where: { session_id: s2.id } });
    expect(rt!.revocado_en).not.toBeNull();
    expect(rt!.motivo_revocado).toBe('Cambio de PIN');

    const userRow = await prisma.users.findUnique({
      where: { id: userId },
      select: { pin_cambiado_en: true, pin_hash: true },
    });
    expect(userRow!.pin_cambiado_en!.getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(bcrypt.compareSync('PQ7W2N9K', userRow!.pin_hash!)).toBe(true);

    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.PIN_CAMBIADO, entity_id: userId, result: 'SUCCESS' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
  });

  it('4. PIN nuevo igual al anterior → FAIL real PIN_REPETIDO (historial)', async () => {
    await expect(
      service.cambiarPin(
        { pinActual: 'PQ7W2N9K', pinNuevo: PIN_INICIAL },
        userId,
        sessionIds[0],
        '10.98.0.5',
        'PinInt/1.0',
      ),
    ).rejects.toThrow(BadRequestException);

    const fail = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.PIN_CAMBIADO, entity_id: userId, error_code: 'PIN_REPETIDO' },
      orderBy: { timestamp: 'desc' },
    });
    expect(fail).not.toBeNull();
    expect(fail!.result).toBe('FAIL');
  });

  it('5. reinicio: temporal de 24h sin confusos, TODAS las sesiones mueren, audit SUCCESS', async () => {
    const r = await service.reiniciarPin(userId, ACTOR_ADMIN, '10.98.0.6', 'PinInt/1.0');
    expect(r.pinTemporal).toHaveLength(8);
    expect(r.pinTemporal).not.toMatch(/[0O1lI]/);

    const row = await prisma.users.findUnique({
      where: { id: userId },
      select: { pin_temporal_hasta: true, pin_hash: true },
    });
    expect(row!.pin_temporal_hasta!.getTime()).toBeGreaterThan(Date.now() + 23 * 3_600_000);
    expect(bcrypt.compareSync(r.pinTemporal, row!.pin_hash!)).toBe(true);

    const ses = await prisma.sessions.findMany({ where: { user_id: userId } });
    ses.forEach((s) => expect(s.activa).toBe(false));

    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.PIN_REINICIADO, entity_id: userId, result: 'SUCCESS' },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
  });
});
