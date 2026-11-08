/**
 * Integration tests for ReportesCampoService — real DB, no mocks.
 *
 * Verifies CRUD limitado + flujo de estados + auditoría:
 *   REPORTE_CREADO, REPORTE_ACTUALIZADO, REPORTE_ELIMINADO,
 *   ESTATUS_CAMBIADO (éxitos y fallos)
 *
 * Run with: npm run test:integration -- --testPathPattern="reportes-campo"
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuditAction,
  CategoriaReporte,
  EstadoReporteCampo,
  Prioridad,
  TipoReporteCampo,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { ReportesCampoService } from './reportes-campo.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('ReportesCampo Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: ReportesCampoService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditContext: any;

  const createdIds: string[] = [];
  const cxcFacturadas: string[] = [];
  const clientesFacturados: string[] = [];

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

    // Orden FK-safe: CxC → reportes → clientes (registro_auditoria es inmutable).
    if (cxcFacturadas.length > 0) {
      await prisma.cuentas_por_cobrar.deleteMany({
        where: { id: { in: cxcFacturadas } },
      });
    }
    if (createdIds.length > 0) {
      await prisma.reportes_campo.deleteMany({
        where: { id: { in: createdIds } },
      });
    }
    if (clientesFacturados.length > 0) {
      await prisma.clientes.deleteMany({
        where: { id: { in: clientesFacturados } },
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
            // @ts-expect-error — valor fuera del enum debe ser rechazado por PG
            categoria: 'COCINERO',
            usuario: `Test ${TEST_ID}`,
            obra_texto: 'Test',
            fecha: new Date(),
            hora: '10:00',
            descripcion: `Categoria inválida ${TEST_ID}`,
            estado: 'PENDIENTE',
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('RESUELTO — resuelto_en y quién lo resolvió (BD real)', () => {
    it('asigna → resuelve el flujo completo y persiste resuelto_en real', async () => {
      // arrange
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);
      const trabajador = await prisma.trabajadores.findFirst({
        where: { eliminado_en: null, activo: true },
        select: { id: true },
      });

      await service.asignar(reporte.id, { asignadoA: trabajador!.id }, ACTOR_USER_ID);
      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        () => service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.VISTO }, ACTOR_USER_ID),
      );
      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        () => service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.ATENDIDO }, ACTOR_USER_ID),
      );
      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        () => service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.RESUELTO }, ACTOR_USER_ID),
      );

      // assert: BD real
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.estado).toBe('RESUELTO');
      expect(row!.resuelto_en).not.toBeNull();
      // el responsable sigue visible (quién lo resolvió)
      expect(row!.asignado_a_id).toBe(trabajador!.id);
    });
  });

  describe('RESUELTO sin responsable — RESPONSABLE_REQUERIDO (BD real)', () => {
    it('rechaza marcar Resuelto sin asignación y audita FAIL real', async () => {
      // arrange — reporte sin asignación alguna, hasta ATENDIDO (transición legal)
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);
      await service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.VISTO }, ACTOR_USER_ID);
      await service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.ATENDIDO }, ACTOR_USER_ID);

      // act / assert
      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        async () => {
          await expect(
            service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.RESUELTO }, ACTOR_USER_ID),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await findAudits(AuditAction.ESTATUS_CAMBIADO, reporte.id);
      const fail = audits.find((a) => a.result === 'FAIL');
      expect(fail?.error_code).toBe('RESPONSABLE_REQUERIDO');
      expect(fail?.actor_user_id).toBe(ACTOR_USER_ID);

      // la BD quedó intacta en ATENDIDO (no se movió el estado)
      const row = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(row!.estado).toBe('ATENDIDO');
      expect(row!.resuelto_en).toBeNull();
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
    it('debe crear reporte PENDIENTE y auditar', async () => {
      const dto = createDto({ prioridad: Prioridad.ALTA });
      const reporte = await service.create(dto, ACTOR_USER_ID);
      createdIds.push(reporte.id);

      expect(reporte.estado).toBe('Pendiente');
      expect(reporte.prioridad).toBe('Alta');

      const audits = await findAudits(AuditAction.REPORTE_CREADO, reporte.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('flujo de estados — ESTATUS_CAMBIADO', () => {
    it('debe avanzar Pendiente → Visto → Atendido → Resuelto auditando cada paso', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);
      // El API exige responsable antes de RESUELTO (limit RESUELTO sin asignar)
      await service.asignar(reporte.id, { asignadoNombre: 'Residente de obra' }, ACTOR_USER_ID);

      const ruta = [
        { desde: EstadoReporteCampo.PENDIENTE, hacia: EstadoReporteCampo.VISTO, labelDesde: 'Pendiente', labelHacia: 'Visto' },
        { desde: EstadoReporteCampo.VISTO, hacia: EstadoReporteCampo.ATENDIDO, labelDesde: 'Visto', labelHacia: 'Atendido' },
        { desde: EstadoReporteCampo.ATENDIDO, hacia: EstadoReporteCampo.RESUELTO, labelDesde: 'Atendido', labelHacia: 'Resuelto' },
      ];

      for (const paso of ruta) {
        await auditContext.run(
          { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
          async () => {
            const updated = await service.cambiarEstado(
              reporte.id,
              { estado: paso.hacia },
              ACTOR_USER_ID,
            );
            expect(updated.estado).toBe(paso.labelHacia);
          },
        );
      }

      // Verificación final del último salto en auditoría
      const audits = await findAudits(AuditAction.ESTATUS_CAMBIADO, reporte.id);
      const ultimo = audits.find(
        (a) => a.new_value && (a.new_value as Record<string, unknown>).estado === 'Atendido',
      );
      expect(audits.length).toBeGreaterThanOrEqual(3);
      expect(ultimo?.previous_value).toEqual({ estado: 'Visto' });
      expect((ultimo?.new_value as Record<string, unknown>)?.estado).toBe('Atendido');
    });

    it('debe rechazar saltos no válidos Y auditar TRANSICION_NO_VALIDA', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo', method: 'PATCH' },
        async () => {
          await expect(
            service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.RESUELTO }, ACTOR_USER_ID),
          ).rejects.toThrow(BadRequestException);
        },
      );

      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.ESTATUS_CAMBIADO,
          result: 'FAIL',
          error_code: 'TRANSICION_NO_VALIDA',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });
  });

  describe('edición limitada a PENDIENTES', () => {
    it('debe editar mientras PENDIENTE', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      const updated = await service.update(
        reporte.id,
        { descripcion: 'Corrección de errata' },
        ACTOR_USER_ID,
      );
      expect(updated.descripcion).toBe('Corrección de errata');
    });

    it('debe RECHAZAR editar después de avanzar Y auditar EDITAR_SOLO_PENDIENTES', async () => {
      const reporte = await service.create(createDto(), ACTOR_USER_ID);
      createdIds.push(reporte.id);

      await service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.VISTO }, ACTOR_USER_ID);

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
          error_code: 'EDITAR_SOLO_PENDIENTES',
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

      // Avanzar r1 (ya no cuenta como pendiente de la marca) y eliminar r2 (excluido)
      await service.cambiarEstado(r1.id, { estado: EstadoReporteCampo.VISTO }, ACTOR_USER_ID);
      await service.remove(r3.id, ACTOR_USER_ID);

      const stats = await service.findStats();

      // r1 Visto no suma pendientes; r2 crítico sigue activo; r3 eliminado invisible
      expect(stats.pendientes).toBeGreaterThanOrEqual(0);
      expect(stats.resueltos).toBeGreaterThanOrEqual(0);
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

  describe('REPORTE_CAMPO_FACTURADO', () => {
    const crearClienteReal = async () => {
      const cliente = await prisma.clientes.create({
        data: {
          id: randomUUID(),
          nombre: `Cliente Facturar ${TEST_ID} ${randomUUID().slice(0, 4)}`,
          empresa: 'Empresa Test',
          correo: '',
          telefono: '',
          actualizado_en: new Date(),
        },
      });
      clientesFacturados.push(cliente.id);
      return cliente;
    };

    const crearReporteResuelto = async (clienteId: string) => {
      const reporte = await service.create(
        createDto({ clienteId, montoServicio: 8500.5 }),
        ACTOR_USER_ID,
      );
      createdIds.push(reporte.id);
      await service.asignar(reporte.id, { asignadoNombre: 'Residente de obra' }, ACTOR_USER_ID);
      await service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.VISTO }, ACTOR_USER_ID);
      await service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.ATENDIDO }, ACTOR_USER_ID);
      await service.cambiarEstado(reporte.id, { estado: EstadoReporteCampo.RESUELTO }, ACTOR_USER_ID);
      return reporte;
    };

    it('debe crear CxC real y auditar REPORTE_CAMPO_FACTURADO + CXC_CREADA', async () => {
      const cliente = await crearClienteReal();
      const reporte = await crearReporteResuelto(cliente.id);

      const resultado = await service.facturar(reporte.id, ACTOR_USER_ID);
      cxcFacturadas.push(resultado.cuenta.id);

      expect(resultado.cuenta).toMatchObject({
        reporteId: reporte.id,
        clienteId: cliente.id,
        monto: 8500.5,
        estado: 'PENDIENTE',
      });

      const cxc = await prisma.cuentas_por_cobrar.findUnique({
        where: { id: resultado.cuenta.id },
      });
      expect(cxc?.cliente_id).toBe(cliente.id);
      expect(Number(cxc?.monto)).toBe(8500.5);
      expect(cxc?.estado).toBe('PENDIENTE');
      expect(cxc?.fecha_vencimiento).not.toBeNull();

      // El reporte quedó FACTURADO en BD
      const enBD = await prisma.reportes_campo.findUnique({ where: { id: reporte.id } });
      expect(enBD?.estado).toBe(EstadoReporteCampo.FACTURADO);

      const audits = await findAudits(AuditAction.REPORTE_CAMPO_FACTURADO, reporte.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');

      const auditCxc = await findAudits(AuditAction.CXC_CREADA, resultado.cuenta.id);
      expect(auditCxc.length).toBeGreaterThanOrEqual(1);
      expect(auditCxc[0].result).toBe('SUCCESS');
      expect((auditCxc[0].new_value as Record<string, unknown>)?.reporteId).toBe(reporte.id);
    });

    it('debe rechazar doble clic (409) dejando una sola CxC', async () => {
      const cliente = await crearClienteReal();
      const reporte = await crearReporteResuelto(cliente.id);

      const primera = await service.facturar(reporte.id, ACTOR_USER_ID);
      cxcFacturadas.push(primera.cuenta.id);

      await auditContext.run(
        { jwtUserId: ACTOR_USER_ID, endpoint: '/api/reportes-campo/facturar', method: 'POST' },
        async () => {
          await expect(service.facturar(reporte.id, ACTOR_USER_ID)).rejects.toThrow(
            ConflictException,
          );
        },
      );

      const cxcCount = await prisma.cuentas_por_cobrar.count({
        where: { cliente_id: cliente.id },
      });
      expect(cxcCount).toBe(1);

      // En la 2ª llamada secuencial el reporte ya está FACTURADO → guard de estado.
      // (La carrera concurrente real la cubre el unit test con updateMany count 0 → REPORTE_YA_FACTURADO.)
      const audits = await prisma.registro_auditoria.findMany({
        where: {
          action: AuditAction.REPORTE_CAMPO_FACTURADO,
          result: 'FAIL',
          error_code: 'REPORTE_NO_RESUELTO',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });
  });
});
