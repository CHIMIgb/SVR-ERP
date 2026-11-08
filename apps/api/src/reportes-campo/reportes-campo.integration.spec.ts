/**
 * Integration tests for ReportesCampoService — real DB, no mocks.
 *
 * Nuevo flujo de incidentes: NUEVO → EN_CURSO → CERRADO, actividades,
 * adjuntos, subcategorías por torre + auditoría:
 *   REPORTE_CREADO, REPORTE_ACTUALIZADO, REPORTE_ELIMINADO,
 *   REPORTE_COMENTADO, REPORTE_ADJUNTO, ESTATUS_CAMBIADO (éxitos y fallos)
 *
 * Run with: npm run test:integration -- --testPathPattern="reportes-campo"
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuditAction,
  CategoriaReporte,
  EstadoIncidente,
  Prioridad,
  TipoReporteCampo,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { ReportesCampoService } from './reportes-campo.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

/** PNG 1x1 válido (67 bytes) para pruebas reales de adjuntos. */
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PNG_FALSO_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERAT'; // jpeg header truncado

describe('ReportesCampo Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ReportesCampoService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditContext: any;

  const createdIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, ReportesCampoService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(ReportesCampoService);
    auditContext = module.get(AuditContextService);
  });

  afterAll(async () => {
    if (!prisma) return;

    // Orden FK-safe: actividades/adjuntos → reportes (registro_auditoria es inmutable).
    if (createdIds.length > 0) {
      await prisma.reportes_campo.deleteMany({
        where: { id: { in: createdIds } },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    tipo: TipoReporteCampo.PIPERO,
    categoria: CategoriaReporte.DIESEL,
    usuario: `Marcos G. ${TEST_ID}`,
    obraTexto: `Obra-${TEST_ID}`,
    fecha: '2026-08-20',
    hora: '14:15',
    descripcion: `Suministro de diésel test ${TEST_ID}`,
    ...overrides,
  });

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  describe('ASIGNAR — "quién le cae" (REPORTE_ASIGNADO, BD real)', () => {
    it('asigna responsable real y audita REPORTE_ASIGNADO SUCCESS', async () => {
      // arrange: crear reporte + usar un trabajador real del seed
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);
      const trabajador = await prisma.trabajadores.findFirst({
        where: { eliminado_en: null, activo: true },
        select: { id: true, nombre: true },
      });
      expect(trabajador).not.toBeNull();

      // act
      const asignado = await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        () => service.asignar(reporte.id, { asignadoA: trabajador!.id }, ACTOR_USER_ID),
      );

      // assert: BD real
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.asignado_a_id).toBe(trabajador!.id);
      expect(row!.asignado_en).not.toBeNull();
      expect(asignado.asignadoAId).toBe(trabajador!.id);
      expect(asignado.asignadoANombre).toBe(trabajador!.nombre);

      // auditoría real
      const audits = await findAudits(AuditAction.REPORTE_ASIGNADO, reporte.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      // previousValue: quién tenía el reporte antes (null en primera asignación)
      expect(audits[0].previous_value).toEqual({ asignadoAId: null, asignadoNombre: null });
    });

    it('audita FAIL + error_code cuando el responsable no existe (no guarda nada)', async () => {
      // arrange
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      // act / assert
      await expect(
        auditContext.run(
          { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
          () => service.asignar(reporte.id, { asignadoA: randomUUID() }, ACTOR_USER_ID),
        ),
      ).rejects.toThrow(BadRequestException);

      const audits = await findAudits(AuditAction.REPORTE_ASIGNADO, reporte.id);
      const ultimo = audits[0];
      expect(ultimo.result).toBe('FAIL');
      expect(ultimo.error_code).toBe('TRABAJADOR_NO_ENCONTRADO');

      // nada quedó asignado
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.asignado_a_id).toBeNull();
    });

    it('rechaza asignación vacía con ASIGNACION_VACIA (auditoría FAIL real)', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        async () => {
          await expect(service.asignar(reporte.id, {}, ACTOR_USER_ID)).rejects.toThrow(
            BadRequestException,
          );
        },
      );

      const audits = await findAudits(AuditAction.REPORTE_ASIGNADO, reporte.id);
      expect(audits[0].result).toBe('FAIL');
      expect(audits[0].error_code).toBe('ASIGNACION_VACIA');
    });
  });

  describe('FOLIO INC + categoria — create (BD real)', () => {
    it('create genera folio INC%04d secuencial, único, y persiste categoria', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      expect(reporte.codigo).toMatch(/^INC\d{4}$/);
      expect(reporte.categoria).toBe('Diesel');

      // BD real: el folio es único y la categoria guardada es el enum crudo
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.codigo).toBe(reporte.codigo);
      expect(row!.categoria).toBe('DIESEL');
      expect(row!.estado).toBe('NUEVO');

      // el siguiente create NO repite folio (correlativo fresco, unicidad por BD)
      const otro = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(otro.id);
      expect(otro.codigo).not.toBe(reporte.codigo);

      // auditoría SUCCESS del create con folio
      const audits = await findAudits(AuditAction.REPORTE_CREADO, reporte.id);
      expect(audits[0].result).toBe('SUCCESS');
      expect((audits[0].new_value as { codigo?: string })?.codigo).toBe(reporte.codigo);
    });

    it('rechaza categoria inválida a nivel BD (enum: nada entra con valor ajeno)', async () => {
      // el ValidationPipe ya filtra en runtime; aquí probamos el enum crudo
      await expect(
        prisma.reportes_campo.create({
          data: {
            id: randomUUID(),
            tipo: 'PIPERO',
            categoria: 'COCINERO', // valor fuera del enum — PG debe rechazarlo
            usuario: `Test ${TEST_ID}`,
            obra_texto: 'Test',
            fecha: new Date(),
            hora: '10:00',
            descripcion: `Categoria inválida ${TEST_ID}`,
            estado: 'NUEVO',
          } as never,
        }),
      ).rejects.toThrow();
    });
  });

  describe('SUBCATEGORIAS — catálogo por torre (BD real)', () => {
    it('valida que la subcategoría pertenezca a la categoría y la persista', async () => {
      //Diesel del seed
      const subDiesel = await prisma.subcategorias_reporte.findFirst({
        where: { categoria: 'DIESEL', activo: true },
      });
      expect(subDiesel).not.toBeNull();

      const reporte = await service.create(
        createDto({ subcategoriaId: subDiesel!.id }),
        ACTOR_USER_ID,
      );
      createdIds.push(reporte.id);
      expect(reporte.subcategoria).toBe(subDiesel!.nombre);

      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.subcategoria_id).toBe(subDiesel!.id);

      // auditoría SUCCESS con subcategoría en el payload
      const audits = await findAudits(AuditAction.REPORTE_CREADO, reporte.id);
      expect(
        (audits[0].new_value as { subcategoria?: string })?.subcategoria,
      ).toBe(subDiesel!.nombre);
    });

    it('rechaza subcategoría ajena a la categoría (SUBCATEGORIA_INVALIDA, FAIL auditado)', async () => {
      const subMecanico = await prisma.subcategorias_reporte.findFirst({
        where: { categoria: 'MECANICO', activo: true },
      });
      expect(subMecanico).not.toBeNull();

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'POST' },
        async () => {
          await expect(
            service.create(createDto({ subcategoriaId: subMecanico!.id }), ACTOR_USER_ID),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.REPORTE_CREADO,
          result: 'FAIL',
          error_code: 'SUBCATEGORIA_INVALIDA',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });

    it('exponde el catálogo agrupado por torre (≥1 por cada categoría sembrada)', async () => {
      const catalogo = await service.subcategorias();
      expect(catalogo.length).toBeGreaterThanOrEqual(9);
      const diesel = catalogo.filter((s) => s.categoria === 'Diesel');
      expect(diesel.some((s) => s.nombre === '150 litros de diésel')).toBe(true);
      const admin = catalogo.filter((s) => s.categoria === 'Administrativo');
      expect(admin.some((s) => s.nombre === 'Cubeta de aceite')).toBe(true);
    });
  });

  describe('CERRAR — cerrado_en y flujo NUEVO → EN_CURSO → CERRADO (BD real)', () => {
    it('recorre el flujo completo y persiste cerrado_en real', async () => {
      // arrange
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        () => service.cambiarEstado(reporte.id, { estado: EstadoIncidente.EN_CURSO }, ACTOR_USER_ID),
      );
      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        () => service.cambiarEstado(reporte.id, { estado: EstadoIncidente.CERRADO }, ACTOR_USER_ID),
      );

      // assert: BD real
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.estado).toBe('CERRADO');
      expect(row!.cerrado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.ESTATUS_CAMBIADO, reporte.id);
      const cierre = audits.find(
        (a) => (a.new_value as Record<string, unknown>)?.estado === 'Cerrado',
      );
      expect(cierre?.result).toBe('SUCCESS');
      expect(cierre!.previous_value).toEqual({ estado: 'En curso' });
    });

    it('CERRADO es terminal: rechaza reabrir y audita TRANSICION_NO_VALIDA', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);
      await service.cambiarEstado(reporte.id, { estado: EstadoIncidente.CERRADO }, ACTOR_USER_ID);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        async () => {
          await expect(
            service.cambiarEstado(reporte.id, { estado: EstadoIncidente.EN_CURSO }, ACTOR_USER_ID),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await findAudits(AuditAction.ESTATUS_CAMBIADO, reporte.id);
      const fail = audits.find((a) => a.result === 'FAIL');
      expect(fail?.error_code).toBe('TRANSICION_NO_VALIDA');

      // la BD quedó intacta (cerrado, sin "reabrir")
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.estado).toBe('CERRADO');
    });

    it('rechaza reasignar un incidente Cerrado (REPORTE_CERRADO, FAIL auditado)', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);
      await service.cambiarEstado(reporte.id, { estado: EstadoIncidente.CERRADO }, ACTOR_USER_ID);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        async () => {
          await expect(
            service.asignar(reporte.id, { asignadoNombre: 'Tarde' }, ACTOR_USER_ID),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await findAudits(AuditAction.REPORTE_ASIGNADO, reporte.id);
      const fail = audits.find((a) => a.result === 'FAIL');
      expect(fail?.error_code).toBe('REPORTE_CERRADO');

      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.asignado_a_id).toBeNull();
      expect(row!.asignado_nombre).toBeNull();
    });
  });

  describe('ACTIVIDADES — bitácora del incidente (BD real)', () => {
    it('publica actividad + audit SUCCESS, y el detalle la retorna', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      const actividad = await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'POST' },
        () => service.comentar(reporte.id, { texto: 'Se revisó la bomba, falta refacción' }, ACTOR_USER_ID),
      );
      expect(actividad.texto).toBe('Se revisó la bomba, falta refacción');

      const row = await prisma.reportes_actividades.findUnique({
        where: { id: actividad.id },
      });
      expect(row!.reporte_id).toBe(reporte.id);
      expect(row!.autor_nombre).toBeTruthy();

      const audits = await findAudits(AuditAction.REPORTE_COMENTADO, reporte.id);
      expect(audits[0].result).toBe('SUCCESS');
      expect((audits[0].new_value as { actividadId?: string })?.actividadId).toBe(actividad.id);

      // el detalle del incidente incluye la bitácora
      const detalle = await service.findOne(reporte.id);
      expect(detalle.actividades.map((a) => a.id)).toContain(actividad.id);
    });

    it('rechaza comentar un incidente Cerrado (INCIDENTE_CERRADO, FAIL auditado)', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);
      await service.cambiarEstado(reporte.id, { estado: EstadoIncidente.CERRADO }, ACTOR_USER_ID);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'POST' },
        async () => {
          await expect(
            service.comentar(reporte.id, { texto: 'comentario tardío' }, ACTOR_USER_ID),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await findAudits(AuditAction.REPORTE_COMENTADO, reporte.id);
      const fail = audits.find((a) => a.result === 'FAIL');
      expect(fail?.error_code).toBe('INCIDENTE_CERRADO');
      expect(await prisma.reportes_actividades.count({ where: { reporte_id: reporte.id } })).toBe(0);
    });
  });

  describe('ADJUNTOS — imágenes del incidente (BD real)', () => {
    it('adjunta imagen PNG + audit SUCCESS, y el detalle la retorna', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      const adjunto = await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'POST' },
        () =>
          service.adjuntar(
            reporte.id,
            { nombre: 'evidencia.png', mime: 'image/png', tamano: 67, datos: PNG_1X1_BASE64 },
            ACTOR_USER_ID,
          ),
      );
      expect(adjunto.mime).toBe('image/png');

      const row = await prisma.reportes_adjuntos.findUnique({ where: { id: adjunto.id } });
      expect(row!.reporte_id).toBe(reporte.id);
      expect(row!.datos).toBe(PNG_1X1_BASE64);

      const audits = await findAudits(AuditAction.REPORTE_ADJUNTO, reporte.id);
      expect(audits[0].result).toBe('SUCCESS');

      const detalle = await service.findOne(reporte.id);
      expect(detalle.adjuntos.map((a) => a.id)).toContain(adjunto.id);
    });

    it('rechaza mime no permitido (MIME_NO_PERMITIDO, FAIL auditado)', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'POST' },
        async () => {
          await expect(
            service.adjuntar(
              reporte.id,
              { nombre: 'doc.pdf', mime: 'application/pdf', tamano: 100, datos: PNG_FALSO_BASE64 },
              ACTOR_USER_ID,
            ),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await findAudits(AuditAction.REPORTE_ADJUNTO, reporte.id);
      const fail = audits.find((a) => a.result === 'FAIL');
      expect(fail?.error_code).toBe('MIME_NO_PERMITIDO');
    });

    it('corta en 4 adjuntos (LIMITE_ADJUNTOS, FAIL auditado)', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      for (let i = 0; i < 4; i++) {
        await service.adjuntar(
          reporte.id,
          {
            nombre: `img${i}.png`,
            mime: 'image/png',
            tamano: 67,
            datos: PNG_1X1_BASE64,
          },
          ACTOR_USER_ID,
        );
      }

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'POST' },
        async () => {
          await expect(
            service.adjuntar(
              reporte.id,
              { nombre: 'img5.png', mime: 'image/png', tamano: 67, datos: PNG_1X1_BASE64 },
              ACTOR_USER_ID,
            ),
          ).rejects.toThrow(BadRequestException);
        },
      );

      expect(await prisma.reportes_adjuntos.count({ where: { reporte_id: reporte.id } })).toBe(4);
      const audits = await findAudits(AuditAction.REPORTE_ADJUNTO, reporte.id);
      const fail = audits.find((a) => a.result === 'FAIL');
      expect(fail?.error_code).toBe('LIMITE_ADJUNTOS');
    });
  });

  describe('UNICIDAD — codigo único de reporte (BD real)', () => {
    it('rechaza INSERT duplicado de codigo (índice único, sin carrera de duplicados)', async () => {
      // arrange: insertar fila base con codigo único de prueba
      const codigoDuplicado = `TESTDUPE-${TEST_ID}`;
      const baseId = randomUUID();
      await prisma.reportes_campo.create({
        data: {
          id: baseId,
          tipo: TipoReporteCampo.PIPERO,
          usuario: 'base-unicidad',
          fecha: new Date(),
          hora: new Date('1970-01-01T10:00:00'),
          descripcion: 'base unicidad',
          obra_texto: 'Obra test',
          codigo: codigoDuplicado,
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      });
      createdIds.push(baseId);
      await expect(
        prisma.reportes_campo.create({
          data: {
            id: randomUUID(),
            tipo: TipoReporteCampo.PIPERO,
            usuario: 'duplicado',
            fecha: new Date(),
            hora: new Date('1970-01-01T10:00:00'),
            descripcion: 'intento duplicado',
            obra_texto: 'Obra test',
            codigo: codigoDuplicado,
            creado_en: new Date(),
            actualizado_en: new Date(),
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      // y solo existe UNA fila con ese codigo (la carrera no creó dobles)
      const filas = await prisma.reportes_campo.findMany({
        where: { codigo: codigoDuplicado },
        select: { id: true },
      });
      expect(filas).toHaveLength(1);
    });
  });

  describe('REGISTRO_AUDITORIA — inmutabilidad real (trigger)', () => {
    it('rechaza un DELETE físico contra registro_auditoria (trigger trg_audit_immutable_delete)', async () => {
      // arrange: usar cualquier registro existente de audits de reportes
      const audit = await prisma.registro_auditoria.findFirst({
        where: { entity_type: 'reportes_campo' },
        select: { event_id: true },
      });
      expect(audit).not.toBeNull();

      // act / assert: el DELETE crudo debe fallar con el mensaje del trigger
      await expect(
        prisma.$executeRawUnsafe(`DELETE FROM registro_auditoria WHERE event_id = '${audit!.event_id}'`),
      ).rejects.toThrow(/registro_auditoria/i);
      // y el registro sigue ahí
      const sigueAhi = await prisma.registro_auditoria.findFirst({
        where: { event_id: audit!.event_id },
        select: { event_id: true },
      });
      expect(sigueAhi).not.toBeNull();
    });
  });

  describe('REPORTE_CREADO', () => {
    it('debe crear incidente NUEVO y auditar', async () => {
      const dto = createDto({ prioridad: Prioridad.ALTA });
      const reporte = await service.create(dto, ACTOR_USER_ID);
      createdIds.push(reporte.id);

      expect(reporte.estado).toBe('Nuevo');
      expect(reporte.prioridad).toBe('Alta');

      const audits = await findAudits(AuditAction.REPORTE_CREADO, reporte.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('misma área — torre destino resuelta (BD real)', () => {
    it('create con mismaArea guarda la torre del que reporta (web = oficina → ADMINISTRATIVO)', async () => {
      const { categoria: _c, ...dtoSinCategoria } = createDto();
      const reporte = await service.create({ ...dtoSinCategoria, mismaArea: true }, ACTOR_USER_ID);
      createdIds.push(reporte.id);

      // BD real: la categoria resuelta persiste y el detalle la muestra
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.categoria).toBe('ADMINISTRATIVO');

      const detalle = await service.findOne(reporte.id);
      expect(detalle.reporte.categoria).toBe('Administrativo');
      expect(detalle.reporte.subcategoria).toBeNull();
    });
  });

  describe('edición — bloqueada solo si está CERRADO', () => {
    it('edita mientras está Nuevo/En curso', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      const updated = await service.update(
        reporte.id,
        { descripcion: 'Corrección de errata' },
        ACTOR_USER_ID,
      );
      expect(updated.descripcion).toBe('Corrección de errata');
    });

    it('RECHAZA editar después de cerrar Y audita CERRADO_NO_EDITABLE', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      await service.cambiarEstado(reporte.id, { estado: EstadoIncidente.CERRADO }, ACTOR_USER_ID);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        async () => {
          await expect(
            service.update(reporte.id, { descripcion: 'Intento tardío' }, ACTOR_USER_ID),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.REPORTE_ACTUALIZADO,
          result: 'FAIL',
          error_code: 'CERRADO_NO_EDITABLE',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('stats', () => {
    it('debe contar por estado excluyendo eliminados', async () => {
      const marca = `${TEST_ID}-${randomUUID().slice(0, 4)}`;
      const r1 = await service.create(createDto({ usuario: marca }), ACTOR_USER_ID);
      createdIds.push(r1.id);
      const r2 = await service.create(
        createDto({
          usuario: marca,
          prioridad: Prioridad.CRITICA,
          tipo: TipoReporteCampo.INCIDENTE,
        }),
        ACTOR_USER_ID,
      );
      createdIds.push(r2.id);
      const r3 = await service.create(createDto({ usuario: marca }), ACTOR_USER_ID);
      createdIds.push(r3.id);

      // r1 pasa a En curso; r2 crítico sigue activo; r3 se elimina (excluido)
      await service.cambiarEstado(r1.id, { estado: EstadoIncidente.EN_CURSO }, ACTOR_USER_ID);
      await service.remove(r3.id, ACTOR_USER_ID);

      const stats = await service.findStats();

      expect(stats.nuevos).toBeGreaterThanOrEqual(0);
      expect(stats.enCurso).toBeGreaterThanOrEqual(1); // r1
      expect(stats.cerrados).toBeGreaterThanOrEqual(0);
      expect(stats.criticosActivos).toBeGreaterThanOrEqual(1); // r2

      // El eliminado (r3) ya no aparece en el listado: quedan r1 y r2
      const lista = await service.findAll({ search: marca });
      expect(lista.items).toHaveLength(2);
      expect(lista.items.some((r) => r.id === r3.id)).toBe(false);
    });
  });

  describe('REPORTE_ELIMINADO', () => {
    it('debe soft-delete y auditar', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      const result = await service.remove(reporte.id, ACTOR_USER_ID);
      expect(result.message).toContain('eliminado');

      const deleted = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(deleted?.eliminado_en).not.toBeNull();

      const audits = await findAudits(AuditAction.REPORTE_ELIMINADO, reporte.id);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });
});
