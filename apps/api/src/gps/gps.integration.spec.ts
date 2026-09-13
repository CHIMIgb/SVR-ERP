/**
 * Integration tests del módulo de GPS — BD real, sin mocks.
 *
 * Cubre el ciclo completo: crear geocerca → simular movimiento → detectar
 * cruces → historial → eliminar, verificando `registro_auditoria` en cada
 * paso (incluyendo los FAIL con su error_code).
 *
 * Run with: npm run test:integration -- --testPathPattern="gps"
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditContextService } from '../audit/audit-context.service';
import { GpsService } from './gps.service';

const TEST_ID = randomUUID().slice(0, 8);
const ACTOR_USER_ID = 'c0000000-0000-0000-0000-000000000001'; // admin seed user

describe('GPS Audit (Real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: GpsService;

  const geocercasCreadas: string[] = [];
  let maquinaId: string | null = null;

  const findAudits = (action: AuditAction, entityId: string) =>
    prisma.registro_auditoria.findMany({
      where: { action, entity_id: entityId },
      orderBy: { timestamp: 'desc' },
    });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, AuditContextService, AuditService, GpsService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    service = module.get(GpsService);

    const maquina = await prisma.maquinas.findFirst({
      where: { eliminado_en: null, activo: true },
      select: { id: true },
    });
    maquinaId = maquina?.id ?? null;
  });

  afterAll(async () => {
    if (!prisma) return;

    if (geocercasCreadas.length > 0) {
      // Los cruces primero (FK), luego las geocercas de prueba.
      await prisma.geocerca_maquinas.deleteMany({ where: { geocerca_id: { in: geocercasCreadas } } });
      await prisma.geocercas.deleteMany({ where: { id: { in: geocercasCreadas } } });
    }
    // registro_auditoria es INMUTABLE — se dejan los registros.
    await app?.close();
  });

  describe('GEOCERCA_CREADA', () => {
    it('crea una geocerca y audita SUCCESS con el valor nuevo', async () => {
      const geocerca = await service.createGeocerca(
        {
          nombre: `Obra Integración ${TEST_ID}`,
          tipo: 'OBRA',
          color: '#3b82f6',
          centroLat: 19.4326,
          centroLng: -99.1332,
          radioMetros: 400,
        },
        ACTOR_USER_ID,
      );
      geocercasCreadas.push(geocerca.id);

      expect(geocerca.nombre).toBe(`Obra Integración ${TEST_ID}`);
      expect(geocerca.radioMetros).toBe(400);

      const audits = await findAudits(AuditAction.GEOCERCA_CREADA, geocerca.id);
      expect(audits[0]?.result).toBe(AuditResult.SUCCESS);
      expect(audits[0]?.new_value).toMatchObject({ nombre: `Obra Integración ${TEST_ID}` });
    });

    it('rechaza un tipo fuera del CHECK de la tabla (lo bloquea la BD, no el DTO)', async () => {
      await expect(
        service.createGeocerca(
          {
            nombre: `Tipo Inválido ${TEST_ID}`,
            // El DTO ya lo restringe; aquí se fuerza para comprobar que la BD
            // también lo rechaza si algo lo saltara.
            tipo: 'TALLER' as never,
            centroLat: 19.43,
            centroLng: -99.13,
            radioMetros: 100,
          },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow();
    });

    it('rechaza nombre duplicado y audita FAIL con GEOCERCA_DUPLICADA', async () => {
      await expect(
        service.createGeocerca(
          {
            nombre: `Obra Integración ${TEST_ID}`,
            tipo: 'OBRA',
            centroLat: 19.5,
            centroLng: -99.2,
            radioMetros: 200,
          },
          ACTOR_USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      const fails = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.GEOCERCA_CREADA, result: AuditResult.FAIL, error_code: 'GEOCERCA_DUPLICADA' },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });
      expect(fails[0]?.severity).toBe('WARNING');
    });
  });

  describe('GEOCERCA_ACTUALIZADA', () => {
    it('actualiza el radio y audita previous/new value', async () => {
      const id = geocercasCreadas[0];
      const actualizada = await service.updateGeocerca(id, { radioMetros: 950 }, ACTOR_USER_ID);
      expect(actualizada.radioMetros).toBe(950);

      const audits = await findAudits(AuditAction.GEOCERCA_ACTUALIZADA, id);
      expect(audits[0]?.result).toBe(AuditResult.SUCCESS);
      expect(audits[0]?.previous_value).toMatchObject({ radioMetros: 400 });
      expect(audits[0]?.new_value).toMatchObject({ radioMetros: 950 });
    });

    it('falla con NotFound en un id inexistente y audita FAIL', async () => {
      const idFantasma = randomUUID();
      await expect(service.updateGeocerca(idFantasma, { radioMetros: 100 }, ACTOR_USER_ID)).rejects.toThrow(
        NotFoundException,
      );

      const audits = await findAudits(AuditAction.GEOCERCA_ACTUALIZADA, idFantasma);
      expect(audits[0]?.result).toBe(AuditResult.FAIL);
      expect(audits[0]?.error_code).toBe('GEOCERCA_NO_ENCONTRADA');
    });
  });

  describe('Simulación y cruces de geocerca', () => {
    it('genera un ping por máquina activa y lo deja consultable en vivo', async () => {
      const res = await service.simularMovimiento(ACTOR_USER_ID);
      expect(res.maquinasActualizadas).toBeGreaterThan(0);

      const enVivo = await service.findMaquinasEnVivo();
      expect(enVivo.length).toBe(res.maquinasActualizadas);
      // Recién simulado, ninguna debe salir "sin señal".
      expect(enVivo.every((m) => m.status !== 'offline')).toBe(true);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.GPS_POSICIONES_SIMULADAS, result: AuditResult.SUCCESS },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });
      expect(audits[0]?.new_value).toMatchObject({ maquinas: res.maquinasActualizadas });
    });

    it('detecta la entrada cuando una geocerca cubre la posición actual y la audita', async () => {
      if (!maquinaId) return; // sin maquinaria activa no aplica

      const enVivo = await service.findMaquinasEnVivo();
      const objetivo = enVivo.find((m) => m.maquinaId === maquinaId) ?? enVivo[0];

      // Geocerca centrada exactamente donde está la máquina ahora.
      const geocerca = await service.createGeocerca(
        {
          nombre: `Cerca Envolvente ${TEST_ID}`,
          tipo: 'PATIO',
          centroLat: Number(objetivo.lat.toFixed(6)),
          centroLng: Number(objetivo.lng.toFixed(6)),
          radioMetros: 5000,
        },
        ACTOR_USER_ID,
      );
      geocercasCreadas.push(geocerca.id);

      const res = await service.simularMovimiento(ACTOR_USER_ID);
      expect(res.entradas.length).toBeGreaterThan(0);

      const cruce = await prisma.geocerca_maquinas.findFirst({
        where: { geocerca_id: geocerca.id, dentro: true },
      });
      expect(cruce).not.toBeNull();
      expect(cruce?.ultima_entrada).toBeInstanceOf(Date);

      const audits = await prisma.registro_auditoria.findMany({
        where: { action: AuditAction.GEOCERCA_ENTRADA_DETECTADA, result: AuditResult.SUCCESS },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });
      expect(audits[0]).toBeDefined();
    });

    it('el historial del día trae puntos y el evento de entrada', async () => {
      if (!maquinaId) return;

      const enVivo = await service.findMaquinasEnVivo();
      const objetivo = enVivo.find((m) => m.maquinaId === maquinaId) ?? enVivo[0];

      const historial = await service.findHistorialMaquina(objetivo.id, { limit: 50 });
      expect(historial.puntos.length).toBeGreaterThan(0);
      expect(historial.eventos.some((e) => e.text.includes('Entró a'))).toBe(true);
    });

    it('respeta el límite de puntos del historial', async () => {
      if (!maquinaId) return;
      const enVivo = await service.findMaquinasEnVivo();
      const historial = await service.findHistorialMaquina(enVivo[0].id, { limit: 2 });
      expect(historial.puntos.length).toBeLessThanOrEqual(2);
    });

    it('falla con NotFound si la máquina del historial no existe', async () => {
      await expect(service.findHistorialMaquina('M-INEXISTENTE', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('GEOCERCA_ELIMINADA', () => {
    it('hace soft-delete, borra los cruces y audita WARNING', async () => {
      const geocerca = await service.createGeocerca(
        {
          nombre: `Temporal ${TEST_ID}`,
          tipo: 'RUTA',
          centroLat: 19.44,
          centroLng: -99.14,
          radioMetros: 150,
        },
        ACTOR_USER_ID,
      );
      geocercasCreadas.push(geocerca.id);

      await service.removeGeocerca(geocerca.id, ACTOR_USER_ID);

      const enBd = await prisma.geocercas.findUnique({ where: { id: geocerca.id } });
      expect(enBd?.eliminado_en).toBeInstanceOf(Date);
      expect(enBd?.activa).toBe(false);

      const cruces = await prisma.geocerca_maquinas.count({ where: { geocerca_id: geocerca.id } });
      expect(cruces).toBe(0);

      const audits = await findAudits(AuditAction.GEOCERCA_ELIMINADA, geocerca.id);
      expect(audits[0]?.result).toBe(AuditResult.SUCCESS);
      expect(audits[0]?.severity).toBe('WARNING');

      // Ya eliminada, deja de aparecer en el listado.
      await expect(service.findOneGeocerca(geocerca.id)).rejects.toThrow(NotFoundException);
    });
  });
});
