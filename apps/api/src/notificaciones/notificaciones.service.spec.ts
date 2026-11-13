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

  const mockNotificacion = {
    id: '90000000-0000-0000-0000-000000000001',
    tipo: TipoNotificacion.ALERTA,
    titulo: 'Cierre de caja pendiente',
    cuerpo: 'Hay un cierre de caja pendiente de aprobación.',
    referencia_tipo: 'cierres_caja',
    referencia_id: '91000000-0000-0000-0000-000000000001',
    audiencia_rol_id: null,
    leido_en: null,
    creado_en: new Date(),
    creado_por: USER_ID,
  };

  beforeEach(async () => {
    prisma = {
      notificaciones: {
        create: jest.fn().mockResolvedValue(mockNotificacion),
        findMany: jest.fn().mockResolvedValue([mockNotificacion]),
        findUnique: jest.fn().mockResolvedValue(mockNotificacion),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({ ...mockNotificacion, leido_en: new Date() }),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      users_roles: {
        findMany: jest.fn().mockResolvedValue([{ rol_id: 'rol-a' }, { rol_id: 'rol-b' }]),
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
    it('debe crear la notificación con audiencia y referencia', async () => {
      await service.emitir({
        tipo: TipoNotificacion.ALERTA,
        titulo: 'OC aprobada',
        cuerpo: 'La orden OC-2026-001 fue aprobada.',
        referenciaTipo: 'ordenes_compra',
        referenciaId: 'x',
        creadoPor: USER_ID,
      });

      expect(prisma.notificaciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: TipoNotificacion.ALERTA,
            titulo: 'OC aprobada',
            referencia_tipo: 'ordenes_compra',
            audiencia_rol_id: null,
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

  describe('findMine', () => {
    it('filtra por audiencia: todos + los roles del usuario, con paginación y noLeidas', async () => {
      const result = await service.findMine(USER_ID, { page: 1, limit: 10 });

      expect(prisma.users_roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: USER_ID } }),
      );
      expect(prisma.notificaciones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ audiencia_rol_id: null }, { audiencia_rol_id: { in: ['rol-a', 'rol-b'] } }],
          },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.noLeidas).toBe(1);
      expect(result.items[0].titulo).toBe('Cierre de caja pendiente');
    });
  });

  describe('marcarLeida', () => {
    it('debe marcar leída, auditar SUCCESS y regresar la notificación', async () => {
      const result = await service.marcarLeida(mockNotificacion.id, USER_ID);

      expect(prisma.notificaciones.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockNotificacion.id },
          data: expect.objectContaining({ leido_en: expect.any(Date) }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOTIFICACION_LEIDA,
          result: AuditResult.SUCCESS,
          entityId: mockNotificacion.id,
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
      expect(prisma.notificaciones.update).not.toHaveBeenCalled();
    });
  });

  describe('marcarTodas', () => {
    it('debe marcar todas las del buzón y auditar con el conteo', async () => {
      const result = await service.marcarTodas(USER_ID);

      expect(prisma.notificaciones.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            leido_en: null,
            OR: [{ audiencia_rol_id: null }, { audiencia_rol_id: { in: ['rol-a', 'rol-b'] } }],
          }),
          data: expect.objectContaining({ leido_en: expect.any(Date) }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOTIFICACION_LEIDA,
          result: AuditResult.SUCCESS,
          newValue: expect.objectContaining({ marcadas: 3 }),
        }),
      );
      expect(result.marcadas).toBe(3);
    });
  });
});
