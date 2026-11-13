import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, AuditResult, TipoNotificacion } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

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
      },
      roles: {
        findFirst: jest.fn().mockResolvedValue({ id: 'rol-administrativo' }),
      },
      trabajadores: {
        findUnique: jest.fn().mockResolvedValue({ nombre: 'Juan Perez' }),
      },
      personas: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'persona-1', nombre: 'Juan', apellido_paterno: 'Perez', apellido_materno: null },
        ]),
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

    it('emitirATrabajador resuelve su cuenta por nombre y emite personal', async () => {
      await service.emitirATrabajador('trab-1', { tipo: TipoNotificacion.INFO, titulo: 'Te asignaron', cuerpo: 'X' });
      expect(prisma.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { persona_id: 'persona-1' } }),
      );
      expect(prisma.notificaciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ destinatario_user_id: 'user-del-trabajador' }),
        }),
      );
    });

    it('emitirATrabajador sin cuenta de usuario NO emite', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await service.emitirATrabajador('trab-1', { tipo: TipoNotificacion.INFO, titulo: 'X', cuerpo: 'Y' });
      expect(prisma.notificaciones.create).not.toHaveBeenCalled();
    });

    it('emitirATrabajador con nombre ambiguo NO emite', async () => {
      prisma.personas.findMany.mockResolvedValue([
        { id: 'p1', nombre: 'Juan', apellido_paterno: 'Perez', apellido_materno: null },
        { id: 'p2', nombre: 'Juan', apellido_paterno: 'Perez', apellido_materno: null },
      ]);
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
            { audiencia_rol_id: null },
            { audiencia_rol_id: { in: ['rol-a', 'rol-b'] } },
          ],
        },
      ]);
      expect(result.items[0].leida).toBe(false);
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
});
