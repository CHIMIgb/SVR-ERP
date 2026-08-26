/**
 * Integration tests for AsistenciaService — real DB, no mocks.
 *
 * Verifica el flujo completo de marcaje GPS (entrada → salida), horas extra
 * y el audit trail correspondiente, contra Postgres real.
 *
 * Run with: npm run test:integration -- --testPathPattern="asistencia"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { AsistenciaService } from './asistencia.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Asistencia Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: AsistenciaService;
  let obraId: string;
  let obraLat: number;
  let obraLng: number;

  const createdTrabajadorIds: string[] = [];
  let categoriaId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, AsistenciaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(AsistenciaService);

    const obra = await prisma.obras.findFirst({ where: { eliminado_en: null } });
    if (!obra) throw new Error('Se requiere al menos una obra existente para correr este test');
    obraId = obra.id;
    obraLat = 19.3421;
    obraLng = -99.1843;

    const categoria = await prisma.categorias_puesto.create({
      data: { id: randomUUID(), nombre: `TestCategoriaAsistencia-${TEST_ID}`, actualizado_en: new Date() },
    });
    categoriaId = categoria.id;
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdTrabajadorIds.length > 0) {
      await prisma.horas_extra_asistencia.deleteMany({
        where: { registros_asistencia: { trabajador_id: { in: createdTrabajadorIds } } },
      });
      await prisma.registros_asistencia.deleteMany({ where: { trabajador_id: { in: createdTrabajadorIds } } });
      await prisma.trabajadores.deleteMany({ where: { id: { in: createdTrabajadorIds } } });
    }
    await prisma.categorias_puesto.deleteMany({ where: { id: categoriaId } });

    await prisma.$disconnect();
    await app.close();
  });

  const crearTrabajador = async (nombre: string) => {
    const t = await prisma.trabajadores.create({
      data: {
        id: randomUUID(),
        nombre,
        puesto: 'Operador de prueba',
        categoria_puesto_id: categoriaId,
        telefono: '55 0000 0000',
        avatar: 'TP',
        sueldo_fiscal: 2500,
        sueldo_efectivo: 3500,
        metodo_pago: 'MIXTO',
        entrada: new Date(Date.UTC(1970, 0, 1, 7, 0, 0)),
        actualizado_en: new Date(),
      },
    });
    createdTrabajadorIds.push(t.id);
    return t;
  };

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({ where: { action, entity_id: entityId }, orderBy: { timestamp: 'desc' } });

  describe('ASISTENCIA_ENTRADA_REGISTRADA', () => {
    it('debe registrar la entrada, calcular distancia real y auditar', async () => {
      const trabajador = await crearTrabajador(`Entrada Test ${TEST_ID}`);

      const registro = await service.marcarEntrada(
        {
          trabajadorId: trabajador.id,
          obraId,
          obraLat,
          obraLng,
          lat: obraLat + 0.0002,
          lng: obraLng,
          dispositivo: 'Integration Test Device',
        },
        ACTOR_USER_ID,
      );

      expect(registro.enSitio).toBe(true);
      expect(registro.distanciaMetros).toBeGreaterThan(0);
      expect(registro.distanciaMetros).toBeLessThan(2000);

      const audits = await findAudits(AuditAction.ASISTENCIA_ENTRADA_REGISTRADA, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
      expect(audits[0].actor_user_id).toBe(ACTOR_USER_ID);
    });

    it('debe rechazar una segunda entrada el mismo día', async () => {
      const trabajador = await crearTrabajador(`Entrada Duplicada Test ${TEST_ID}`);
      const dto = {
        trabajadorId: trabajador.id,
        obraId,
        obraLat,
        obraLng,
        lat: obraLat,
        lng: obraLng,
        dispositivo: 'Integration Test Device',
      };
      await service.marcarEntrada(dto, ACTOR_USER_ID);
      await expect(service.marcarEntrada(dto, ACTOR_USER_ID)).rejects.toThrow();
    });
  });

  describe('ASISTENCIA_SALIDA_REGISTRADA', () => {
    it('debe registrar la salida y calcular horas trabajadas', async () => {
      const trabajador = await crearTrabajador(`Salida Test ${TEST_ID}`);
      await service.marcarEntrada(
        { trabajadorId: trabajador.id, obraId, obraLat, obraLng, lat: obraLat, lng: obraLng, dispositivo: 'Test' },
        ACTOR_USER_ID,
      );

      const registro = await service.marcarSalida(
        { trabajadorId: trabajador.id, lat: obraLat, lng: obraLng, dispositivo: 'Test', horasTrabajadasOrdinarias: 8 },
        ACTOR_USER_ID,
      );

      expect(registro.horaSalida).toBeDefined();
      expect(registro.horasTrabajadasOrdinarias).toBe(8);

      const audits = await findAudits(AuditAction.ASISTENCIA_SALIDA_REGISTRADA, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });

  describe('Horas extra: registrar → aprobar', () => {
    it('debe registrar horas extra y aprobarlas, dejando ambos eventos auditados', async () => {
      const trabajador = await crearTrabajador(`Horas Extra Test ${TEST_ID}`);
      const registro = await service.marcarEntrada(
        { trabajadorId: trabajador.id, obraId, obraLat, obraLng, lat: obraLat, lng: obraLng, dispositivo: 'Test' },
        ACTOR_USER_ID,
      );

      const conHorasExtra = await service.registrarHorasExtra(
        registro.id,
        { inicio: '17:00', fin: '20:00', horasCalculadas: 3, motivo: 'Colado continuo' },
        ACTOR_USER_ID,
      );
      expect(conHorasExtra.horasExtra?.estado).toBe('Pendiente');
      expect(conHorasExtra.horasExtra?.montoTotal).toBeGreaterThan(0);

      const horasExtraDb = await prisma.horas_extra_asistencia.findUniqueOrThrow({
        where: { registro_asistencia_id: registro.id },
      });

      const aprobado = await service.aprobarHorasExtra(horasExtraDb.id, ACTOR_USER_ID);
      expect(aprobado.horasExtra?.estado).toBe('Aprobado');

      const auditsRegistro = await findAudits(AuditAction.ASISTENCIA_HORAS_EXTRA_REGISTRADAS, horasExtraDb.id);
      expect(auditsRegistro.length).toBeGreaterThanOrEqual(1);
      const auditsAprobado = await findAudits(AuditAction.ASISTENCIA_HORAS_EXTRA_APROBADAS, horasExtraDb.id);
      expect(auditsAprobado.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ASISTENCIA_FALTA_REGISTRADA', () => {
    it('debe registrar la falta y auditar con severidad WARNING', async () => {
      const trabajador = await crearTrabajador(`Falta Test ${TEST_ID}`);
      const registro = await service.registrarFalta({ trabajadorId: trabajador.id }, ACTOR_USER_ID);
      expect(registro.estado).toBe('Falta');

      const audits = await findAudits(AuditAction.ASISTENCIA_FALTA_REGISTRADA, registro.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].severity).toBe('WARNING');
    });
  });
});
