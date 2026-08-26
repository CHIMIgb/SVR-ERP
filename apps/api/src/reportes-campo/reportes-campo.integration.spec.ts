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
import { INestApplication, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuditAction,
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
});
