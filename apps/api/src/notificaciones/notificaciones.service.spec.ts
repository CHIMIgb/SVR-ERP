import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, TipoNotificacion } from '@prisma/client';
import { NotificacionesService } from './notificaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as webpush from 'web-push';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
  const USER_ID = 'c0000000-0000-0000-0000-000000000001';
  const TORRE = 'MAQUINARIA' as never;

  const mockNotificacion = {
    id: '90000000-0000-0000-0000-000000000001',
    tipo: TipoNotificacion.ALERTA,
    titulo: 'Cierre de caja pendiente',
    cuerpo: 'Hay un cierre de caja pendiente de aprobación.',
    referencia_tipo: 'cierres_caja',
    referencia_id: '91000000-0000-0000-0000-000000000001',
    audiencia_rol_id: null,
    creado_en: new Date(),
    creado_por: 'otro-usuario',
  };

  /** Mocks base: el usuario tiene 2 roles activos y torre MAQUINARIA. */
  beforeEach(async () => {
    prisma = {
      notificaciones: {
        create: jest.fn().mockResolvedValue(mockNotificacion),
        findMany: jest.fn().mockResolvedValue([mockNotificacion]),
        findUnique: jest.fn().mockResolvedValue(mockNotificacion),
        count: jest.fn().mockResolvedValue(1),
      },
      notificaciones_lecturas: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      users_roles: {
        findMany: jest.fn().mockResolvedValue([{ rol_id: 'rol-a' }, { rol_id: 'rol-b' }]),
      },
      users: {
        findUnique: jest.fn().mockResolvedValue({ torre: TORRE }),
        findFirst: jest.fn().mockResolvedValue({ id: 'user-del-trabajador' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'user-a' }, { id: 'user-b' }]),
      },
      push_suscripciones: {
        upsert: jest.fn().mockResolvedValue({
          id: 'push-1',
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
          creado_en: new Date(),
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'p', auth: 'a' },
        ]),
      },
      roles: {
        findFirst: jest.fn().mockResolvedValue({ id: 'rol-administrativo' }),
      },
      trabajadores: {
        findUnique: jest.fn().mockResolvedValue({
          nombre: 'Juan Perez',
          usuario: { id: 'user-del-trabajador' },
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(NotificacionesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitir', () => {
    it('debe crear la notificación con TODOS los destinatarios explícitos', async () => {
      await service.emitir({
        tipo: TipoNotificacion.ALERTA,
        titulo: 'Reporte creado',
        cuerpo: 'Nuevo reporte de tu área.',
        referenciaTipo: 'reportes_campo',
        referenciaId: 'x',
        audienciaTorre: TORRE,
        destinatarioUserId: 'user-destino',
        creadoPor: USER_ID,
      });

      expect(prisma.notificaciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: TipoNotificacion.ALERTA,
            audiencia_torre: TORRE,
            destinatario_user_id: 'user-destino',
            referencia_tipo: 'reportes_campo',
          }),
        }),
      );
    });

    it('es best-effort: si la BD falla NO lanza (no revierte el negocio)', async () => {
      prisma.notificaciones.create.mockRejectedValue(new Error('BD caída'));
      await expect(
        service.emitir({ tipo: TipoNotificacion.INFO, titulo: 'X', cuerpo: 'Y' }),
      ).resolves.toBeUndefined();
    });

    it('fase b: tras el insert resuelve el alcance y dispara el push (fire-and-forget)', async () => {
      process.env.VAPID_PUBLIC_KEY = 'clave-publica-test';
      process.env.VAPID_PRIVATE_KEY = 'clave-privada-test';
      const flush = async () => {
        for (let i = 0; i < 5; i++) await Promise.resolve();
      };
      await service.emitir({
        tipo: TipoNotificacion.INFO,
        titulo: 'X',
        cuerpo: 'Y',
        destinatarioUserId: 'user-destino',
        creadoPor: USER_ID,
      });
      await flush();
      expect(prisma.users.findMany).not.toHaveBeenCalled(); // personal: no resuelve por torre
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'p', auth: 'a' } },
        JSON.stringify({ titulo: 'X', cuerpo: 'Y', referenciaTipo: null, referenciaId: null }),
        { timeout: 10000 },
      );
    });

    it('fase b: si la BD del insert falla, el push tampoco se dispara', async () => {
      prisma.notificaciones.create.mockRejectedValue(new Error('BD caída'));
      const flush = async () => {
        for (let i = 0; i < 5; i++) await Promise.resolve();
      };
      await service.emitir({ tipo: TipoNotificacion.INFO, titulo: 'X', cuerpo: 'Y' });
      await flush();
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('emitirAUsuario / emitirATorre / emitirATrabajador', () => {
    it('emitirAUsuario fija el destinatario personal', async () => {
      await service.emitirAUsuario('user-receptor', { tipo: TipoNotificacion.INFO, titulo: 'T', cuerpo: 'C' });
      expect(prisma.notificaciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ destinatario_user_id: 'user-receptor' }),
        }),
      );
    });

    it('emitirATorre fija la audiencia de área', async () => {
      await service.emitirATorre(TORRE, { tipo: TipoNotificacion.INFO, titulo: 'T', cuerpo: 'C' });
      expect(prisma.notificaciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ audiencia_torre: TORRE }),
        }),
      );
    });

    it('emitirATorre sin torre NO emite nada', async () => {
      await service.emitirATorre(null, { tipo: TipoNotificacion.INFO, titulo: 'T', cuerpo: 'C' });
      expect(prisma.notificaciones.create).not.toHaveBeenCalled();
    });

    it('emitirATrabajador usa el FK usuario_id y emite personal', async () => {
      await service.emitirATrabajador('trab-1', { tipo: TipoNotificacion.INFO, titulo: 'Te asignaron', cuerpo: 'X' });
      expect(prisma.trabajadores.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'trab-1' },
          include: { usuario: { select: { id: true } } },
        }),
      );
      expect(prisma.notificaciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ destinatario_user_id: 'user-del-trabajador' }),
        }),
      );
    });

    it('emitirATrabajador sin cuenta enlazada NO emite', async () => {
      prisma.trabajadores.findUnique.mockResolvedValue({ nombre: 'Juan Perez', usuario: null });
      await service.emitirATrabajador('trab-1', { tipo: TipoNotificacion.INFO, titulo: 'X', cuerpo: 'Y' });
      expect(prisma.notificaciones.create).not.toHaveBeenCalled();
    });
  });

  describe('emitirARol', () => {
    it('resuelve el rol por nombre y emite con su audiencia', async () => {
      await service.emitirARol('Administrativo', {
        tipo: TipoNotificacion.INFO,
        titulo: 'Abono',
        cuerpo: 'X',
      });
      expect(prisma.roles.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { nombre: 'Administrativo', eliminado_en: null } }),
      );
      expect(prisma.notificaciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ audiencia_rol_id: 'rol-administrativo' }),
        }),
      );
    });
  });

  describe('findMine (visibilidad por destinatario explícito)', () => {
    it('filtra: no del actor, dirigido a él / su torre / sus roles activos o todos', async () => {
      const result = await service.findMine(USER_ID, { page: 1, limit: 10 });

      expect(prisma.users_roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: USER_ID, activo: true } }),
      );
      const where = prisma.notificaciones.findMany.mock.calls[0][0].where;
      expect(where.AND).toEqual([
        { OR: [{ creado_por: null }, { creado_por: { not: USER_ID } }] },
        {
          OR: [
            { destinatario_user_id: USER_ID },
            { audiencia_torre: TORRE },
            // "para todos" = SIN ninguna audiencia dirigida (fuga 2026-11-20:
            // antes bastaba audiencia_rol_id null y una fila de TORRE se le
            // escapaba a usuarios de otras torres)
            {
              AND: [
                { audiencia_rol_id: null },
                { audiencia_torre: null },
                { destinatario_user_id: null },
              ],
            },
            { audiencia_rol_id: { in: ['rol-a', 'rol-b'] } },
          ],
        },
      ]);
      expect(result.items[0].leida).toBe(false);
    });

    it('una fila dirigida solo por TORRE no entra por la rama "para todos"', async () => {
      // Caso real (fuga verificada en BD): reporte a torre DIESEL visto por un
      // técnico Mecanico. La fila de torre tiene audiencia_rol_id null — con el
      // where viejo ({ audiencia_rol_id: null }) era visible para cualquiera.
      prisma.users.findUnique.mockResolvedValue({ torre: 'MECANICO' });
      await service.findMine(USER_ID, { page: 1, limit: 10 });
      const or = prisma.notificaciones.findMany.mock.calls[0][0].where.AND[1].OR;
      const global = or.find((b: { AND?: unknown }) => b.AND);
      // La rama global exige audiencia_torre null → la fila de DIESEL no casa
      expect(global.AND).toContainEqual({ audiencia_torre: null });
      // y el usuario solo recibe la audiencia de SU torre
      expect(or).toContainEqual({ audiencia_torre: 'MECANICO' });
    });

    it('el conteo noLeidas descuenta lo ya leído por el usuario', async () => {
      prisma.notificaciones_lecturas.findMany.mockResolvedValue([
        { notificacion_id: mockNotificacion.id, user_id: USER_ID, leido_en: new Date(), descartada: false },
      ]);
      const result = await service.findMine(USER_ID, { page: 1, limit: 10 });
      expect(result.items[0].leida).toBe(true);
      expect(result.noLeidas).toBe(0); // total 1 visible − 1 leída
    });

    it('sin torre en el usuario, las notificaciones de área no le entran', async () => {
      prisma.users.findUnique.mockResolvedValue({ torre: null });
      await service.findMine(USER_ID, { page: 1, limit: 10 });
      const where = prisma.notificaciones.findMany.mock.calls[0][0].where;
      expect(where.AND[1].OR).not.toContainEqual({ audiencia_torre: TORRE });
    });
  });

  describe('suscribirPush / cancelarSuscripcionPush (fase a del plan de push)', () => {
    const dtoBase = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      llaves: { p256dh: 'llave-p256dh', auth: 'llave-auth' },
    };

    it('suscribe: upsert por endpoint con el usuario del JWT', async () => {
      await service.suscribirPush(USER_ID, dtoBase);
      expect(prisma.push_suscripciones.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { endpoint: dtoBase.endpoint },
          create: expect.objectContaining({
            user_id: USER_ID,
            endpoint: dtoBase.endpoint,
            p256dh: 'llave-p256dh',
            auth: 'llave-auth',
          }),
          update: expect.objectContaining({ user_id: USER_ID }),
        }),
      );
    });

    it('cancela: deleteMany acotado al endpoint Y al usuario propio', async () => {
      const r = await service.cancelarSuscripcionPush(USER_ID, dtoBase.endpoint);
      expect(r.canceladas).toBe(1);
      expect(prisma.push_suscripciones.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: dtoBase.endpoint, user_id: USER_ID },
      });
    });

    it('si el upsert falla, lanza NotFound (best-effort con log)', async () => {
      prisma.push_suscripciones.upsert.mockRejectedValueOnce(new Error('BD caída'));
      await expect(service.suscribirPush(USER_ID, dtoBase)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('marcarLeida', () => {
    it('debe upsert la lectura POR USUARIO, auditar SUCCESS y regresar leida', async () => {
      const result = await service.marcarLeida(mockNotificacion.id, USER_ID);

      expect(prisma.notificaciones_lecturas.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { notificacion_id_user_id: { notificacion_id: mockNotificacion.id, user_id: USER_ID } },
          update: expect.objectContaining({ leido_en: expect.any(Date) }),
          create: expect.objectContaining({ notificacion_id: mockNotificacion.id, user_id: USER_ID }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOTIFICACION_LEIDA,
          result: AuditResult.SUCCESS,
          entityId: mockNotificacion.id,
          newValue: expect.objectContaining({ usuario: USER_ID }),
        }),
      );
      expect(result.leida).toBe(true);
    });

    it('debe fallar NOTIFICACION_NO_ENCONTRADA con audit FAIL', async () => {
      prisma.notificaciones.findUnique.mockResolvedValue(null);
      await expect(
        service.marcarLeida('90000000-0000-0000-0000-000000000002', USER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOTIFICACION_LEIDA,
          result: AuditResult.FAIL,
          errorCode: 'NOTIFICACION_NO_ENCONTRADA',
        }),
      );
      expect(prisma.notificaciones_lecturas.upsert).not.toHaveBeenCalled();
    });
  });

  describe('marcarTodas', () => {
    it('debe crear lecturas SOLO de las visibles que faltan y auditar con el conteo', async () => {
      const result = await service.marcarTodas(USER_ID);

      expect(prisma.notificaciones_lecturas.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({ notificacion_id: mockNotificacion.id, user_id: USER_ID, leido_en: expect.any(Date) }),
          ],
          skipDuplicates: true,
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOTIFICACION_LEIDA,
          result: AuditResult.SUCCESS,
          newValue: expect.objectContaining({ marcadas: 1, usuario: USER_ID }),
        }),
      );
      expect(result.marcadas).toBe(1);
    });

    it('no crea lecturas si todo ya está leído', async () => {
      prisma.notificaciones_lecturas.findMany.mockResolvedValue([
        { notificacion_id: mockNotificacion.id, user_id: USER_ID, leido_en: new Date(), descartada: false },
      ]);
      const result = await service.marcarTodas(USER_ID);
      expect(prisma.notificaciones_lecturas.createMany).not.toHaveBeenCalled();
      expect(result.marcadas).toBe(0);
    });
  });

  describe('descartarTodas', () => {
    it('debe crear lecturas descartadas SOLO del usuario y auditar con el conteo', async () => {
      const result = await service.descartarTodas(USER_ID);

      expect(prisma.notificaciones_lecturas.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({ notificacion_id: mockNotificacion.id, user_id: USER_ID, descartada: true }),
          ],
          skipDuplicates: true,
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOTIFICACION_DESCARTADA,
          result: AuditResult.SUCCESS,
          newValue: expect.objectContaining({ descartadas: 1, usuario: USER_ID }),
        }),
      );
      expect(result.descartadas).toBe(1);
    });
  });

  describe('PUSH fase b — usuariosDelAlcance + enviarPushesBestEffort', () => {
    const ENV_ORIGINALES = { ...process.env };
    const inputTorre = {
      tipo: TipoNotificacion.ALERTA,
      titulo: 'Nuevo reporte INC0001',
      cuerpo: 'Alta — algo',
      referenciaTipo: 'reportes_campo',
      referenciaId: 'id-reporte',
      audienciaTorre: TORRE,
      creadoPor: 'user-a',
    };

    beforeEach(() => {
      process.env.VAPID_PUBLIC_KEY = 'clave-publica-test';
      process.env.VAPID_PRIVATE_KEY = 'clave-privada-test';
      (webpush.sendNotification as jest.Mock).mockClear().mockResolvedValue(undefined);
      (webpush.setVapidDetails as jest.Mock).mockClear();
    });

    afterAll(() => {
      process.env = ENV_ORIGINALES;
    });

    it('usuariosDelAlcance: torre → usuarios con esa torre, sin el actor', async () => {
      const usuarios = await service.usuariosDelAlcance(inputTorre, 'user-a');
      expect(prisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { torre: TORRE, activo: true } }),
      );
      // user-a es el actor: excluido
      expect(usuarios).toEqual(['user-b']);
    });

    it('usuariosDelAlcance: rol → users_roles activos de ese rol', async () => {
      prisma.users_roles.findMany.mockResolvedValue([{ user_id: 'user-a' }, { user_id: 'user-b' }]);
      const usuarios = await service.usuariosDelAlcance({ audienciaRolId: 'rol-a' }, undefined);
      expect(prisma.users_roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { rol_id: 'rol-a', activo: true } }),
      );
      expect(usuarios).toEqual(['user-a', 'user-b']);
    });

    it('usuariosDelAlcance: "para todos" → todos los users activos', async () => {
      const usuarios = await service.usuariosDelAlcance({}, undefined);
      expect(usuarios).toEqual(['user-a', 'user-b']);
    });

    it('enviarPushesBestEffort: sin VAPID configurado no envía nada', async () => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      const r = await service.enviarPushesBestEffort(inputTorre, ['user-b']);
      expect(r).toEqual({ enviados: 0, limpiadas: 0 });
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('enviarPushesBestEffort: envía a las suscripciones de los usuarios del alcance', async () => {
      const r = await service.enviarPushesBestEffort(inputTorre, ['user-b']);
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:dev@svr-constructora.com',
        'clave-publica-test',
        'clave-privada-test',
      );
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'p', auth: 'a' } },
        JSON.stringify({
          titulo: inputTorre.titulo,
          cuerpo: inputTorre.cuerpo,
          referenciaTipo: 'reportes_campo',
          referenciaId: 'id-reporte',
        }),
        { timeout: 10000 },
      );
      expect(r.enviados).toBe(1);
    });

    it('enviarPushesBestEffort: endpoint fuera de la lista blanca NO se envía (SSRF, bloqueante 2 PR #23)', async () => {
      // arrange: una suscripción vieja guardada con la regla antigua (host ajeno)
      prisma.push_suscripciones.findMany.mockResolvedValue([
        { endpoint: 'https://192.168.0.10:8080/hook', p256dh: 'p', auth: 'a' },
      ]);

      // act
      const r = await service.enviarPushesBestEffort(inputTorre, ['user-b']);

      // assert: ni envío ni limpieza — solo queda excluida
      expect(webpush.sendNotification).not.toHaveBeenCalled();
      expect(prisma.push_suscripciones.deleteMany).not.toHaveBeenCalled();
      expect(r.enviados).toBe(0);
      expect(r.limpiadas).toBe(0);
    });

    it('enviarPushesBestEffort: 410 Gone → limpia la suscripción muerta', async () => {
      const error410 = Object.assign(new Error('gone'), { statusCode: 410 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(error410);
      const r = await service.enviarPushesBestEffort(inputTorre, ['user-b']);
      expect(prisma.push_suscripciones.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc' },
      });
      expect(r.limpiadas).toBe(1);
    });

    it('enviarPushesBestEffort: error 5xx NO limpia la suscripción (solo warn)', async () => {
      const error500 = Object.assign(new Error('boom'), { statusCode: 500 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(error500);
      const r = await service.enviarPushesBestEffort(inputTorre, ['user-b']);
      expect(prisma.push_suscripciones.deleteMany).not.toHaveBeenCalled();
      expect(r.limpiadas).toBe(0);
      expect(r.enviados).toBe(0);
    });
  });
});
