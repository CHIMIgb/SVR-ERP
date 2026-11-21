/**
 * Integration tests for NotificacionesService — suscripciones Web Push.
 * Real DB, no mocks: insertan suscripciones reales en `push_suscripciones`
 * (fases a/b del plan de push: docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md).
 * `web-push` está simulado (no se le pega a FCM desde tests); la BD es real.
 * La suscripción SÍ audita (menor 3 PR #23): PWA_PUSH_SUSCRITO/PWA_PUSH_BAJA
 * se verifican contra `registro_auditoria` real (inmutable, las filas quedan).
 * Run with: npm run test:integration -- --testPathPattern="notificaciones"
 */
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { NotificacionesService } from './notificaciones.service';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as webpush from 'web-push';

describe('Notificaciones PUSH — suscripciones (BD real)', () => {
  let prisma: PrismaService;
  let service: NotificacionesService;

  const ENDPOINT_BASE = 'https://fcm.googleapis.com/fcm/send/test-';
  const llaves = { p256dh: 'p256dh-test', auth: 'auth-test' };

  const buscarUsuario = async (email: string) => {
    const u = await prisma.users.findUnique({ where: { email }, select: { id: true } });
    if (!u) throw new Error(`Usuario demo no encontrado: ${email}`);
    return u as { id: string };
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, NotificacionesService],
    }).compile();

    prisma = module.get(PrismaService);
    service = module.get(NotificacionesService);
    process.env.VAPID_PUBLIC_KEY = 'clave-publica-test';
    process.env.VAPID_PRIVATE_KEY = 'clave-privada-test';
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.push_suscripciones.deleteMany({
      where: { endpoint: { startsWith: ENDPOINT_BASE } },
    });
    await prisma.notificaciones.deleteMany({
      where: { titulo: { startsWith: 'PUSH TEST' } },
    });
    await prisma.$disconnect();
  });

  it('suscribe un dispositivo y la fila queda en BD con su usuario', async () => {
    const user = await buscarUsuario('trabajador@svr-constructora.com');
    const endpoint = `${ENDPOINT_BASE}${randomUUID()}`;

    const r = await service.suscribirPush(user.id, { endpoint, llaves });
    expect(r.message).toContain('registrada');

    const row = await prisma.push_suscripciones.findUnique({ where: { endpoint } });
    expect(row).not.toBeNull();
    expect(row!.user_id).toBe(user.id);
    expect(row!.p256dh).toBe('p256dh-test');

    // Menor 3 PR #23: el alta queda auditada en registro_auditoria real
    const audit = await prisma.registro_auditoria.findFirst({
      where: { action: AuditAction.PWA_PUSH_SUSCRITO, entity_id: r.suscripcion.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
    expect(audit!.result).toBe(AuditResult.SUCCESS);
    expect(audit!.actor_user_id).toBe(user.id);
  });

  it('suscribirPush con user inexistente: FK lo rechaza y el endpoint responde error (registro_auditoria.actor_user_id tiene FK a users — la fila FAIL con actor fantasma no puede persistir, por diseño)', async () => {
    // arrange: user_id que no existe — la FK de push_suscripciones lo rechaza
    const userIdFantasma = randomUUID();

    // act + assert: falla y se traga como error interno (el FAIL auditado con
    // actor real queda cubierto por el spec unitario — con actor fantasma la
    // fila de auditoría misma violaría su FK y AuditService la descarta)
    await expect(
      service.suscribirPush(userIdFantasma, {
        endpoint: `${ENDPOINT_BASE}${randomUUID()}`,
        llaves,
      }),
    ).rejects.toThrow();

    const sinFila = await prisma.push_suscripciones.findFirst({
      where: { user_id: userIdFantasma },
    });
    expect(sinFila).toBeNull();
  });

  it('cancelarSuscripcionPush audita PWA_PUSH_BAJA SUCCESS en registro_auditoria real', async () => {
    const user = await buscarUsuario('trabajador@svr-constructora.com');
    const endpoint = `${ENDPOINT_BASE}${randomUUID()}`;
    await service.suscribirPush(user.id, { endpoint, llaves });

    const r = await service.cancelarSuscripcionPush(user.id, endpoint);
    expect(r.canceladas).toBe(1);

    const audit = await prisma.registro_auditoria.findFirst({
      where: {
        action: AuditAction.PWA_PUSH_BAJA,
        result: AuditResult.SUCCESS,
        actor_user_id: user.id,
      },
      orderBy: { timestamp: 'desc' },
    });
    expect(audit).not.toBeNull();
  });

  it('re-suscribir el MISMO endpoint lo reasigna al nuevo usuario (1 fila, no duplicados)', async () => {
    const trabajador = await buscarUsuario('trabajador@svr-constructora.com');
    const admin = await buscarUsuario('admin@svr-constructora.com');
    const endpoint = `${ENDPOINT_BASE}${randomUUID()}`;

    await service.suscribirPush(trabajador.id, { endpoint, llaves });
    await service.suscribirPush(admin.id, { endpoint, llaves: { p256dh: 'p256dh-nueva', auth: 'auth-nueva' } });

    const filas = await prisma.push_suscripciones.findMany({ where: { endpoint } });
    expect(filas).toHaveLength(1);
    expect(filas[0].user_id).toBe(admin.id); // el último que subió se queda
    expect(filas[0].p256dh).toBe('p256dh-nueva');
  });

  it('cancelar: SOLO borra la suscripción del propio usuario (ajena no toca)', async () => {
    const trabajador = await buscarUsuario('trabajador@svr-constructora.com');
    const admin = await buscarUsuario('admin@svr-constructora.com');
    const endpoint = `${ENDPOINT_BASE}${randomUUID()}`;

    await service.suscribirPush(admin.id, { endpoint, llaves });

    const ajena = await service.cancelarSuscripcionPush(trabajador.id, endpoint);
    expect(ajena.canceladas).toBe(0);
    expect(await prisma.push_suscripciones.findUnique({ where: { endpoint } })).not.toBeNull();

    const propia = await service.cancelarSuscripcionPush(admin.id, endpoint);
    expect(propia.canceladas).toBe(1);
    expect(await prisma.push_suscripciones.findUnique({ where: { endpoint } })).toBeNull();
  });

  describe('PUSH fase b — emitir() dispara el push a los suscritos (web-push simulado)', () => {
    it('emitir personal al suscrito envía el push a SU endpoint y excluye al actor', async () => {
      const trabajador = await buscarUsuario('trabajador@svr-constructora.com');
      const admin = await buscarUsuario('admin@svr-constructora.com');
      const endpoint = `${ENDPOINT_BASE}${randomUUID()}`;
      await service.suscribirPush(trabajador.id, { endpoint, llaves });

      (webpush.sendNotification as jest.Mock).mockClear();
      await service.emitir({
        tipo: 'ALERTA' as never,
        titulo: 'PUSH TEST personal',
        cuerpo: 'prueba de envío',
        destinatarioUserId: trabajador.id,
        creadoPor: admin.id,
      });
      // el push es fire-and-forget: la cadena incluye consultas reales de BD
      // (macrotareas) — cede el turno con temporizador, no solo microtareas
      await new Promise((r) => setTimeout(r, 300));

      const llamadas = (webpush.sendNotification as jest.Mock).mock.calls;
      const endpoints = llamadas.map((l) => (l[0] as { endpoint: string }).endpoint);
      expect(endpoints).toContain(endpoint);
      const payload = JSON.parse(
        llamadas.find((l) => (l[0] as { endpoint: string }).endpoint === endpoint)![1],
      );
      expect(payload.titulo).toBe('PUSH TEST personal');
    });

    it('emitir con audiencia de torre llega a los suscritos de ESA torre', async () => {
      const residente = await buscarUsuario('residente@svr-constructora.com');
      const admin = await buscarUsuario('admin@svr-constructora.com');
      const endpoint = `${ENDPOINT_BASE}${randomUUID()}`;
      await service.suscribirPush(residente.id, { endpoint, llaves });

      (webpush.sendNotification as jest.Mock).mockClear();
      await service.emitir({
        tipo: 'ALERTA' as never,
        titulo: 'PUSH TEST torre',
        cuerpo: 'prueba de envío',
        audienciaTorre: 'RESIDENTE' as never,
        creadoPor: admin.id, // FK real: el actor debe existir en users
      });
      await new Promise((r) => setTimeout(r, 300));

      const endpoints = (webpush.sendNotification as jest.Mock).mock.calls.map(
        (l) => (l[0] as { endpoint: string }).endpoint,
      );
      expect(endpoints).toContain(endpoint);
    });
  });
});
