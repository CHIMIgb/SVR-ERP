/**
 * Integration tests for AuthService — real DB, no mocks.
 *
 * These tests verify the full auth flow against PostgreSQL:
 * intentos_login, sessions, refresh_tokens, token_blacklist,
 * usuarios_bloqueados, registro_auditoria.
 *
 * Run with: npm run test:integration
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { IntentosLoginService } from './intentos-login.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { BloqueoService } from '../bloqueo/bloqueo.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';

const TEST_ID = randomUUID().slice(0, 8);
const TEST_EMAIL = `inttest-${TEST_ID}@svr-erp.local`;
const TEST_PASSWORD = 'TestP@ss123!';
const TEST_NAME = 'Integration';
const TEST_APELLIDO = 'Tester';
const IP = '10.99.0.1';
const UA = 'IntegrationTest/1.0';

describe('Auth Integration (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  let testUserId: string;
  let testPersonaId: string;

  // ── Setup ──────────────────────────────────────────────────

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: process.env.JWT_ACCESS_SECRET || 'svr-erp-access-secret-k3y-2026-prod',
          signOptions: { expiresIn: 900 },
        }),
      ],
      providers: [
        PrismaService,
        AuthService,
        IntentosLoginService,
        BloqueoService,
        AuditContextService,
        AuditService,
        JwtStrategy,
        JwtRefreshStrategy,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    authService = module.get(AuthService);

    // Create test persona + user
    testPersonaId = randomUUID();
    await prisma.personas.create({
      data: {
        id: testPersonaId,
        nombre: TEST_NAME,
        apellido_paterno: TEST_APELLIDO,
        correo: TEST_EMAIL,
        actualizado_en: new Date(),
      },
    });

    testUserId = randomUUID();
    await prisma.users.create({
      data: {
        id: testUserId,
        persona_id: testPersonaId,
        email: TEST_EMAIL,
        password_hash: await bcrypt.hash(TEST_PASSWORD, 12),
        actualizado_en: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;

    // Cleanup in FK-safe order
    // NOTE: registro_auditoria is IMMUTABLE (DB trigger blocks DELETE).
    // Audit records are left in the table — unique actor_user_id keeps them isolated.

    const sessions = await prisma.sessions.findMany({
      where: { user_id: testUserId },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      await prisma.refresh_tokens.deleteMany({
        where: { session_id: { in: sessionIds } },
      });
    }

    await prisma.token_blacklist.deleteMany({
      where: { user_id: testUserId },
    });
    await prisma.sessions.deleteMany({
      where: { user_id: testUserId },
    });
    await prisma.intentos_login.deleteMany({
      where: { OR: [{ user_id: testUserId }, { email_intentado: TEST_EMAIL }] },
    });
    await prisma.usuarios_bloqueados.deleteMany({
      where: { user_id: testUserId },
    });
    // Soft delete — hard delete blocked by immutable table trigger
    await prisma.users.update({
      where: { id: testUserId },
      data: { eliminado_en: new Date(), activo: false },
    });
    // Persona has no eliminado_en, just leave it (test email is unique)

    await prisma.$disconnect();
    await app.close();
  });

  // ── Helpers ────────────────────────────────────────────────

  async function countIntentos(exitoso?: boolean) {
    return prisma.intentos_login.count({
      where: {
        OR: [{ user_id: testUserId }, { email_intentado: TEST_EMAIL }],
        ...(exitoso !== undefined ? { exitoso } : {}),
      },
    });
  }

  async function cleanAuthState() {
    const sess = await prisma.sessions.findMany({
      where: { user_id: testUserId },
      select: { id: true },
    });
    if (sess.length) {
      await prisma.refresh_tokens.deleteMany({
        where: { session_id: { in: sess.map((s) => s.id) } },
      });
    }
    await prisma.token_blacklist.deleteMany({
      where: { user_id: testUserId },
    });
    await prisma.sessions.deleteMany({ where: { user_id: testUserId } });
    await prisma.intentos_login.deleteMany({
      where: { OR: [{ user_id: testUserId }, { email_intentado: TEST_EMAIL }] },
    });
    await prisma.usuarios_bloqueados.deleteMany({
      where: { user_id: testUserId },
    });
    // registro_auditoria is immutable — skip
  }

  // ── Tests ──────────────────────────────────────────────────

  describe('Login exitoso', () => {
    beforeAll(() => cleanAuthState());

    it('debe crear sesión y registrar en todas las tablas', async () => {
      const result = await authService.login(
        { email: TEST_EMAIL, password: TEST_PASSWORD },
        IP,
        UA,
      );

      // 1. Response structure
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(testUserId);
      expect(result.user.email).toBe(TEST_EMAIL);
      expect(result.session.id).toBeDefined();

      // 2. intentos_login: 1 exitoso
      const intentos = await countIntentos();
      expect(intentos).toBe(1);
      const intento = await prisma.intentos_login.findFirst({
        where: { user_id: testUserId },
        orderBy: { creado_en: 'desc' },
      });
      expect(intento!.exitoso).toBe(true);
      expect(intento!.ip_address).toBe(IP);

      // 3. sessions: activa
      const session = await prisma.sessions.findUnique({
        where: { id: result.session.id },
      });
      expect(session).not.toBeNull();
      expect(session!.activa).toBe(true);
      expect(session!.ip_address).toBe(IP);

      // 4. refresh_tokens: 1 active
      const rt = await prisma.refresh_tokens.findFirst({
        where: { session_id: result.session.id },
      });
      expect(rt).not.toBeNull();
      expect(rt!.activo).toBe(true);

      // 5. registro_auditoria: LOGIN_EXITOSO
      const audit = await prisma.registro_auditoria.findFirst({
        where: { actor_user_id: testUserId, action: 'LOGIN_EXITOSO' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.entity_type).toBe('sessions');
      expect(audit!.ip_address).toBe(IP);
    });
  });

  describe('Login fallido — email no existe', () => {
    beforeAll(() => cleanAuthState());

    it('debe registrar intento fallido sin crear sesión', async () => {
      const fakeEmail = `fake-${TEST_ID}@no-existe.local`;

      await expect(
        authService.login({ email: fakeEmail, password: 'WrongPass1!' }, IP, UA),
      ).rejects.toThrow('Credenciales inválidas');

      // intentos_login: 1 fallido
      const intentos = await prisma.intentos_login.count({
        where: { email_intentado: fakeEmail },
      });
      expect(intentos).toBe(1);

      const intento = await prisma.intentos_login.findFirst({
        where: { email_intentado: fakeEmail },
      });
      expect(intento!.exitoso).toBe(false);
      expect(intento!.motivo_fallo).toContain('no encontrado');

      // No session created
      const sessions = await prisma.sessions.count({
        where: { user_id: testUserId },
      });
      expect(sessions).toBe(0);

      // Audit: LOGIN_FALLIDO with USER_NOT_FOUND
      const audit = await prisma.registro_auditoria.findFirst({
        where: { action: 'LOGIN_FALLIDO', error_code: 'USER_NOT_FOUND' },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
    });
  });

  describe('Login fallido — contraseña incorrecta', () => {
    beforeAll(() => cleanAuthState());

    it('debe registrar fallo con INVALID_PASSWORD', async () => {
      await expect(
        authService.login(
          { email: TEST_EMAIL, password: 'WrongPassword999!' },
          IP,
          UA,
        ),
      ).rejects.toThrow('Credenciales inválidas');

      // intentos_login: 1 fallido
      const intento = await prisma.intentos_login.findFirst({
        where: { user_id: testUserId },
        orderBy: { creado_en: 'desc' },
      });
      expect(intento!.exitoso).toBe(false);
      expect(intento!.motivo_fallo).toContain('incorrecta');

      // Audit: INVALID_PASSWORD
      const audit = await prisma.registro_auditoria.findFirst({
        where: { actor_user_id: testUserId, action: 'LOGIN_FALLIDO' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.error_code).toBe('INVALID_PASSWORD');

      // Still only 1 attempt
      const count = await countIntentos(false);
      expect(count).toBe(1);
    });
  });

  describe('Bloqueo escalonado tras 5 fallos', () => {
    beforeAll(() => cleanAuthState());

    it('debe bloquear al 5to intento fallido y rechazar el 6to', async () => {
      // 5 intentos fallidos consecutivos
      for (let i = 1; i <= 5; i++) {
        await expect(
          authService.login(
            { email: TEST_EMAIL, password: `Wrong${i}!!!` },
            IP,
            UA,
          ),
        ).rejects.toThrow();
      }

      // 1. intentos_login: 5 fallidos
      const intentosCount = await countIntentos(false);
      expect(intentosCount).toBe(5);

      // 2. usuarios_bloqueados: 1 record con intentos >= 5
      const bloqueo = await prisma.usuarios_bloqueados.findFirst({
        where: { user_id: testUserId, activo: true },
      });
      expect(bloqueo).not.toBeNull();
      expect(bloqueo!.intentos_fallidos_consecutivos).toBeGreaterThanOrEqual(5);
      expect(bloqueo!.nivel_numero).toBeGreaterThanOrEqual(1);
      expect(bloqueo!.bloqueado_hasta).toBeInstanceOf(Date);
      expect(bloqueo!.bloqueado_hasta.getTime()).toBeGreaterThan(Date.now());

      // 3. Audit: USUARIO_BLOQUEADO (actor_type=SYSTEM → actor_user_id is null, query by entity_id)
      const blockAudit = await prisma.registro_auditoria.findFirst({
        where: {
          action: 'USUARIO_BLOQUEADO',
          entity_id: testUserId,
        },
      });
      expect(blockAudit).not.toBeNull();
      expect(blockAudit!.actor_type).toBe('SYSTEM');
      expect(blockAudit!.severity).toBe('WARNING');

      // 4. 6to intento → rechazado por cuenta bloqueada
      await expect(
        authService.login(
          { email: TEST_EMAIL, password: 'Whatever123!' },
          IP,
          UA,
        ),
      ).rejects.toThrow('Cuenta bloqueada');

      // Audit: ACCOUNT_LOCKED
      const lockedAudit = await prisma.registro_auditoria.findFirst({
        where: {
          actor_user_id: testUserId,
          action: 'LOGIN_FALLIDO',
          error_code: 'ACCOUNT_LOCKED',
        },
      });
      expect(lockedAudit).not.toBeNull();
    });
  });

  describe('Logout', () => {
    let loggedAccessToken: string;
    let loggedSessionId: string;

    beforeAll(async () => {
      await cleanAuthState();

      // Login para tener una sesión activa
      const result = await authService.login(
        { email: TEST_EMAIL, password: TEST_PASSWORD },
        IP,
        UA,
      );
      loggedAccessToken = result.accessToken;
      loggedSessionId = result.session.id;
    });

    it('debe cerrar sesión, revocar tokens y blacklisteear access token', async () => {
      // Calcular JTI y hash del access token
      const accessPayload = JSON.parse(
        Buffer.from(loggedAccessToken.split('.')[1], 'base64').toString(),
      );
      const accessJti = accessPayload.jti;
      const accessTokenHash = await bcrypt.hash(accessJti, 12);

      await authService.logout(testUserId, accessJti, accessTokenHash);

      // 1. Session: cerrada
      const session = await prisma.sessions.findUnique({
        where: { id: loggedSessionId },
      });
      expect(session!.activa).toBe(false);
      expect(session!.cerrada_en).not.toBeNull();
      expect(session!.motivo_cierre).toBe('Logout manual');

      // 2. refresh_tokens: revocados
      const rt = await prisma.refresh_tokens.findFirst({
        where: { session_id: loggedSessionId },
      });
      expect(rt!.activo).toBe(false);
      expect(rt!.revocado_en).not.toBeNull();

      // 3. token_blacklist: access token blacklisteado
      const blEntry = await prisma.token_blacklist.findFirst({
        where: { jti: accessJti },
      });
      expect(blEntry).not.toBeNull();
      expect(blEntry!.tipo).toBe('ACCESS');
      expect(blEntry!.razon).toBe('Logout manual');

      // 4. Audit: LOGOUT
      const audit = await prisma.registro_auditoria.findFirst({
        where: { actor_user_id: testUserId, action: 'LOGOUT' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.actor_type).toBe('USER');
    });
  });

  describe('Refresh token rotation', () => {
    let refreshJti: string;
    let sessionId: string;
    let accessToken: string;

    beforeAll(async () => {
      await cleanAuthState();

      const result = await authService.login(
        { email: TEST_EMAIL, password: TEST_PASSWORD },
        IP,
        UA,
      );
      accessToken = result.accessToken;
      sessionId = result.session.id;

      const payload = JSON.parse(
        Buffer.from(result.refreshToken.split('.')[1], 'base64').toString(),
      );
      refreshJti = payload.jti;
    });

    it('debe rotar el refresh token y generar nuevos tokens', async () => {
      const result = await authService.refresh(testUserId, refreshJti);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).not.toBe(accessToken);

      // 1. Token viejo en blacklist
      const oldBlacklisted = await prisma.token_blacklist.findFirst({
        where: { jti: refreshJti },
      });
      expect(oldBlacklisted).not.toBeNull();
      expect(oldBlacklisted!.tipo).toBe('REFRESH');
      expect(oldBlacklisted!.razon).toBe('Rotación de token');

      // 2. Refresh token viejo marcado como usado
      const oldRt = await prisma.refresh_tokens.findFirst({
        where: { session_id: sessionId, jti: refreshJti },
      });
      expect(oldRt!.activo).toBe(false);
      expect(oldRt!.usado_en).not.toBeNull();

      // 3. Nuevo refresh token activo
      const newPayload = JSON.parse(
        Buffer.from(result.refreshToken.split('.')[1], 'base64').toString(),
      );
      const newRt = await prisma.refresh_tokens.findFirst({
        where: { session_id: sessionId, jti: newPayload.jti },
      });
      expect(newRt).not.toBeNull();
      expect(newRt!.activo).toBe(true);

      // 4. Session actualizado con nuevo JTI
      const session = await prisma.sessions.findUnique({
        where: { id: sessionId },
      });
      expect(session!.refresh_token_jti).toBe(newPayload.jti);
    });
  });
});
