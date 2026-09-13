import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult } from '@prisma/client';
import { GpsService } from './gps.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('GpsService', () => {
  let service: GpsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;

  const geocercaDb = {
    id: 'g0000000-0000-0000-0000-000000000001',
    nombre: 'Obra Norte',
    tipo: 'OBRA',
    color: '#3b82f6',
    centro_lat: 19.4326,
    centro_lng: -99.1332,
    radio_metros: 300,
    activa: true,
    creado_en: new Date('2026-09-13T10:00:00.000Z'),
    geocerca_maquinas: [{ dentro: true }, { dentro: false }],
  };

  const maquinaDb = {
    id: 'm0000000-0000-0000-0000-000000000001',
    codigo: 'M001',
    nombre: 'Excavadora CAT 320',
    estado: 'ENCENDIDA',
    combustible: 65,
    horometro: 1200,
    lat: 19.4326,
    lng: -99.1332,
    alerta_consumo_anormal: false,
    tipos_maquina: { nombre: 'Excavadora' },
    trabajadores: { nombre: 'Pedro Gómez' },
  };

  beforeEach(async () => {
    prisma = {
      geocercas: {
        findMany: jest.fn().mockResolvedValue([geocercaDb]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue(geocercaDb),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(geocercaDb),
        update: jest.fn().mockResolvedValue(geocercaDb),
      },
      geocerca_maquinas: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      maquinas: {
        findMany: jest.fn().mockResolvedValue([maquinaDb]),
        findFirst: jest.fn().mockResolvedValue(maquinaDb),
        update: jest.fn().mockResolvedValue(maquinaDb),
      },
      rastreo_gps: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') return arg(prisma);
        return Promise.all(arg);
      }),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GpsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(GpsService);
  });

  describe('findAllGeocercas', () => {
    it('devuelve items paginados y cuenta las máquinas dentro', async () => {
      const res = await service.findAllGeocercas({ page: 1, limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(res.items[0].maquinasDentro).toBe(1); // sólo la que tiene dentro: true
      expect(res.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('traduce el filtro activa de texto a booleano', async () => {
      await service.findAllGeocercas({ activa: 'false' });
      expect(prisma.geocercas.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ activa: false }) }),
      );
    });

    it('topa el límite a 100 aunque pidan más', async () => {
      const res = await service.findAllGeocercas({ limit: 5000 });
      expect(res.pagination.limit).toBe(100);
    });
  });

  describe('findOneGeocerca', () => {
    it('lanza NotFound si no existe', async () => {
      prisma.geocercas.findFirst.mockResolvedValue(null);
      await expect(service.findOneGeocerca('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGeocerca', () => {
    const dto = {
      nombre: 'Obra Norte',
      tipo: 'OBRA' as const,
      centroLat: 19.4326,
      centroLng: -99.1332,
      radioMetros: 300,
    };

    it('crea y audita SUCCESS', async () => {
      const res = await service.createGeocerca(dto, 'user-1');
      expect(prisma.geocercas.create).toHaveBeenCalled();
      expect(res.nombre).toBe('Obra Norte');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.GEOCERCA_CREADA, result: AuditResult.SUCCESS }),
      );
    });

    it('aplica azul por defecto cuando no mandan color', async () => {
      await service.createGeocerca(dto, 'user-1');
      expect(prisma.geocercas.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ color: '#3b82f6' }) }),
      );
    });

    it('rechaza nombre duplicado y audita FAIL', async () => {
      prisma.geocercas.findFirst.mockResolvedValue({ id: 'otra' });
      await expect(service.createGeocerca(dto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.GEOCERCA_CREADA,
          result: AuditResult.FAIL,
          errorCode: 'GEOCERCA_DUPLICADA',
        }),
      );
      expect(prisma.geocercas.create).not.toHaveBeenCalled();
    });
  });

  describe('updateGeocerca', () => {
    it('actualiza y audita con valor previo y nuevo', async () => {
      prisma.geocercas.findFirst.mockResolvedValue(geocercaDb);
      await service.updateGeocerca(geocercaDb.id, { radioMetros: 900 }, 'user-1');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.GEOCERCA_ACTUALIZADA,
          result: AuditResult.SUCCESS,
          previousValue: expect.any(Object),
          newValue: expect.any(Object),
        }),
      );
    });

    it('falla con NotFound y audita FAIL si no existe', async () => {
      prisma.geocercas.findFirst.mockResolvedValue(null);
      await expect(service.updateGeocerca('no-existe', { radioMetros: 900 }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'GEOCERCA_NO_ENCONTRADA' }),
      );
    });

    it('rechaza renombrar a un nombre ya usado por otra geocerca', async () => {
      prisma.geocercas.findFirst
        .mockResolvedValueOnce(geocercaDb) // la que se edita
        .mockResolvedValueOnce({ id: 'otra' }); // el duplicado
      await expect(service.updateGeocerca(geocercaDb.id, { nombre: 'Obra Sur' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.geocercas.update).not.toHaveBeenCalled();
    });
  });

  describe('removeGeocerca', () => {
    it('hace soft-delete, limpia los cruces y audita', async () => {
      prisma.geocercas.findFirst.mockResolvedValue(geocercaDb);
      const res = await service.removeGeocerca(geocercaDb.id, 'user-1');
      expect(prisma.geocerca_maquinas.deleteMany).toHaveBeenCalledWith({ where: { geocerca_id: geocercaDb.id } });
      expect(prisma.geocercas.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ activa: false, eliminado_en: expect.any(Date) }) }),
      );
      expect(res.message).toContain('eliminada');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.GEOCERCA_ELIMINADA, result: AuditResult.SUCCESS }),
      );
    });

    it('falla y audita FAIL si no existe', async () => {
      prisma.geocercas.findFirst.mockResolvedValue(null);
      await expect(service.removeGeocerca('no-existe', 'user-1')).rejects.toThrow(NotFoundException);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ result: AuditResult.FAIL }));
    });
  });

  describe('findMaquinasEnVivo', () => {
    it('marca sin señal cuando el último ping pasó el umbral', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          maquina_id: maquinaDb.id,
          fecha_hora: new Date(Date.now() - 60 * 60000), // 60 min
          lat: 19.4,
          lng: -99.1,
          velocidad_kmh: 30,
          heading: 90,
          temperatura_motor: 80,
          horometro: 1200,
          ignition: true,
        },
      ]);
      const [m] = await service.findMaquinasEnVivo();
      expect(m.status).toBe('offline');
      expect(m.speed).toBe(0); // sin señal no se reporta velocidad vieja como actual
    });

    it('marca en movimiento con ping fresco y velocidad sobre el umbral', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          maquina_id: maquinaDb.id,
          fecha_hora: new Date(),
          lat: 19.4,
          lng: -99.1,
          velocidad_kmh: 25,
          heading: 90,
          temperatura_motor: 85,
          horometro: 1200,
          ignition: true,
        },
      ]);
      const [m] = await service.findMaquinasEnVivo();
      expect(m.status).toBe('moving');
      expect(m.speed).toBe(25);
    });

    it('marca detenida con ping fresco y velocidad bajo el umbral', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          maquina_id: maquinaDb.id,
          fecha_hora: new Date(),
          lat: 19.4,
          lng: -99.1,
          velocidad_kmh: 1,
          heading: 0,
          temperatura_motor: 30,
          horometro: 1200,
          ignition: false,
        },
      ]);
      const [m] = await service.findMaquinasEnVivo();
      expect(m.status).toBe('idle');
    });

    it('marca alerta cuando la máquina está en mantenimiento', async () => {
      prisma.maquinas.findMany.mockResolvedValue([{ ...maquinaDb, estado: 'MANTENIMIENTO' }]);
      prisma.$queryRaw.mockResolvedValue([
        {
          maquina_id: maquinaDb.id,
          fecha_hora: new Date(),
          lat: 19.4,
          lng: -99.1,
          velocidad_kmh: 0,
          heading: 0,
          temperatura_motor: 25,
          horometro: 1200,
          ignition: false,
        },
      ]);
      const [m] = await service.findMaquinasEnVivo();
      expect(m.status).toBe('alert');
    });

    it('cae a la posición de la máquina cuando no hay ningún ping', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      const [m] = await service.findMaquinasEnVivo();
      expect(m.status).toBe('offline');
      expect(m.lat).toBe(Number(maquinaDb.lat));
      expect(m.lastUpdate).toBe('Sin registro');
    });

    it('devuelve arreglo vacío si no hay máquinas activas', async () => {
      prisma.maquinas.findMany.mockResolvedValue([]);
      expect(await service.findMaquinasEnVivo()).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('adjunta las geocercas en las que está dentro', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { maquina_id: maquinaDb.id, fecha_hora: new Date(), lat: 19.4, lng: -99.1, velocidad_kmh: 0, heading: 0, temperatura_motor: 25, horometro: 1, ignition: false },
      ]);
      prisma.geocerca_maquinas.findMany.mockResolvedValue([
        { maquina_id: maquinaDb.id, geocercas: { nombre: 'Obra Norte', color: '#3b82f6' } },
      ]);
      const [m] = await service.findMaquinasEnVivo();
      expect(m.geocercas).toEqual([{ nombre: 'Obra Norte', color: '#3b82f6' }]);
    });
  });

  describe('findHistorialMaquina', () => {
    it('lanza NotFound si la máquina no existe', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(service.findHistorialMaquina('M999', {})).rejects.toThrow(NotFoundException);
    });

    it('devuelve puntos y eventos de entrada/salida del día', async () => {
      const hoy = new Date();
      prisma.rastreo_gps.findMany.mockResolvedValue([
        { lat: 19.4, lng: -99.1, fecha_hora: hoy, velocidad_kmh: 12 },
      ]);
      prisma.geocerca_maquinas.findMany.mockResolvedValue([
        { ultima_entrada: hoy, ultima_salida: null, geocercas: { nombre: 'Obra Norte' } },
      ]);
      const res = await service.findHistorialMaquina('M001', {});
      expect(res.puntos).toHaveLength(1);
      expect(res.eventos[0].text).toContain('Entró a Obra Norte');
    });
  });

  describe('simularMovimiento', () => {
    it('falla y audita FAIL si no hay máquinas activas', async () => {
      prisma.maquinas.findMany.mockResolvedValue([]);
      await expect(service.simularMovimiento('user-1')).rejects.toThrow(BadRequestException);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'SIN_MAQUINAS' }),
      );
    });

    it('inserta un ping por máquina y audita el resumen', async () => {
      const res = await service.simularMovimiento('user-1');
      expect(prisma.rastreo_gps.createMany).toHaveBeenCalled();
      expect(res.maquinasActualizadas).toBe(1);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.GPS_POSICIONES_SIMULADAS, result: AuditResult.SUCCESS }),
      );
    });

    it('no mueve una máquina en mantenimiento (velocidad 0)', async () => {
      prisma.maquinas.findMany.mockResolvedValue([{ ...maquinaDb, estado: 'MANTENIMIENTO' }]);
      await service.simularMovimiento('user-1');
      const filas = prisma.rastreo_gps.createMany.mock.calls[0][0].data;
      expect(filas[0].velocidad_kmh).toBe(0);
      expect(filas[0].ignition).toBe(false);
    });

    it('detecta entrada a geocerca y la audita cuando la máquina cae dentro del radio', async () => {
      // La geocerca queda centrada donde arranca la máquina, con radio enorme:
      // cualquier posición generada cae dentro.
      prisma.geocercas.findMany.mockResolvedValue([
        {
          id: 'g1',
          nombre: 'Obra Norte',
          centro_lat: Number(maquinaDb.lat),
          centro_lng: Number(maquinaDb.lng),
          radio_metros: 50000,
        },
      ]);
      const res = await service.simularMovimiento('user-1');
      expect(res.entradas).toHaveLength(1);
      expect(prisma.geocerca_maquinas.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.GEOCERCA_ENTRADA_DETECTADA }),
      );
    });

    it('detecta salida cuando la máquina estaba dentro y ahora queda fuera', async () => {
      prisma.geocercas.findMany.mockResolvedValue([
        { id: 'g1', nombre: 'Obra Norte', centro_lat: 0, centro_lng: 0, radio_metros: 10 },
      ]);
      prisma.geocerca_maquinas.findMany.mockResolvedValue([
        { id: 'gm1', geocerca_id: 'g1', maquina_id: maquinaDb.id, dentro: true },
      ]);
      const res = await service.simularMovimiento('user-1');
      expect(res.salidas).toHaveLength(1);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.GEOCERCA_SALIDA_DETECTADA }),
      );
    });

    it('no genera evento si el estado dentro/fuera no cambió', async () => {
      prisma.geocercas.findMany.mockResolvedValue([
        { id: 'g1', nombre: 'Obra Norte', centro_lat: 0, centro_lng: 0, radio_metros: 10 },
      ]);
      prisma.geocerca_maquinas.findMany.mockResolvedValue([
        { id: 'gm1', geocerca_id: 'g1', maquina_id: maquinaDb.id, dentro: false },
      ]);
      const res = await service.simularMovimiento('user-1');
      expect(res.entradas).toHaveLength(0);
      expect(res.salidas).toHaveLength(0);
      expect(prisma.geocerca_maquinas.update).not.toHaveBeenCalled();
    });
  });
});
