import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('RolesService', () => {
  let service: RolesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const ACTOR = 'c0000000-0000-0000-0000-000000000001';
  const ROL_ID = 'e0000000-0000-0000-0000-0000000000a5';

  const rolSistema = {
    id: 'a0000000-0000-0000-0000-000000000001',
    nombre: 'Administrador',
    es_sistema: true,
    _count: { users_roles: 1, role_vistas: 39, role_permissions: 96 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma() },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(RolesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockPrisma(): any {
    return {
      roles: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: ROL_ID, nombre: 'Nuevo', nivel: 0, torre: null, es_sistema: false }),
        update: jest.fn().mockResolvedValue({ id: ROL_ID, nombre: 'Editado', nivel: 0 }),
        count: jest.fn().mockResolvedValue(1),
      },
      vistas: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(1) },
      role_vistas: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      permissions: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(1),
      },
      role_permissions: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn((ops: unknown) =>
        Array.isArray(ops) ? Promise.resolve(ops) : Promise.resolve((ops as (tx: unknown) => unknown)(prisma)),
      ),
    };
  }

  describe('findCatalogo', () => {
    it('lista roles con conteos y excluye eliminados', async () => {
      prisma.roles.findMany.mockResolvedValue([rolSistema]);
      const result = await service.findCatalogo();
      expect(prisma.roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eliminado_en: null } }),
      );
      expect(result.items[0].esSistema).toBe(true);
      expect(result.items[0].usuarios).toBe(1);
    });
  });

  describe('create', () => {
    it('crea rol y audita ROL_CREADO SUCCESS', async () => {
      prisma.roles.findFirst.mockResolvedValue(null); // nombre libre
      await service.create({ nombre: 'Nuevo Rol' }, ACTOR);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROL_CREADO, result: AuditResult.SUCCESS }),
      );
    });

    it('nombre duplicado → FAIL + NOMBRE_DUPLICADO', async () => {
      prisma.roles.findFirst.mockResolvedValue({ id: 'otro' });
      await expect(service.create({ nombre: 'Nuevo Rol' }, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'NOMBRE_DUPLICADO' }),
      );
    });

    it('carrera real: P2002 → FAIL + NOMBRE_DUPLICADO', async () => {
      prisma.roles.findFirst.mockResolvedValue(null);
      prisma.roles.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
      );
      await expect(service.create({ nombre: 'Nuevo Rol' }, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'NOMBRE_DUPLICADO' }),
      );
    });
  });

  describe('update', () => {
    it('edita rol y audita ROL_ACTUALIZADO SUCCESS', async () => {
      prisma.roles.findFirst
        .mockResolvedValueOnce({ id: ROL_ID, nombre: 'Viejo', es_sistema: false })
        .mockResolvedValueOnce(null); // nombre nuevo libre
      await service.update(ROL_ID, { nombre: 'Editado' }, ACTOR);
      expect(prisma.roles.update).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROL_ACTUALIZADO, result: AuditResult.SUCCESS }),
      );
    });

    it('no encontrado → FAIL + ROL_NO_ENCONTRADO', async () => {
      prisma.roles.findFirst.mockResolvedValue(null);
      await expect(service.update(ROL_ID, {}, ACTOR)).rejects.toThrow(NotFoundException);
    });

    it('es_sistema → FAIL + ROL_SISTEMA_PROTEGIDO', async () => {
      prisma.roles.findFirst.mockResolvedValue(rolSistema);
      await expect(service.update(rolSistema.id, { nombre: 'X' }, ACTOR)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ROL_SISTEMA_PROTEGIDO' }),
      );
    });

    it('nombre tomado por otro → FAIL + NOMBRE_DUPLICADO', async () => {
      prisma.roles.findFirst
        .mockResolvedValueOnce({ id: ROL_ID, nombre: 'Viejo', es_sistema: false })
        .mockResolvedValueOnce({ id: 'otro' });
      await expect(service.update(ROL_ID, { nombre: 'Otro' }, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('soft delete y audita ROL_ELIMINADO SUCCESS', async () => {
      prisma.roles.findFirst.mockResolvedValue({
        id: ROL_ID,
        nombre: 'Viejo',
        es_sistema: false,
        _count: { users_roles: 0 },
      });
      const result = await service.remove(ROL_ID, ACTOR);
      expect(result.message).toContain('eliminado');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ROL_ELIMINADO, result: AuditResult.SUCCESS }),
      );
    });

    it('rol en uso → FAIL + ROL_EN_USO', async () => {
      prisma.roles.findFirst.mockResolvedValue({
        id: ROL_ID,
        nombre: 'Usado',
        es_sistema: false,
        _count: { users_roles: 3 },
      });
      await expect(service.remove(ROL_ID, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ROL_EN_USO' }),
      );
    });

    it('es_sistema → FAIL + ROL_SISTEMA_PROTEGIDO', async () => {
      prisma.roles.findFirst.mockResolvedValue(rolSistema);
      await expect(service.remove(rolSistema.id, ACTOR)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateVistas', () => {
    const dto = {
      vistas: [
        {
          vistaId: 'v1',
          puedeVer: true,
          puedeCrear: false,
          puedeEditar: false,
          puedeEliminar: false,
          puedeExportar: false,
        },
      ],
    };

    it('upsert de vistas y audita VISTAS_ROL_ACTUALIZADAS', async () => {
      prisma.roles.findFirst.mockResolvedValue({ id: ROL_ID, es_sistema: false, nombre: 'R' });
      await service.updateVistas(ROL_ID, dto, ACTOR);
      expect(prisma.role_vistas.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { rol_id: ROL_ID, vista_id: { in: ['v1'] } } }),
      );
      expect(prisma.role_vistas.createMany).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.VISTAS_ROL_ACTUALIZADAS,
          metadata: expect.objectContaining({ vistas: 1 }),
        }),
      );
    });

    it('es_sistema → FAIL + ROL_SISTEMA_PROTEGIDO', async () => {
      prisma.roles.findFirst.mockResolvedValue({ id: ROL_ID, es_sistema: true, nombre: 'Admin' });
      await expect(service.updateVistas(ROL_ID, dto, ACTOR)).rejects.toThrow(ForbiddenException);
      expect(prisma.role_vistas.deleteMany).not.toHaveBeenCalled();
    });

    it('vista inexistente → FAIL + VISTA_NO_ENCONTRADA', async () => {
      prisma.roles.findFirst.mockResolvedValue({ id: ROL_ID, es_sistema: false, nombre: 'R' });
      prisma.vistas.count.mockResolvedValue(0);
      await expect(service.updateVistas(ROL_ID, dto, ACTOR)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePermisos', () => {
    it('agrega y quita solo lo pendiente, audita PERMISOS_ROL_ACTUALIZADAS', async () => {
      prisma.roles.findFirst.mockResolvedValue({ id: ROL_ID, es_sistema: false, nombre: 'R' });
      prisma.permissions.count.mockResolvedValue(2); // p1 y p2 existen
      prisma.role_permissions.findMany.mockResolvedValue([{ permiso_id: 'p1' }]);
      await service.updatePermisos(ROL_ID, { agregar: ['p1', 'p2'], quitar: ['p1'] }, ACTOR);
      expect(prisma.role_permissions.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: [{ rol_id: ROL_ID, permiso_id: 'p2' }] }),
      );
      expect(prisma.role_permissions.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { rol_id: ROL_ID, permiso_id: { in: ['p1'] } } }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PERMISOS_ROL_ACTUALIZADAS,
          metadata: expect.objectContaining({ agregados: 1, quitados: 1 }),
        }),
      );
    });

    it('permiso inexistente → FAIL + PERMISO_NO_ENCONTRADO', async () => {
      prisma.roles.findFirst.mockResolvedValue({ id: ROL_ID, es_sistema: false, nombre: 'R' });
      prisma.permissions.count.mockResolvedValue(0);
      await expect(
        service.updatePermisos(ROL_ID, { agregar: ['fantasma'] }, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
