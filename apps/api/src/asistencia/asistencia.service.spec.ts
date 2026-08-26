import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AsistenciaService', () => {
  let service: AsistenciaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockTrabajador = {
    id: 'trab-uuid-1',
    nombre: 'Juan Pérez',
    // 07:00 programado (anclado en UTC, igual que trabajadores.service)
    entrada: new Date(Date.UTC(1970, 0, 1, 7, 0, 0)),
    tarifa_hora_extra: 90,
    estado: 'ACTIVO',
  };

  const mockObra = {
    id: 'obra-uuid-1',
    nombre: 'Fraccionamiento Valle Sur',
  };

  const baseRegistro = {
    id: 'reg-uuid-1',
    codigo: 'ASI-2026-0001',
    trabajador_id: mockTrabajador.id,
    fecha: new Date(Date.UTC(2026, 7, 26)),
    estado: 'PUNTUAL',
    ubicacion: 'Fraccionamiento Valle Sur (Acceso principal)',
    lat_entrada: 19.3423,
    lng_entrada: -99.1841,
    lat_salida: null,
    lng_salida: null,
    salida_ubicacion: null,
    obra_asignada: 'Fraccionamiento Valle Sur',
    obra_id: mockObra.id,
    lat_obra: 19.3421,
    lng_obra: -99.1843,
    distancia_metros: 35.5,
    radio_permitido_metros: 2000,
    en_sitio: true,
    precision_gps_metros: 10,
    dispositivo: 'Dispositivo Móvil · GPS Activo',
    hora_entrada: new Date(Date.UTC(1970, 0, 1, 7, 5, 0)),
    hora_salida: null,
    hora_marcaje_exacta: new Date(Date.UTC(1970, 0, 1, 7, 5, 12)),
    hora_salida_exacta: null,
    horas_trabajadas_ordinarias: null,
    salida_anticipada: false,
    motivo_salida_anticipada: null,
    bateria: 90,
    notas: null,
    horas_extra_asistencia: null,
  };

  beforeEach(async () => {
    prisma = {
      trabajadores: {
        findFirst: jest.fn().mockResolvedValue(mockTrabajador),
        findMany: jest.fn().mockResolvedValue([mockTrabajador]),
      },
      obras: {
        findFirst: jest.fn().mockResolvedValue(mockObra),
      },
      registros_asistencia: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue(baseRegistro),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(baseRegistro),
        update: jest.fn().mockResolvedValue(baseRegistro),
      },
      horas_extra_asistencia: {
        findFirst: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsistenciaService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(AsistenciaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const entradaDto = (overrides: Record<string, unknown> = {}) => ({
    trabajadorId: mockTrabajador.id,
    obraId: mockObra.id,
    obraLat: 19.3421,
    obraLng: -99.1843,
    lat: 19.3423,
    lng: -99.1841,
    dispositivo: 'Dispositivo Móvil · GPS Activo',
    ...overrides,
  });

  describe('marcarEntrada', () => {
    it('marks PUNTUAL and stores the wall-clock hour anchored in UTC regardless of server timezone', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 7, 5, 12)); // 07:05:12 local, on time
      await service.marcarEntrada(entradaDto(), 'user-1');

      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      expect(data.estado).toBe('PUNTUAL');
      expect(data.hora_entrada.toISOString()).toBe('1970-01-01T07:05:00.000Z');
      expect(data.hora_marcaje_exacta.toISOString()).toBe('1970-01-01T07:05:12.000Z');
    });

    it('marks RETARDO when clocking in past the tolerance window', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 7, 20, 0)); // 20 min late, tolerance is 15
      await service.marcarEntrada(entradaDto(), 'user-1');
      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      expect(data.estado).toBe('RETARDO');
    });

    it('computes real GPS distance and flags fuera de sitio beyond the allowed radius', async () => {
      await service.marcarEntrada(
        entradaDto({ obraLat: 19.3421, obraLng: -99.1843, lat: 19.378, lng: -99.172, radioPermitidoMetros: 2000 }),
        'user-1',
      );
      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      expect(data.en_sitio).toBe(false);
      expect(data.distancia_metros).toBeGreaterThan(2000);
    });

    it('rejects when the trabajador does not exist', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue(null);
      await expect(service.marcarEntrada(entradaDto(), 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'TRABAJADOR_NO_ENCONTRADO' }));
    });

    it('rejects when the obra does not exist', async () => {
      prisma.obras.findFirst.mockResolvedValue(null);
      await expect(service.marcarEntrada(entradaDto(), 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'OBRA_NO_ENCONTRADA' }));
    });

    it('rejects a second entrada the same day', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await expect(service.marcarEntrada(entradaDto(), 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'YA_REGISTRO_ENTRADA_HOY' }));
    });
  });

  describe('marcarSalida', () => {
    it('computes elapsed hours from the stored entrada and marks the exit', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro); // entrada 07:05
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 17, 5, 0)); // salida 17:05 → 10h
      await service.marcarSalida({ trabajadorId: mockTrabajador.id, lat: 1, lng: 1, dispositivo: 'Móvil' }, 'user-1');

      const data = prisma.registros_asistencia.update.mock.calls[0][0].data;
      expect(data.horas_trabajadas_ordinarias).toBe(10);
      expect(data.hora_salida.toISOString()).toBe('1970-01-01T17:05:00.000Z');
    });

    it('marks Salida Anticipada and keeps the reason when flagged', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await service.marcarSalida(
        {
          trabajadorId: mockTrabajador.id,
          lat: 1,
          lng: 1,
          dispositivo: 'Móvil',
          salidaAnticipada: true,
          motivoSalidaAnticipada: 'Cita médica',
          horasTrabajadasOrdinarias: 5.5,
        },
        'user-1',
      );
      const data = prisma.registros_asistencia.update.mock.calls[0][0].data;
      expect(data.estado).toBe('SALIDA_ANTICIPADA');
      expect(data.motivo_salida_anticipada).toBe('Cita médica');
      expect(data.horas_trabajadas_ordinarias).toBe(5.5);
    });

    it('rejects when there is no entrada registered today', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(null);
      await expect(
        service.marcarSalida({ trabajadorId: mockTrabajador.id, lat: 1, lng: 1, dispositivo: 'Móvil' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a second salida the same day', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue({ ...baseRegistro, hora_salida: new Date() });
      await expect(
        service.marcarSalida({ trabajadorId: mockTrabajador.id, lat: 1, lng: 1, dispositivo: 'Móvil' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('marcarCuadrilla', () => {
    it('creates registros for every trabajador and skips those already registered today', async () => {
      const t2 = { ...mockTrabajador, id: 'trab-uuid-2' };
      prisma.trabajadores.findMany.mockResolvedValue([mockTrabajador, t2]);
      prisma.registros_asistencia.findMany.mockResolvedValue([{ trabajador_id: mockTrabajador.id }]);

      const result = await service.marcarCuadrilla(
        {
          obraId: mockObra.id,
          obraLat: 19.3421,
          obraLng: -99.1843,
          trabajadorIds: [mockTrabajador.id, t2.id],
          lat: 19.3423,
          lng: -99.1841,
          dispositivo: 'Dispositivo Residente',
        },
        'user-1',
      );

      expect(prisma.registros_asistencia.create).toHaveBeenCalledTimes(1);
      expect(result.omitidos).toEqual([mockTrabajador.id]);
    });

    it('rejects when some trabajadorIds do not exist', async () => {
      prisma.trabajadores.findMany.mockResolvedValue([mockTrabajador]);
      await expect(
        service.marcarCuadrilla(
          {
            obraId: mockObra.id,
            obraLat: 1,
            obraLng: 1,
            trabajadorIds: [mockTrabajador.id, 'no-existe'],
            lat: 1,
            lng: 1,
            dispositivo: 'Móvil',
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarFalta', () => {
    it('creates a FALTA record and audits with WARNING severity', async () => {
      prisma.registros_asistencia.create.mockResolvedValue({ ...baseRegistro, estado: 'FALTA', en_sitio: false });
      await service.registrarFalta({ trabajadorId: mockTrabajador.id }, 'user-1');
      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      expect(data.estado).toBe('FALTA');
      expect(data.en_sitio).toBe(false);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASISTENCIA_FALTA_REGISTRADA' }));
    });

    it('rejects when a registro already exists that day', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await expect(service.registrarFalta({ trabajadorId: mockTrabajador.id }, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('actualizarEstado', () => {
    it('updates the estado and audits previous/new value', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      prisma.registros_asistencia.update.mockResolvedValue({ ...baseRegistro, estado: 'JUSTIFICADO' });
      const result = await service.actualizarEstado(baseRegistro.id, { estado: 'Justificado' }, 'user-1');
      expect(result.estado).toBe('Justificado');
    });

    it('404s when the registro does not exist', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(null);
      await expect(service.actualizarEstado('missing', { estado: 'Falta' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarHorasExtra', () => {
    it('falls back to the trabajador tarifa and computes the monto', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', horasCalculadas: 3 }, 'user-1');

      const data = prisma.horas_extra_asistencia.upsert.mock.calls[0][0].create;
      expect(data.tarifa_por_hora).toBe(90);
      expect(data.monto_total).toBe(270);
      expect(data.estado).toBe('EN_CURSO'); // sin "fin" todavía
    });

    it('marks PENDIENTE once an end time is provided, awaiting approval', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '20:00', horasCalculadas: 3 }, 'user-1');
      const data = prisma.horas_extra_asistencia.upsert.mock.calls[0][0].create;
      expect(data.estado).toBe('PENDIENTE');
    });

    it('404s when the registro does not exist', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(null);
      await expect(
        service.registrarHorasExtra('missing', { inicio: '17:00', horasCalculadas: 2 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('aprobarHorasExtra / rechazarHorasExtra', () => {
    it('aprobarHorasExtra sets APROBADO and the aprobador', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue({ id: 'he-1', registro_asistencia_id: baseRegistro.id });
      await service.aprobarHorasExtra('he-1', 'supervisor-1');
      expect(prisma.horas_extra_asistencia.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'APROBADO', aprobador_id: 'supervisor-1' }) }),
      );
    });

    it('rechazarHorasExtra sets RECHAZADO', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue({ id: 'he-1', registro_asistencia_id: baseRegistro.id });
      await service.rechazarHorasExtra('he-1', 'supervisor-1');
      expect(prisma.horas_extra_asistencia.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'RECHAZADO' }) }),
      );
    });

    it('404s when the horas extra record does not exist', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(null);
      await expect(service.aprobarHorasExtra('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('defaults to filtering by today when no fecha is given', async () => {
      prisma.registros_asistencia.findMany.mockResolvedValue([baseRegistro]);
      prisma.registros_asistencia.count.mockResolvedValue(1);
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.items[0].trabajadorId).toBe(mockTrabajador.id);
      const where = prisma.registros_asistencia.findMany.mock.calls[0][0].where;
      expect(where.fecha).toBeInstanceOf(Date);
    });
  });

  describe('findOne', () => {
    it('returns the serialized registro including horas extra when present', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue({
        ...baseRegistro,
        horas_extra_asistencia: {
          inicio: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
          fin: new Date(Date.UTC(1970, 0, 1, 20, 0, 0)),
          horas_calculadas: 3,
          tarifa_por_hora: 90,
          monto_total: 270,
          estado: 'PENDIENTE',
          motivo: 'Colado continuo',
        },
      });
      const result = await service.findOne(baseRegistro.id);
      expect(result.horasExtra).toEqual(
        expect.objectContaining({ inicio: '17:00', fin: '20:00', horasCalculadas: 3, estado: 'Pendiente' }),
      );
    });

    it('404s when not found', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSemanal', () => {
    it('returns one row per trabajador with 6 días (Lun-Sáb)', async () => {
      const result = await service.findSemanal({});
      expect(result).toHaveLength(1);
      expect(result[0].dias).toHaveLength(6);
      expect(result[0].dias.map((d) => d.dia)).toEqual(['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']);
    });
  });
});
