/**
 * Integration tests for NominaService — real DB, no mocks.
 *
 * Verifica el flujo completo: periodo semanal auto-resuelto, nomina auto-creada
 * por trabajador activo, sincronización real con Asistencia (vía AsistenciaService,
 * no un mock) y el audit trail de ajustes/pagos.
 *
 * Run with: npm run test:integration -- --testPathPattern="nomina"
 * Requires: PostgreSQL running con la DB configurada en apps/api/.env.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { AsistenciaService } from '../asistencia/asistencia.service';
import { NominaService } from './nomina.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('Nomina Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: NominaService;
  let asistenciaService: AsistenciaService;
  let categoriaId: string;
  let obraId: string;

  const createdTrabajadorIds: string[] = [];
  const createdPeriodoIds: string[] = [];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, AsistenciaService, NominaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(NominaService);
    asistenciaService = module.get(AsistenciaService);

    const categoria = await prisma.categorias_puesto.create({
      data: { id: randomUUID(), nombre: `TestCategoriaNomina-${TEST_ID}`, actualizado_en: new Date() },
    });
    categoriaId = categoria.id;

    const obra = await prisma.obras.findFirst({ where: { eliminado_en: null } });
    if (!obra) throw new Error('Se requiere al menos una obra existente para correr este test');
    obraId = obra.id;
  });

  afterAll(async () => {
    if (!prisma) return;

    if (createdPeriodoIds.length > 0) {
      const nominas = await prisma.nominas.findMany({ where: { periodo_id: { in: createdPeriodoIds } }, select: { id: true } });
      const nominaIds = nominas.map((n) => n.id);
      await prisma.percepciones_nomina.deleteMany({ where: { nomina_id: { in: nominaIds } } });
      await prisma.deducciones_nomina.deleteMany({ where: { nomina_id: { in: nominaIds } } });
      await prisma.nominas.deleteMany({ where: { periodo_id: { in: createdPeriodoIds } } });
      await prisma.periodos_nomina.deleteMany({ where: { id: { in: createdPeriodoIds } } });
    }
    if (createdTrabajadorIds.length > 0) {
      await prisma.registros_asistencia.deleteMany({ where: { trabajador_id: { in: createdTrabajadorIds } } });
      await prisma.trabajadores.deleteMany({ where: { id: { in: createdTrabajadorIds } } });
    }
    await prisma.categorias_puesto.deleteMany({ where: { id: categoriaId } });

    await prisma.$disconnect();
    await app.close();
  });

  const crearTrabajador = async (nombre: string, tarifaHoraExtra = 100) => {
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
        tarifa_hora_extra: tarifaHoraExtra,
        entrada: new Date(Date.UTC(1970, 0, 1, 7, 0, 0)),
        // Igual que trabajadores.service.ts: todo trabajador real tiene fecha_contratacion
        // (se usa para no contar como falta los días anteriores a su ingreso).
        fecha_contratacion: new Date(),
        actualizado_en: new Date(),
      },
    });
    createdTrabajadorIds.push(t.id);
    return t;
  };

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({ where: { action, entity_id: entityId }, orderBy: { timestamp: 'desc' } });

  describe('findActual', () => {
    it('debe resolver el periodo de la semana actual y crear una nomina para el trabajador activo', async () => {
      const trabajador = await crearTrabajador(`Nomina Test ${TEST_ID}`);
      const { periodo, items } = await service.findActual({}, ACTOR_USER_ID);
      createdPeriodoIds.push(periodo.id);

      const fila = items.find((i) => i.trabajadorId === trabajador.id);
      expect(fila).toBeDefined();
      expect(fila?.estado).toBe('Pendiente');
      expect(fila?.totalNeto).toBe(6000); // 2500 + 3500, sin percepciones/deducciones aún
    });

    it('debe ser idempotente: llamarlo dos veces no duplica la nomina del trabajador', async () => {
      const trabajador = await crearTrabajador(`Nomina Idempotente ${TEST_ID}`);
      const primera = await service.findActual({}, ACTOR_USER_ID);
      createdPeriodoIds.push(primera.periodo.id);
      const segunda = await service.findActual({}, ACTOR_USER_ID);

      const filasDelTrabajador = segunda.items.filter((i) => i.trabajadorId === trabajador.id);
      expect(filasDelTrabajador).toHaveLength(1);
    });
  });

  describe('sincronizarAsistencia', () => {
    it('debe traer horas extra y faltas reales desde AsistenciaService y auditar NOMINA_PROCESADA', async () => {
      const trabajador = await crearTrabajador(`Nomina Sync Test ${TEST_ID}`, 120);
      const { periodo } = await service.findActual({}, ACTOR_USER_ID);
      createdPeriodoIds.push(periodo.id);

      const registro = await asistenciaService.marcarEntrada(
        {
          trabajadorId: trabajador.id,
          obraId,
          obraLat: 19.3421,
          obraLng: -99.1843,
          lat: 19.3421,
          lng: -99.1843,
          dispositivo: 'Integration Test',
        },
        ACTOR_USER_ID,
      );
      await asistenciaService.registrarHorasExtra(
        registro.id,
        { inicio: '17:00', fin: '20:00', horasCalculadas: 3, motivo: 'Prueba' },
        ACTOR_USER_ID,
      );

      const resultado = await service.sincronizarAsistencia(periodo.id, ACTOR_USER_ID);
      const fila = resultado.items.find((i) => i.trabajadorId === trabajador.id);

      expect(fila?.horasExtra).toBe(3);
      expect(fila?.diasTrabajados).toBe(1);
      expect(fila?.percepciones.some((p) => p.tipo === 'HORAS_EXTRA_AUTO' && p.monto === 360)).toBe(true);
      expect(fila?.totalNeto).toBe(6360);

      const audits = await findAudits(AuditAction.NOMINA_PROCESADA, periodo.id);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');

      await prisma.horas_extra_asistencia.deleteMany({ where: { registro_asistencia_id: registro.id } });
      await prisma.registros_asistencia.delete({ where: { id: registro.id } });
    });
  });

  describe('registrarAjuste', () => {
    it('debe aplicar un Bono, recalcular el total neto y auditar NOMINA_AJUSTE_APLICADO', async () => {
      const trabajador = await crearTrabajador(`Nomina Ajuste Test ${TEST_ID}`);
      const { periodo, items } = await service.findActual({}, ACTOR_USER_ID);
      createdPeriodoIds.push(periodo.id);
      const nominaId = items.find((i) => i.trabajadorId === trabajador.id)!.id;

      const actualizado = await service.registrarAjuste(nominaId, { tipo: 'Bono', monto: 800, concepto: 'Productividad' }, ACTOR_USER_ID);
      expect(actualizado.totalNeto).toBe(6800);

      const audits = await findAudits(AuditAction.NOMINA_AJUSTE_APLICADO, nominaId);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].result).toBe('SUCCESS');
    });
  });

  describe('actualizarEstado / pagarTodos', () => {
    it('debe marcar la nomina como Pagado y auditar NOMINA_PAGO_MARCADO', async () => {
      const trabajador = await crearTrabajador(`Nomina Pago Test ${TEST_ID}`);
      const { periodo, items } = await service.findActual({}, ACTOR_USER_ID);
      createdPeriodoIds.push(periodo.id);
      const nominaId = items.find((i) => i.trabajadorId === trabajador.id)!.id;

      const actualizado = await service.actualizarEstado(nominaId, { estado: 'Pagado' }, ACTOR_USER_ID);
      expect(actualizado.estado).toBe('Pagado');

      const audits = await findAudits(AuditAction.NOMINA_PAGO_MARCADO, nominaId);
      expect(audits.length).toBeGreaterThanOrEqual(1);
    });

    it('pagarTodos debe marcar todas las nominas del periodo como Pagado', async () => {
      await crearTrabajador(`Nomina PagarTodos Test ${TEST_ID}`);
      const { periodo } = await service.findActual({}, ACTOR_USER_ID);
      createdPeriodoIds.push(periodo.id);

      const resultado = await service.pagarTodos(periodo.id, ACTOR_USER_ID);
      expect(resultado.actualizados).toBeGreaterThanOrEqual(1);
      expect(resultado.items.every((i) => i.estado === 'Pagado')).toBe(true);
    });
  });
});
