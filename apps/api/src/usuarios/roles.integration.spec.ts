/**
 * Integration tests for RolesService + ficha 360 — real DB, no mocks.
 *
 * Verifies:
 * - CRUD de roles con auditoría real (ROL_CREADO/ACTUALIZADO/ELIMINADO).
 * - Vistas y permisos del rol con auditoría propia.
 * - es_sistema (Administrador) protegido en todo.
 * - Ficha 360 (GET identidad) refleja vistas/permisos heredados.
 * - Cierre masivo de sesiones cierra sesiones y revoca tokens.
 *
 * Run with: npm run test:integration -- --testPathPattern="src/usuarios"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { RolesService } from './roles.service';
import { UsuariosService } from './usuarios.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Roles — Gestión de Identidad (Real DB)', () => {
  let prisma: PrismaService;
  let rolesService: RolesService;
  let usuariosService: UsuariosService;

  const createdUsers: string[] = [];
  const createdPersonas: string[] = [];
  const createdRoles: string[] = [];
  const createdSessions: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuditContextService,
        AuditService,
        RolesService,
        UsuariosService,
      ],
    }).compile();

    prisma = module.get(PrismaService);
    rolesService = module.get(RolesService);
    usuariosService = module.get(UsuariosService);
  });

  afterAll(async () => {
    if (!prisma) return;

    // FK-safe: refresh_tokens → sessions → users_roles → users → personas → roles.
    await prisma.refresh_tokens.deleteMany({
      where: { sessions: { user_id: { in: createdUsers } } },
    });
    await prisma.sessions.deleteMany({
      where: { OR: [{ user_id: { in: createdUsers } }, { id: { in: createdSessions } }] },
    });
    await prisma.users_roles.deleteMany({
      where: { user_id: { in: createdUsers } },
    });
    await prisma.users.deleteMany({
      where: { id: { in: createdUsers } },
    });
    await prisma.personas.deleteMany({
      where: { id: { in: createdPersonas } },
    });
    await prisma.roles.deleteMany({
      where: { id: { in: createdRoles } },
    });
    // registro_auditoria es INMUTABLE (trigger) — se deja.

    await prisma.$disconnect();
  });

  const crearRol = async (nombreSuffix = '') => {
    const creado = await rolesService.create(
      {
        nombre: `ZZ-rolf3-${TEST_ID}${nombreSuffix}`,
        descripcion: 'rol de prueba fase 3',
        nivel: 5,
      },
      ACTOR_USER_ID,
    );
    createdRoles.push(creado.id);
    return creado;
  };

  const crearUsuarioConRol = async (rolId: string) => {
    const persona = await prisma.personas.create({
      data: {
        id: randomUUID(),
        nombre: `Usu ${TEST_ID}`,
        actualizado_en: new Date(),
      },
    });
    createdPersonas.push(persona.id);
    const creado = await usuariosService.create(
      {
        personaId: persona.id,
        email: `zz-f3-${randomUUID().slice(0, 6)}@test.mx`,
        password: 'passwordSegura1',
        rolId,
      },
      ACTOR_USER_ID,
    );
    createdUsers.push(creado.id);
    return creado;
  };

  describe('ROL_CREADO', () => {
    it('crea rol y registra la auditoría real', async () => {
      const rol = await crearRol();
      expect(rol.nombre).toContain('ZZ-rolf3-');

      const audit = await prisma.registro_auditoria.findFirst({
        where: { action: AuditAction.ROL_CREADO, entity_id: rol.id, result: 'SUCCESS' },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
      expect(audit!.actor_user_id).toBe(ACTOR_USER_ID);
    });

    it('nombre duplicado → FAIL + NOMBRE_DUPLICADO', async () => {
      const rol = await crearRol('-dup');
      await expect(
        rolesService.create({ nombre: rol.nombre }, ACTOR_USER_ID),
      ).rejects.toThrow(BadRequestException);

      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.ROL_CREADO,
          result: AuditResult.FAIL,
          error_code: 'NOMBRE_DUPLICADO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });
  });

  describe('ROL_SISTEMA_PROTEGIDO', () => {
    it('el Administrador (es_sistema) no se edita, no se le tocan vistas/permisos ni se elimina', async () => {
      const admin = await prisma.roles.findFirst({
        where: { es_sistema: true, eliminado_en: null },
        select: { id: true },
      });
      expect(admin).not.toBeNull();

      await expect(
        rolesService.update(admin!.id, { nombre: 'Hack' }, ACTOR_USER_ID),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        rolesService.updateVistas(admin!.id, { vistas: [] }, ACTOR_USER_ID),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        rolesService.updatePermisos(admin!.id, { agregar: [] }, ACTOR_USER_ID),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        rolesService.remove(admin!.id, ACTOR_USER_ID),
      ).rejects.toThrow(ForbiddenException);

      const fails = await prisma.registro_auditoria.count({
        where: { result: AuditResult.FAIL, error_code: 'ROL_SISTEMA_PROTEGIDO' },
      });
      expect(fails).toBeGreaterThanOrEqual(4);
    });
  });

  describe('VISTAS_ROL_ACTUALIZADAS y PERMISOS_ROL_ACTUALIZADAS', () => {
    it('asigna vistas con flags y permisos, y findVistas/findPermisos lo reflejan', async () => {
      const rol = await crearRol('-vp');

      const vistasBD = await prisma.vistas.findMany({
        where: { activo: true, eliminado_en: null },
        select: { id: true },
        take: 2,
      });
      const permisoBD = await prisma.permissions.findFirst({
        where: { modulo: 'operaciones', recurso: 'criba', accion: 'ver' },
        select: { id: true },
      });
      expect(vistasBD.length).toBeGreaterThan(0);
      expect(permisoBD).not.toBeNull();

      await rolesService.updateVistas(
        rol.id,
        {
          vistas: [
            {
              vistaId: vistasBD[0].id,
              puedeVer: true,
              puedeCrear: true,
              puedeEditar: false,
              puedeEliminar: false,
              puedeExportar: false,
            },
            {
              vistaId: vistasBD[1].id,
              puedeVer: true,
              puedeCrear: false,
              puedeEditar: false,
              puedeEliminar: false,
              puedeExportar: false,
            },
          ],
        },
        ACTOR_USER_ID,
      );

      const detalle = await rolesService.findVistas(rol.id);
      const v0 = detalle.vistas.find((v) => v.vistaId === vistasBD[0].id);
      expect(v0!.puedeVer).toBe(true);
      expect(v0!.puedeCrear).toBe(true);

      await rolesService.updatePermisos(
        rol.id,
        { agregar: [permisoBD!.id] },
        ACTOR_USER_ID,
      );
      const permisos = await rolesService.findPermisos(rol.id);
      const asignado = permisos.permisos.find((p) => p.id === permisoBD!.id);
      expect(asignado!.asignado).toBe(true);

      const auditVistas = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.VISTAS_ROL_ACTUALIZADAS,
          entity_id: rol.id,
          result: 'SUCCESS',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(auditVistas).not.toBeNull();

      const auditPermisos = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.PERMISOS_ROL_ACTUALIZADAS,
          entity_id: rol.id,
          result: 'SUCCESS',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(auditPermisos).not.toBeNull();
    });
  });

  describe('ROL_EN_USO y ROL_ELIMINADO', () => {
    it('no elimina un rol con usuarios asignados; el libre se elimina (soft delete)', async () => {
      const rolUsado = await crearRol('-usado');
      await crearUsuarioConRol(rolUsado.id);

      await expect(
        rolesService.remove(rolUsado.id, ACTOR_USER_ID),
      ).rejects.toThrow(BadRequestException);
      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.ROL_ELIMINADO,
          result: AuditResult.FAIL,
          error_code: 'ROL_EN_USO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();

      const rolLibre = await crearRol('-libre');
      const resultado = await rolesService.remove(rolLibre.id, ACTOR_USER_ID);
      expect(resultado.message).toContain('eliminado');
      const audit = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.ROL_ELIMINADO,
          entity_id: rolLibre.id,
          result: 'SUCCESS',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).not.toBeNull();
    });
  });

  describe('FICHA 360 y cierre de sesiones', () => {
    it('la ficha hereda vistas/permisos del rol y el cierre masivo cierra sesiones y revoca tokens', async () => {
      const rol = await crearRol('-ficha');
      const vistasBD = await prisma.vistas.findMany({
        where: { activo: true, eliminado_en: null },
        select: { id: true },
        take: 1,
      });
      const permisoBD = await prisma.permissions.findFirst({
        select: { id: true },
      });
      await rolesService.updateVistas(
        rol.id,
        {
          vistas: [
            {
              vistaId: vistasBD[0].id,
              puedeVer: true,
              puedeCrear: false,
              puedeEditar: false,
              puedeEliminar: false,
              puedeExportar: false,
            },
          ],
        },
        ACTOR_USER_ID,
      );
      await rolesService.updatePermisos(
        rol.id,
        { agregar: [permisoBD!.id] },
        ACTOR_USER_ID,
      );

      const usuario = await crearUsuarioConRol(rol.id);

      // Sesión activa real
      const sesion = await prisma.sessions.create({
        data: {
          id: randomUUID(),
          user_id: usuario.id,
          refresh_token_jti: randomUUID(),
          activa: true,
          expira_en: new Date(Date.now() + 3_600_000),
          actualizado_en: new Date(),
        },
      });
      createdSessions.push(sesion.id);
      await prisma.refresh_tokens.create({
        data: {
          id: randomUUID(),
          session_id: sesion.id,
          jti: randomUUID(),
          token_hash: 'hash-test',
          expira_en: new Date(Date.now() + 3_600_000),
        },
      });

      // Ficha 360
      const ficha = await usuariosService.findIdentidad(usuario.id);
      expect(ficha.roles[0].id).toBe(rol.id);
      expect(ficha.vistas.some((v) => v.vistaId === vistasBD[0].id && v.puedeVer)).toBe(true);
      expect(ficha.permisos.some((p) => p.id === permisoBD!.id)).toBe(true);
      expect(ficha.sesiones).toHaveLength(1);

      // Cierre masivo
      const resultado = await usuariosService.cierreSesiones(usuario.id, ACTOR_USER_ID);
      expect(resultado.message).toContain('1');

      const sesionCerrada = await prisma.sessions.findUnique({ where: { id: sesion.id } });
      expect(sesionCerrada!.activa).toBe(false);
      expect(sesionCerrada!.motivo_cierre).toBe('cierre_masivo');
      const tokens = await prisma.refresh_tokens.findMany({
        where: { session_id: sesion.id },
      });
      expect(tokens.every((t) => !t.activo && t.revocado_en)).toBe(true);

      const audit = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.SESION_CERRADA,
          entity_id: usuario.id,
          result: 'SUCCESS',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect((audit!.metadata as Record<string, unknown>).modo).toBe('masivo');
      expect((audit!.metadata as Record<string, unknown>).sesiones).toBe(1);
    });

    it('no permite cerrar las propias sesiones con FAIL', async () => {
      await expect(
        usuariosService.cierreSesiones(ACTOR_USER_ID, ACTOR_USER_ID),
      ).rejects.toThrow(BadRequestException);
      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.SESION_CERRADA,
          result: AuditResult.FAIL,
          error_code: 'NO_PUEDE_CERRAR_SUS_PROPIAS_SESIONES',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });

    it('no permite cambiar el rol del Administrador (es_sistema) → FAIL + ROL_SISTEMA_PROTEGIDO', async () => {
      const adminSeed = await prisma.users.findFirst({
        where: {
          eliminado_en: null,
          users_roles_users_roles_user_idTousers: {
            some: { activo: true, roles: { es_sistema: true } },
          },
        },
        select: { id: true },
      });
      expect(adminSeed).not.toBeNull();

      const rolZZ3 = await crearRol('-cambio');
      await expect(
        usuariosService.cambiarRol(adminSeed!.id, { rolId: rolZZ3.id }, ACTOR_USER_ID),
      ).rejects.toThrow(ForbiddenException);

      // El rol del admin sigue intacto
      const activos = await prisma.users_roles.findMany({
        where: { user_id: adminSeed!.id, activo: true },
        include: { roles: { select: { es_sistema: true } } },
      });
      expect(activos.some((ur) => ur.roles.es_sistema)).toBe(true);

      const fail = await prisma.registro_auditoria.findFirst({
        where: {
          action: AuditAction.ROL_ASIGNADO,
          result: AuditResult.FAIL,
          error_code: 'ROL_SISTEMA_PROTEGIDO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(fail).not.toBeNull();
    });
  });
});
