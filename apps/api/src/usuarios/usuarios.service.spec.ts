import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const ACTOR = 'c0000000-0000-0000-0000-000000000001';
  const ROL_ID = 'e0000000-0000-0000-0000-0000000000a5'; // Trabajador
  const USER_ID = '550e8400-e29b-41d4-a716-446655440010';
  const PERSONA_ID = '660e8400-e29b-41d4-a716-446655440010';

  const mockUsuarioRow = {
    id: USER_ID,
    persona_id: PERSONA_ID,
    email: 'nuevo@svr.com',
    activo: true,
    torre: 'ADMINISTRATIVO',
    numero_empleado: null,
    intentos_pin: 0,
    pin_temporal_hasta: null,
    creado_en: new Date('2026-11-14'),
    personas_users_persona_idTopersonas: { nombre: 'Ana', apellido_paterno: 'Lopez', apellido_materno: null },
    users_roles_users_roles_user_idTousers: [
      { activo: true, es_principal: true, roles: { id: ROL_ID, nombre: 'Trabajador' } },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: mockPrisma() },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(UsuariosService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockPrisma(): any {
    return {
      users: {
        findMany: jest.fn().mockResolvedValue([mockUsuarioRow]),
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(mockUsuarioRow),
        update: jest.fn().mockResolvedValue(mockUsuarioRow),
      },
      personas: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: PERSONA_ID }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: PERSONA_ID }),
      },
      roles: { findFirst: jest.fn().mockResolvedValue({ id: ROL_ID, nombre: 'Trabajador' }) },
      users_roles: {
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
        create: jest.fn().mockResolvedValue({ id: 'ur-1' }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      sessions: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn((ops: unknown) =>
        Array.isArray(ops) ? Promise.resolve(ops) : Promise.resolve((ops as (tx: unknown) => unknown)(prisma)),
      ),
    };
  }

  describe('findAll', () => {
    it('pagina con techo de 100 y excluye eliminados', async () => {
      await service.findAll({ page: 1, limit: 500 });
      const args = prisma.users.findMany.mock.calls[0][0];
      expect(args.where.eliminado_en).toBeNull();
      expect(args.take).toBe(100);
      expect(args.skip).toBe(0);
      const result = await service.findAll({ page: 1, limit: 500 });
      expect(result.pagination).toEqual({ page: 1, limit: 100, total: 1, totalPages: 1 });
      expect(result.items[0].email).toBe('nuevo@svr.com');
    });

    it('aplica search y filtros de rol/estado', async () => {
      await service.findAll({ search: 'ana', rolId: ROL_ID, estado: 'activo' });
      const args = prisma.users.findMany.mock.calls[0][0];
      expect(args.where.OR).toEqual(expect.any(Array));
      expect(args.where.users_roles_users_roles_user_idTousers).toEqual({
        some: { activo: true, rol_id: ROL_ID },
      });
      expect(args.where.activo).toBe(true);
    });
  });

  describe('findStats', () => {
    it('devuelve las 4 métricas', async () => {
      const result = await service.findStats();
      expect(result).toEqual({ total: 1, activos: 1, conIdentidad: 1, bloqueados: 1 });
      expect(prisma.users.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('findCatalogos', () => {
    it('devuelve roles asignables y personas sin usuario', async () => {
      prisma.roles.findMany = jest.fn().mockResolvedValue([
        { id: ROL_ID, nombre: 'Trabajador', nivel: 20, torre: null },
      ]);
      prisma.personas.findMany = jest.fn().mockResolvedValue([
        { id: PERSONA_ID, nombre: 'Ana', apellido_paterno: 'Lopez', apellido_materno: null },
      ]);
      const result = await service.findCatalogos();
      expect(prisma.roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: true, eliminado_en: null, es_sistema: false } }),
      );
      expect(result.personas).toEqual([{ id: PERSONA_ID, nombre: 'Ana Lopez' }]);
    });
  });

  describe('create', () => {
    const dtoBase = { email: 'NUEVO@svr.com', password: 'secreta123', rolId: ROL_ID };

    it('crea usuario con persona nueva y audit SUCCESS', async () => {
      prisma.users.findFirst.mockResolvedValue(null); // email libre
      const result = await service.create(
        { ...dtoBase, nombre: 'Ana', telefono: '55-1111-2222' },
        ACTOR,
      );
      expect(prisma.personas.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nombre: 'Ana', telefono: '55-1111-2222' }),
        }),
      );
      expect(prisma.personas.create).toHaveBeenCalled();
      const userData = prisma.users.create.mock.calls[0][0].data;
      expect(userData.email).toBe('nuevo@svr.com'); // normalizado a minúsculas
      expect(userData.password_hash).not.toBe('secreta123');
      expect(userData.users_roles_users_roles_user_idTousers.create.es_principal).toBe(true);
      expect(result.email).toBe('nuevo@svr.com');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.USUARIO_CREADO, result: AuditResult.SUCCESS }),
      );
    });

    it('reutiliza la persona existente del catálogo', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.personas.findUnique.mockResolvedValue({
        id: PERSONA_ID,
        users_users_persona_idTopersonas: null,
      });
      await service.create({ ...dtoBase, personaId: PERSONA_ID }, ACTOR);
      expect(prisma.personas.create).not.toHaveBeenCalled();
      expect(prisma.users.create.mock.calls[0][0].data.persona_id).toBe(PERSONA_ID);
    });

    it('rechaza rol no asignable con FAIL + ROL_NO_ASIGNABLE', async () => {
      prisma.roles.findFirst.mockResolvedValue(null);
      await expect(service.create({ ...dtoBase, nombre: 'Ana' }, ACTOR)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'ROL_NO_ASIGNABLE',
        }),
      );
    });

    it('rechaza email duplicado con FAIL + EMAIL_DUPLICADO', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: 'otro' });
      await expect(service.create({ ...dtoBase, nombre: 'Ana' }, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'EMAIL_DUPLICADO' }),
      );
    });

    it('rechaza persona que ya tiene usuario con FAIL + PERSONA_YA_TIENE_USUARIO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.personas.findUnique.mockResolvedValue({
        id: PERSONA_ID,
        users_users_persona_idTopersonas: { id: 'otro-user' },
      });
      await expect(
        service.create({ ...dtoBase, personaId: PERSONA_ID }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PERSONA_YA_TIENE_USUARIO' }),
      );
    });

    it('rechaza alta rápida sin nombre con FAIL + PERSONA_REQUERIDA', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.create(dtoBase, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'PERSONA_REQUERIDA' }),
      );
    });

    it('carrera real: P2002 → FAIL + EMAIL_DUPLICADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null); // pre-check pasa
      const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      });
      prisma.users.create.mockRejectedValue(p2002);
      await expect(service.create({ ...dtoBase, nombre: 'Ana' }, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'EMAIL_DUPLICADO' }),
      );
    });
  });

  describe('update', () => {
    it('edita persona (nombre/telefono), torre y audita SUCCESS', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'nuevo@svr.com',
        persona_id: PERSONA_ID,
        users_roles_users_roles_user_idTousers: [{ rol_id: ROL_ID }],
      });
      await service.update(
        USER_ID,
        { nombre: 'Ana Actualizada', telefono: '55-9999-8888', torre: 'RESIDENTE' },
        ACTOR,
      );
      expect(prisma.personas.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PERSONA_ID },
          data: expect.objectContaining({ nombre: 'Ana Actualizada', telefono: '55-9999-8888' }),
        }),
      );
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ torre: 'RESIDENTE' }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.USUARIO_ACTUALIZADO, result: AuditResult.SUCCESS }),
      );
    });

    it('contraseña nueva se hashea (nunca en claro)', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'nuevo@svr.com',
        persona_id: PERSONA_ID,
        users_roles_users_roles_user_idTousers: [{ rol_id: ROL_ID }],
      });
      await service.update(USER_ID, { password: 'nuevaClave123' }, ACTOR);
      const data = prisma.users.update.mock.calls[0][0].data;
      expect(data.password_hash).toBeDefined();
      expect(data.password_hash).not.toBe('nuevaClave123');
    });

    it('sin contraseña nueva la actual se conserva', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'nuevo@svr.com',
        persona_id: PERSONA_ID,
        users_roles_users_roles_user_idTousers: [{ rol_id: ROL_ID }],
      });
      await service.update(USER_ID, { torre: 'RESIDENTE' }, ACTOR);
      const data = prisma.users.update.mock.calls[0][0].data;
      expect(data.password_hash).toBeUndefined();
    });

    it('cambio de rol delega en cambiarRol', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({
          id: USER_ID,
          email: 'nuevo@svr.com',
          persona_id: PERSONA_ID,
          users_roles_users_roles_user_idTousers: [{ rol_id: ROL_ID }],
        }) // el usuario (update)
        .mockResolvedValueOnce({
          id: USER_ID,
          users_roles_users_roles_user_idTousers: [
            { activo: true, roles: { nombre: 'Trabajador' } },
          ],
        }); // el usuario (cambiarRol)
      prisma.roles.findFirst.mockResolvedValue({ id: 'rol-nuevo', nombre: 'Residente' });
      await service.update(USER_ID, { rolId: 'rol-nuevo' }, ACTOR);
      expect(prisma.users_roles.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: USER_ID, activo: true } }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ROL_ASIGNADO,
          metadata: expect.objectContaining({ modo: 'cambio' }),
        }),
      );
    });

    it('usuario no encontrado → FAIL + USUARIO_NO_ENCONTRADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.update(USER_ID, {}, ACTOR)).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'USUARIO_NO_ENCONTRADO' }),
      );
    });

    it('email tomado por otro → FAIL + EMAIL_DUPLICADO', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({
          id: USER_ID,
          email: 'nuevo@svr.com',
          persona_id: PERSONA_ID,
          users_roles_users_roles_user_idTousers: [{ rol_id: ROL_ID }],
        }) // el propio
        .mockResolvedValueOnce({ id: 'otro-user' }); // el email lo tiene otro
      await expect(
        service.update(USER_ID, { email: 'otro@svr.com' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'EMAIL_DUPLICADO' }),
      );
    });

    it('rol nuevo inválido → FAIL + ROL_NO_ASIGNABLE (fail-fast)', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'nuevo@svr.com',
        persona_id: PERSONA_ID,
        users_roles_users_roles_user_idTousers: [{ rol_id: ROL_ID }],
      });
      prisma.roles.findFirst.mockResolvedValue(null);
      await expect(
        service.update(USER_ID, { rolId: 'rol-malo' }, ACTOR),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.personas.update).not.toHaveBeenCalled();
      expect(prisma.users.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft delete + cierra sesiones, audit SUCCESS', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        email: 'nuevo@svr.com',
        users_roles_users_roles_user_idTousers: [{ activo: true, roles: { nombre: 'Trabajador', es_sistema: false } }],
      });
      const result = await service.remove(USER_ID, ACTOR);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.sessions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: USER_ID, activa: true }),
        }),
      );
      expect(result.message).toBe('Usuario eliminado');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.USUARIO_ELIMINADO, result: AuditResult.SUCCESS }),
      );
    });

    it('no se puede eliminar a sí mismo → FAIL', async () => {
      await expect(service.remove(ACTOR, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'NO_PUEDE_ELIMINARSE_A_SI_MISMO' }),
      );
    });

    it('no encontrado → FAIL + USUARIO_NO_ENCONTRADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.remove(USER_ID, ACTOR)).rejects.toThrow(NotFoundException);
    });

    it('último Administrador → FAIL + ULTIMO_ADMINISTRADOR', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({
          id: USER_ID,
          email: 'admin@svr.com',
          users_roles_users_roles_user_idTousers: [
            { activo: true, roles: { nombre: 'Administrador', es_sistema: true } },
          ],
        })
        .mockResolvedValueOnce({
          id: USER_ID,
          users_roles_users_roles_user_idTousers: [
            { activo: true, roles: { es_sistema: true } },
          ],
        });
      prisma.users.count.mockResolvedValue(1); // solo él
      await expect(service.remove(USER_ID, ACTOR)).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ULTIMO_ADMINISTRADOR' }),
      );
    });
  });

  describe('cambiarEstado', () => {
    it('desactiva y cierra sesiones, audit SUCCESS con metadata', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, activo: true });
      const result = await service.cambiarEstado(USER_ID, { activo: false }, ACTOR);
      expect(prisma.sessions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: USER_ID, activa: true }),
        }),
      );
      expect(result.message).toBe('Usuario desactivado');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.USUARIO_ACTUALIZADO,
          metadata: expect.objectContaining({ campo: 'activo', valor: false }),
        }),
      );
    });

    it('activa sin cerrar sesiones', async () => {
      prisma.users.findFirst.mockResolvedValue({ id: USER_ID, activo: false });
      const result = await service.cambiarEstado(USER_ID, { activo: true }, ACTOR);
      expect(prisma.sessions.updateMany).not.toHaveBeenCalled();
      expect(result.message).toBe('Usuario activado');
    });

    it('no se puede desactivar a sí mismo → FAIL', async () => {
      await expect(
        service.cambiarEstado(ACTOR, { activo: false }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'NO_PUEDE_DESACTIVARSE_A_SI_MISMO' }),
      );
    });

    it('no encontrado → FAIL + USUARIO_NO_ENCONTRADO', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.cambiarEstado(USER_ID, { activo: true }, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('último Administrador → FAIL + ULTIMO_ADMINISTRADOR', async () => {
      prisma.users.findFirst
        .mockResolvedValueOnce({ id: USER_ID, activo: true })
        .mockResolvedValueOnce({
          id: USER_ID,
          users_roles_users_roles_user_idTousers: [
            { activo: true, roles: { es_sistema: true } },
          ],
        });
      prisma.users.count.mockResolvedValue(1);
      await expect(
        service.cambiarEstado(USER_ID, { activo: false }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ULTIMO_ADMINISTRADOR' }),
      );
    });
  });

  describe('cambiarRol (mono-rol)', () => {
    it('cambia el rol en transacción y audita el cambio', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        users_roles_users_roles_user_idTousers: [
          { activo: true, roles: { nombre: 'Trabajador' } },
        ],
      });
      prisma.roles.findFirst.mockResolvedValue({ id: 'rol-nuevo', nombre: 'Residente' });
      await service.cambiarRol(USER_ID, { rolId: 'rol-nuevo' }, ACTOR);
      expect(prisma.users_roles.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: USER_ID, activo: true } }),
      );
      expect(prisma.users_roles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rol_id: 'rol-nuevo', es_principal: true }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ROL_ASIGNADO,
          metadata: expect.objectContaining({ modo: 'cambio', rolAnterior: 'Trabajador' }),
        }),
      );
    });

    it('usuario no encontrado → FAIL', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(
        service.cambiarRol(USER_ID, { rolId: 'rol-nuevo' }, ACTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('rol no asignable → FAIL + ROL_NO_ASIGNABLE', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        users_roles_users_roles_user_idTousers: [],
      });
      prisma.roles.findFirst.mockResolvedValue(null);
      await expect(
        service.cambiarRol(USER_ID, { rolId: 'rol-malo' }, ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('mismo rol → FAIL + ROL_YA_ASIGNADO', async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: USER_ID,
        users_roles_users_roles_user_idTousers: [
          { activo: true, roles: { nombre: 'Trabajador' } },
        ],
      });
      prisma.roles.findFirst.mockResolvedValue({ id: ROL_ID, nombre: 'Trabajador' });
      await expect(
        service.cambiarRol(USER_ID, { rolId: ROL_ID }, ACTOR),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ROL_YA_ASIGNADO' }),
      );
    });
  });
});
