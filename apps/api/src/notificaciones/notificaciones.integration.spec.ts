/**
 * Integration tests for NotificacionesService — suscripciones Web Push.
 * Real DB, no mocks: insertan suscripciones reales en `push_suscripciones`
 * (fase a del plan de push: docs-planes/docs-pwa/PLAN-NOTIFICACIONES-PUSH-PWA.md).
 * No tocan `registro_auditoria` (la suscripción no audita).
 * Run with: npm run test:integration -- --testPathPattern="notificaciones"
 */
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { NotificacionesService } from './notificaciones.service';

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
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.push_suscripciones.deleteMany({
      where: { endpoint: { startsWith: ENDPOINT_BASE } },
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
});
