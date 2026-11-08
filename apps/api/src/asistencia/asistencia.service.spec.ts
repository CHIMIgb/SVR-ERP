import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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

  // Ubicación y radio guardados de la obra: la geocerca se valida contra esto, no contra el cliente.
  const mockObra = {
    id: 'obra-uuid-1',
    nombre: 'Fraccionamiento Valle Sur',
    lat: 19.3421,
    lng: -99.1843,
    radio_permitido_metros: 2000,
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
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockObra, ...data })),
      },
      nominas: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      registros_asistencia: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn().mockResolvedValue(baseRegistro),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(baseRegistro),
        update: jest.fn().mockResolvedValue(baseRegistro),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      horas_extra_asistencia: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'he-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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
    lat: 19.3423,
    lng: -99.1841,
    dispositivo: 'Dispositivo Móvil · GPS Activo',
    ...overrides,
  });

  describe('solo se registra asistencia a trabajadores activos', () => {
    it('marcarEntrada: 409 (audited) for a trabajador dado de baja, and nothing is written', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, estado: 'INACTIVO' });
      await expect(service.marcarEntrada(entradaDto(), 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'TRABAJADOR_DADO_DE_BAJA' }));
    });

    it('marcarEntrada: 409 for a trabajador de vacaciones', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, estado: 'VACACIONES' });
      await expect(service.marcarEntrada(entradaDto(), 'user-1')).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'TRABAJADOR_DE_VACACIONES' }));
    });

    it('marcarCuadrilla: 409 naming who is not active, and nobody is registered', async () => {
      prisma.trabajadores.findMany.mockResolvedValue([
        mockTrabajador,
        { ...mockTrabajador, id: 'trab-baja', nombre: 'Pedro Baja', estado: 'INACTIVO' },
      ]);
      await expect(
        service.marcarCuadrilla(
          { obraId: mockObra.id, trabajadorIds: [mockTrabajador.id, 'trab-baja'], lat: 19.3423, lng: -99.1841, dispositivo: 'Test' },
          'user-1',
        ),
      ).rejects.toThrow('Pedro Baja');
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'TRABAJADORES_NO_ACTIVOS' }));
    });

    it('registrarFalta: 409 for a trabajador dado de baja', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, estado: 'INACTIVO' });
      await expect(service.registrarFalta({ trabajadorId: mockTrabajador.id }, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
    });

    it('resolverOmisionSinMarcaje: 409 for a trabajador dado de baja', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, estado: 'INACTIVO' });
      await expect(
        service.resolverOmisionSinMarcaje({ trabajadorId: mockTrabajador.id, resolucion: 'Falta', motivo: 'No avisó' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
    });
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

    it('marks OMISION (not RETARDO) when clocking in past the tolerance window', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 7, 20, 0)); // 20 min late, tolerance is 15
      await service.marcarEntrada(entradaDto(), 'user-1');
      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      // Regla del cliente: queda en omisión hasta que la administradora la resuelva como falta o retardo.
      expect(data.estado).toBe('OMISION');
    });

    it('computes real GPS distance and flags fuera de sitio beyond the allowed radius', async () => {
      await service.marcarEntrada(entradaDto({ lat: 19.378, lng: -99.172 }), 'user-1');
      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      expect(data.en_sitio).toBe(false);
      expect(data.distancia_metros).toBeGreaterThan(2000);
    });

    it('validates the geofence with the obra stored location and radius, not with client data', async () => {
      // Radio guardado de 100 m: a ~120 m del centro queda fuera aunque el radio por defecto sea 2 km.
      prisma.obras.findFirst.mockResolvedValue({ ...mockObra, radio_permitido_metros: 100 });
      await service.marcarEntrada(entradaDto({ lat: 19.3432, lng: -99.1843 }), 'user-1');
      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      expect(data.lat_obra).toBe(19.3421);
      expect(data.lng_obra).toBe(-99.1843);
      expect(data.radio_permitido_metros).toBe(100);
      expect(data.en_sitio).toBe(false);
    });

    it('uses the default radius when the obra has a location but no radius', async () => {
      prisma.obras.findFirst.mockResolvedValue({ ...mockObra, radio_permitido_metros: null });
      await service.marcarEntrada(entradaDto(), 'user-1');
      const data = prisma.registros_asistencia.create.mock.calls[0][0].data;
      expect(data.radio_permitido_metros).toBe(2000);
      expect(data.en_sitio).toBe(true);
    });

    it('rejects when the obra has no stored location (OBRA_SIN_COORDENADAS) and creates nothing', async () => {
      prisma.obras.findFirst.mockResolvedValue({ ...mockObra, lat: null, lng: null });
      await expect(service.marcarEntrada(entradaDto(), 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'OBRA_SIN_COORDENADAS' }));
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
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

      const data = prisma.registros_asistencia.updateMany.mock.calls[0][0].data;
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
      const data = prisma.registros_asistencia.updateMany.mock.calls[0][0].data;
      expect(data.estado).toBe('SALIDA_ANTICIPADA');
      expect(data.motivo_salida_anticipada).toBe('Cita médica');
      expect(data.horas_trabajadas_ordinarias).toBe(5.5);
    });

    it('keeps an OMISION when leaving early (it used to become SALIDA_ANTICIPADA and the pending omisión vanished)', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue({ ...baseRegistro, estado: 'OMISION' });
      await service.marcarSalida(
        { trabajadorId: mockTrabajador.id, lat: 1, lng: 1, dispositivo: 'Móvil', salidaAnticipada: true, motivoSalidaAnticipada: 'Cita', horasTrabajadasOrdinarias: 4 },
        'user-1',
      );
      const data = prisma.registros_asistencia.updateMany.mock.calls[0][0].data;
      expect(data.estado).toBe('OMISION');
      expect(data.salida_anticipada).toBe(true);
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

    it('only writes the salida if there is none yet, so two simultaneous salidas do not overwrite each other', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      prisma.registros_asistencia.updateMany.mockResolvedValue({ count: 0 }); // la otra petición ganó
      await expect(
        service.marcarSalida({ trabajadorId: mockTrabajador.id, lat: 1, lng: 1, dispositivo: 'Móvil' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.registros_asistencia.updateMany.mock.calls[0][0].where).toEqual({ id: baseRegistro.id, hora_salida: null });
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'YA_REGISTRO_SALIDA_HOY' }));
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
            trabajadorIds: [mockTrabajador.id, 'no-existe'],
            lat: 1,
            lng: 1,
            dispositivo: 'Móvil',
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects the whole pase de lista when the obra has no stored location', async () => {
      prisma.obras.findFirst.mockResolvedValue({ ...mockObra, lat: null, lng: null });
      await expect(
        service.marcarCuadrilla(
          { obraId: mockObra.id, trabajadorIds: [mockTrabajador.id], lat: 19.3423, lng: -99.1841, dispositivo: 'Móvil' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'OBRA_SIN_COORDENADAS' }));
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
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

    it('409 once that week payroll was paid', async () => {
      prisma.nominas.findFirst.mockResolvedValue({ id: 'nom-1' });
      await expect(service.registrarFalta({ trabajadorId: mockTrabajador.id }, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ASISTENCIA_FALTA_REGISTRADA', errorCode: 'NOMINA_PAGADA' }),
      );
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

      const data = prisma.horas_extra_asistencia.create.mock.calls[0][0].data;
      expect(data.tarifa_por_hora).toBe(90);
      expect(data.monto_total).toBe(270);
      expect(data.estado).toBe('EN_CURSO'); // sin "fin" todavía
    });

    it('marks PENDIENTE once an end time is provided, awaiting approval', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '20:00', horasCalculadas: 3 }, 'user-1');
      const data = prisma.horas_extra_asistencia.create.mock.calls[0][0].data;
      expect(data.estado).toBe('PENDIENTE');
    });

    it('does not overwrite horas extra that were already approved (409, nothing written)', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      prisma.horas_extra_asistencia.findUnique.mockResolvedValue({ id: 'he-1', estado: 'APROBADO', monto_total: 270 });
      await expect(
        service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '21:00', horasCalculadas: 4 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.horas_extra_asistencia.updateMany).not.toHaveBeenCalled();
      expect(prisma.horas_extra_asistencia.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'HORAS_EXTRA_YA_APROBADAS' }));
    });

    it('updates pending horas extra only while they are not approved, and audits the previous monto', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      prisma.horas_extra_asistencia.findUnique.mockResolvedValue({ id: 'he-1', estado: 'PENDIENTE', monto_total: 180 });
      await service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '20:00', horasCalculadas: 3 }, 'user-1');
      expect(prisma.horas_extra_asistencia.updateMany.mock.calls[0][0].where).toEqual({ id: 'he-1', estado: { not: 'APROBADO' } });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ tarifaCapturada: false, estadoAnterior: 'PENDIENTE', montoAnterior: 180 }) }),
      );
    });

    it('rejects if someone approved them between the check and the write', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      prisma.horas_extra_asistencia.findUnique.mockResolvedValue({ id: 'he-1', estado: 'PENDIENTE', monto_total: 180 });
      prisma.horas_extra_asistencia.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '20:00', horasCalculadas: 3 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects horas extra on a week whose nómina is already paid', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      prisma.nominas.findFirst.mockResolvedValue({ id: 'nomina-pagada' });
      await expect(
        service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '20:00', horasCalculadas: 3 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.horas_extra_asistencia.create).not.toHaveBeenCalled();
    });

    it('marks a hand-typed tarifa in the audit', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '19:00', horasCalculadas: 2, tarifaPorHora: 150 }, 'user-1');
      expect(prisma.horas_extra_asistencia.create.mock.calls[0][0].data.tarifa_por_hora).toBe(150);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ tarifaCapturada: true }) }));
    });

    it('404s when the registro does not exist', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(null);
      await expect(
        service.registrarHorasExtra('missing', { inicio: '17:00', horasCalculadas: 2 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    // Lo que se paga sale de horasCalculadas: tienen que corresponder al horario capturado.
    it('400s (audited) when the hours do not match the schedule: 17:00–18:00 is 1 h, not 10 h', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await expect(
        service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '18:00', horasCalculadas: 10 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.horas_extra_asistencia.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'HORAS_NO_CORRESPONDEN' }));
    });

    it('accepts a schedule that crosses midnight (22:00–01:00 is 3 h) and rounding to 2 decimals (17:00–20:20 is 3.33 h)', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      await service.registrarHorasExtra(baseRegistro.id, { inicio: '22:00', fin: '01:00', horasCalculadas: 3 }, 'user-1');
      await service.registrarHorasExtra(baseRegistro.id, { inicio: '17:00', fin: '20:20', horasCalculadas: 3.33 }, 'user-1');
      expect(prisma.horas_extra_asistencia.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('aprobarHorasExtra / rechazarHorasExtra', () => {
    const pendientes = (overrides: Record<string, unknown> = {}) => ({
      id: 'he-1',
      registro_asistencia_id: baseRegistro.id,
      estado: 'PENDIENTE',
      registros_asistencia: { trabajador_id: mockTrabajador.id, fecha: baseRegistro.fecha },
      ...overrides,
    });

    it('aprobarHorasExtra sets APROBADO only while they are still PENDIENTE (conditional write)', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(pendientes());
      await service.aprobarHorasExtra('he-1', 'supervisor-1');
      expect(prisma.horas_extra_asistencia.updateMany).toHaveBeenCalledWith({
        where: { id: 'he-1', eliminado_en: null, estado: 'PENDIENTE' },
        data: expect.objectContaining({ estado: 'APROBADO', aprobador_id: 'supervisor-1' }),
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'SUCCESS', previousValue: { estado: 'PENDIENTE' } }),
      );
    });

    it('rechazarHorasExtra sets RECHAZADO', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(pendientes());
      await service.rechazarHorasExtra('he-1', 'supervisor-1');
      expect(prisma.horas_extra_asistencia.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'RECHAZADO' }) }),
      );
    });

    it('404s when the horas extra record does not exist', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(null);
      await expect(service.aprobarHorasExtra('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('409s (audited) when they were already approved or rejected: a resolution is not overwritten', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(pendientes({ estado: 'APROBADO' }));
      await expect(service.rechazarHorasExtra('he-1', 'supervisor-1')).rejects.toThrow(ConflictException);
      expect(prisma.horas_extra_asistencia.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'FAIL', errorCode: 'HORAS_EXTRA_YA_RESUELTAS' }),
      );
    });

    it('400s while they are still EN_CURSO (no end time yet: the hours are not final)', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(pendientes({ estado: 'EN_CURSO' }));
      await expect(service.aprobarHorasExtra('he-1', 'supervisor-1')).rejects.toThrow(BadRequestException);
      expect(prisma.horas_extra_asistencia.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'HORAS_EXTRA_EN_CURSO' }));
    });

    it('409s when that week payroll was already paid', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(pendientes());
      prisma.nominas.findFirst.mockResolvedValue({ id: 'nomina-pagada' });
      await expect(service.aprobarHorasExtra('he-1', 'supervisor-1')).rejects.toThrow(ConflictException);
      expect(prisma.horas_extra_asistencia.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'NOMINA_PAGADA' }));
    });

    it('409s when someone else resolved them at the same time (conditional write touched nothing)', async () => {
      prisma.horas_extra_asistencia.findFirst.mockResolvedValue(pendientes());
      prisma.horas_extra_asistencia.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.aprobarHorasExtra('he-1', 'supervisor-1')).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'FAIL', errorCode: 'HORAS_EXTRA_YA_RESUELTAS' }),
      );
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

    it('only approved, non-deleted overtime is payable, at its approved amount; pending is reported apart', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 29, 12, 0)); // sábado 29/08/2026: la semana ya pasó
      prisma.trabajadores.findMany.mockResolvedValue([{ ...mockTrabajador, fecha_contratacion: new Date(Date.UTC(2026, 0, 5)) }]);
      const dia = (d: number, horasExtra: Record<string, unknown> | null) => ({
        ...baseRegistro,
        id: `reg-${d}`,
        fecha: new Date(Date.UTC(2026, 7, d)),
        horas_extra_asistencia: horasExtra,
      });
      const he = (estado: string, horas: number, monto: number, eliminado = false) => ({
        horas_calculadas: horas,
        monto_total: monto,
        estado,
        eliminado_en: eliminado ? new Date() : null,
        motivo: null,
      });
      prisma.registros_asistencia.findMany.mockResolvedValue([
        dia(24, he('APROBADO', 2, 300)), // tarifa capturada de 150: se paga el monto aprobado, no 2 × 90
        dia(25, he('PENDIENTE', 3, 270)),
        dia(26, he('EN_CURSO', 1, 90)),
        dia(27, he('RECHAZADO', 4, 360)),
        dia(28, he('APROBADO', 5, 450, true)), // borradas
      ]);

      const [semana] = await service.findSemanal({ fecha: '2026-08-24' });

      expect(semana.totalHorasExtraAprobadas).toBe(2);
      expect(semana.montoHorasExtraAprobadas).toBe(300);
      expect(semana.totalHorasExtraSinAutorizar).toBe(4); // pendientes + en curso
      expect(semana.totalHorasExtra).toBe(6); // registradas que siguen vigentes (sin rechazadas ni borradas)
      expect(semana.dias.find((d) => d.fecha === '2026-08-27')?.horasExtra).toBeUndefined();
      expect(semana.dias.find((d) => d.fecha === '2026-08-28')?.horasExtra).toBeUndefined();
    });

    it('does not mark days before the trabajador hire date as Falta', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 17, 30)); // miércoles, después del plazo de las 17:00
      prisma.trabajadores.findMany.mockResolvedValue([
        { ...mockTrabajador, fecha_contratacion: new Date(Date.UTC(2026, 7, 26)) }, // contratado el mismo miércoles
      ]);
      const result = await service.findSemanal({});
      const [lun, mar, mie] = result[0].dias;
      expect(lun.estado).toBe('Descanso');
      expect(mar.estado).toBe('Descanso');
      expect(mie.estado).toBe('Falta'); // día de contratación en adelante sí cuenta
      expect(result[0].totalFaltas).toBe(1);
    });

    describe('omisión (plazo de las 17:00)', () => {
      // Miércoles 26/08/2026; el trabajador entra a las 07:00 (tolerancia de 15 min).
      const contratadoAntes = { ...mockTrabajador, fecha_contratacion: new Date(Date.UTC(2026, 0, 5)) };
      const hoyDe = (dias: { estado: string; fecha: string }[]) => dias.find((d) => d.fecha === '2026-08-26')!;

      beforeEach(() => prisma.trabajadores.findMany.mockResolvedValue([contratadoAntes]));

      it('today without check-in: Pendiente within the tolerance, Omisión after it, Falta from 17:00', async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 7, 10));
        expect(hoyDe((await service.findSemanal({}))[0].dias).estado).toBe('Pendiente');

        jest.setSystemTime(new Date(2026, 7, 26, 10, 0));
        const aMedioDia = (await service.findSemanal({}))[0];
        expect(hoyDe(aMedioDia.dias).estado).toBe('Omisión');
        expect(aMedioDia.totalOmisionesPendientes).toBe(1);

        jest.setSystemTime(new Date(2026, 7, 26, 17, 0));
        const alCierre = (await service.findSemanal({}))[0];
        expect(hoyDe(alCierre.dias).estado).toBe('Falta');
        expect(alCierre.totalOmisionesPendientes).toBe(0);
      });

      it('a late check-in (OMISION) is pending until 17:00 and then counts as falta, not as attendance', async () => {
        prisma.registros_asistencia.findMany.mockResolvedValue([{ ...baseRegistro, estado: 'OMISION' }]);

        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 12, 0));
        const pendiente = (await service.findSemanal({}))[0];
        expect(hoyDe(pendiente.dias)).toEqual(expect.objectContaining({ estado: 'Omisión', registroId: 'reg-uuid-1' }));
        expect(pendiente.totalOmisionesPendientes).toBe(1);
        expect(pendiente.totalDiasAsistidos).toBe(0);

        jest.setSystemTime(new Date(2026, 7, 26, 18, 0));
        const vencida = (await service.findSemanal({}))[0];
        expect(hoyDe(vencida.dias).estado).toBe('Falta');
        expect(vencida.totalOmisionesPendientes).toBe(0);
      });

      it('a day that counts as falta does not pay its hours, and expired omisiones are reported apart', async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 18, 0));
        prisma.registros_asistencia.findMany.mockResolvedValue([
          { ...baseRegistro, estado: 'OMISION', horas_trabajadas_ordinarias: 8, horas_extra_asistencia: { horas_calculadas: 2, estado: 'APROBADO' } },
        ]);
        const r = (await service.findSemanal({}))[0];
        expect(hoyDe(r.dias).estado).toBe('Falta');
        expect(r.totalHorasOrdinarias).toBe(0);
        expect(r.totalHorasExtra).toBe(0);
        // Lunes y martes sin checar + la omisión vencida de hoy.
        expect(r.totalOmisionesVencidas).toBe(3);
        expect(r.totalFaltas).toBe(3);
      });

      it('counts NO_PRESENTADO as falta (it used to count as an attended day)', async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 18, 0));
        prisma.registros_asistencia.findMany.mockResolvedValue([{ ...baseRegistro, estado: 'NO_PRESENTADO' }]);
        const r = (await service.findSemanal({}))[0];
        expect(hoyDe(r.dias).estado).toBe('Falta');
        expect(r.totalDiasAsistidos).toBe(0);
      });

      it('marks an OMISION record as vencida in the daily list only after the deadline', async () => {
        prisma.registros_asistencia.findFirst.mockResolvedValue({ ...baseRegistro, estado: 'OMISION' });
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 16, 59));
        expect((await service.findOne('reg-uuid-1')).omisionVencida).toBe(false);
        jest.setSystemTime(new Date(2026, 7, 26, 17, 0));
        expect((await service.findOne('reg-uuid-1')).omisionVencida).toBe(true);
      });
    });
  });

  describe('resolverOmision', () => {
    const omision = { ...baseRegistro, estado: 'OMISION' };
    const dto = { resolucion: 'Retardo' as const, motivo: '  Se le ponchó una llanta  ' };

    beforeEach(() => prisma.registros_asistencia.findFirst.mockResolvedValue(omision));

    it('resolves it as the administrator chose, with the reason, and audits it', async () => {
      await service.resolverOmision('reg-uuid-1', dto, 'user-1');
      expect(prisma.registros_asistencia.updateMany).toHaveBeenCalledWith({
        where: { id: 'reg-uuid-1', eliminado_en: null, estado: 'OMISION' },
        data: expect.objectContaining({
          estado: 'RETARDO',
          omision_motivo: 'Se le ponchó una llanta',
          omision_resuelta_por: 'user-1',
        }),
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ASISTENCIA_OMISION_RESUELTA', result: 'SUCCESS', actorUserId: 'user-1' }),
      );
    });

    it('can resolve it as falta', async () => {
      await service.resolverOmision('reg-uuid-1', { ...dto, resolucion: 'Falta' }, 'user-1');
      expect(prisma.registros_asistencia.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'FALTA' }) }),
      );
    });

    it('409 NO_ES_OMISION when the record never was an omisión', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue({ ...baseRegistro, estado: 'PUNTUAL', omision_resuelta_en: null });
      await expect(service.resolverOmision('reg-uuid-1', dto, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'NO_ES_OMISION' }));
    });

    describe('corrección de una omisión ya resuelta (regla de Oscar: el plazo es hasta las 17:00 de ese día)', () => {
      // Miércoles 26/08/2026 (el día de baseRegistro). Se resolvió como falta a las 08:10.
      const resueltaEn = new Date(2026, 7, 26, 8, 10);
      const resuelta = { ...baseRegistro, estado: 'FALTA', omision_resuelta_en: resueltaEn, omision_motivo: 'No avisó' };

      it('corrects it the same day before 17:00, conditional on the resolution it read, audited as a correction', async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 10, 0));
        prisma.registros_asistencia.findFirst.mockResolvedValue(resuelta);
        await service.resolverOmision('reg-uuid-1', { resolucion: 'Retardo', motivo: 'Llegó tarde: se ponchó una llanta' }, 'user-1');
        expect(prisma.registros_asistencia.updateMany).toHaveBeenCalledWith({
          where: { id: 'reg-uuid-1', eliminado_en: null, estado: 'FALTA', omision_resuelta_en: resueltaEn },
          data: expect.objectContaining({ estado: 'RETARDO', omision_motivo: 'Llegó tarde: se ponchó una llanta' }),
        });
        expect(mockAudit.log).toHaveBeenCalledWith(
          expect.objectContaining({ result: 'SUCCESS', metadata: expect.objectContaining({ correccion: true }) }),
        );
      });

      it('409 OMISION_YA_RESUELTA from 17:00 on: the resolution is final', async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 17, 0));
        prisma.registros_asistencia.findFirst.mockResolvedValue(resuelta);
        await expect(service.resolverOmision('reg-uuid-1', dto, 'user-1')).rejects.toThrow(ConflictException);
        expect(prisma.registros_asistencia.updateMany).not.toHaveBeenCalled();
        expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'OMISION_YA_RESUELTA' }));
      });

      it('409 OMISION_YA_RESUELTA on another day', async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 27, 9, 0));
        prisma.registros_asistencia.findFirst.mockResolvedValue(resuelta);
        await expect(service.resolverOmision('reg-uuid-1', dto, 'user-1')).rejects.toThrow(ConflictException);
        expect(prisma.registros_asistencia.updateMany).not.toHaveBeenCalled();
      });

      it('409 when someone else corrected it at the same time (conditional update matched nothing)', async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 10, 0));
        prisma.registros_asistencia.findFirst.mockResolvedValue(resuelta);
        prisma.registros_asistencia.updateMany.mockResolvedValue({ count: 0 });
        await expect(service.resolverOmision('reg-uuid-1', dto, 'user-1')).rejects.toThrow(ConflictException);
        expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'OMISION_YA_RESUELTA' }));
      });
    });

    it('409 when someone else resolved it at the same time (conditional update matched nothing)', async () => {
      prisma.registros_asistencia.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.resolverOmision('reg-uuid-1', dto, 'user-1')).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'OMISION_YA_RESUELTA' }));
    });

    it('409 once that week payroll was paid', async () => {
      prisma.nominas.findFirst.mockResolvedValue({ id: 'nom-1' });
      await expect(service.resolverOmision('reg-uuid-1', dto, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.nominas.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            trabajador_id: mockTrabajador.id,
            estado: 'PAGADA',
            periodos_nomina: { fecha_inicio: { lte: omision.fecha }, fecha_fin: { gte: omision.fecha } },
          }),
        }),
      );
      expect(prisma.registros_asistencia.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'NOMINA_PAGADA' }));
    });

    it('404 when the record does not exist', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(null);
      await expect(service.resolverOmision('missing', dto, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('actualizarEstado refuses an omisión already resolved with its reason', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue({ ...baseRegistro, estado: 'FALTA', omision_resuelta_en: new Date() });
      await expect(service.actualizarEstado('reg-uuid-1', { estado: 'Puntual' }, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'OMISION_YA_RESUELTA' }));
    });

    it('actualizarEstado refuses a day whose payroll was paid', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue(baseRegistro);
      prisma.nominas.findFirst.mockResolvedValue({ id: 'nom-1' });
      await expect(service.actualizarEstado('reg-uuid-1', { estado: 'Justificado' }, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.update).not.toHaveBeenCalled();
    });

    it('actualizarEstado refuses an omisión (it would skip the reason)', async () => {
      await expect(service.actualizarEstado('reg-uuid-1', { estado: 'Retardo' }, 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.registros_asistencia.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'OMISION_SIN_RESOLVER' }));
    });
  });

  describe('resolverOmisionSinMarcaje', () => {
    const dto = { trabajadorId: mockTrabajador.id, fecha: '2026-08-25', resolucion: 'Falta' as const, motivo: 'Enfermedad' };

    beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 7, 26, 10, 0)));

    it('creates the day already resolved, with the reason', async () => {
      await service.resolverOmisionSinMarcaje(dto, 'user-1');
      expect(prisma.registros_asistencia.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: 'FALTA',
            fecha: new Date(Date.UTC(2026, 7, 25)),
            omision_motivo: 'Enfermedad',
            omision_resuelta_por: 'user-1',
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASISTENCIA_OMISION_RESUELTA', result: 'SUCCESS' }));
    });

    it('400 on a Sunday (rest day, the weekly summary never counts it)', async () => {
      await expect(service.resolverOmisionSinMarcaje({ ...dto, fecha: '2026-08-23' }, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'DIA_DE_DESCANSO' }));
    });

    it('400 for today while the trabajador is still within the entry tolerance', async () => {
      jest.setSystemTime(new Date(2026, 7, 26, 7, 10)); // entra 07:00, tolerancia 15 min
      await expect(service.resolverOmisionSinMarcaje({ ...dto, fecha: '2026-08-26' }, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'AUN_EN_TOLERANCIA' }));
    });

    it('400 for a future day', async () => {
      await expect(service.resolverOmisionSinMarcaje({ ...dto, fecha: '2026-08-27' }, 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
    });

    it('400 for a day before the hire date', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, fecha_contratacion: new Date(Date.UTC(2026, 7, 26)) });
      await expect(service.resolverOmisionSinMarcaje(dto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'ANTES_DE_SU_INGRESO' }));
    });

    it('409 when that day already has a record (resolve it from the record)', async () => {
      prisma.registros_asistencia.findFirst.mockResolvedValue({ id: 'reg-uuid-1' });
      await expect(service.resolverOmisionSinMarcaje(dto, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.registros_asistencia.create).not.toHaveBeenCalled();
    });

    it('404 when the trabajador does not exist', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue(null);
      await expect(service.resolverOmisionSinMarcaje(dto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarUbicacionObra', () => {
    const dto = { lat: 19.4326, lng: -99.1332, radioPermitidoMetros: 150, precisionGpsMetros: 12 };

    it('stores the obra center and radius and audits before/after', async () => {
      prisma.obras.findFirst.mockResolvedValue({ ...mockObra, lat: null, lng: null, radio_permitido_metros: null });
      const result = await service.registrarUbicacionObra(mockObra.id, dto, 'user-1');
      expect(prisma.obras.update).toHaveBeenCalledWith({
        where: { id: mockObra.id },
        data: expect.objectContaining({ lat: 19.4326, lng: -99.1332, radio_permitido_metros: 150, actualizado_por: 'user-1' }),
      });
      expect(result).toEqual(expect.objectContaining({ id: mockObra.id, lat: 19.4326, lng: -99.1332, radioPermitidoMetros: 150 }));
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'OBRA_UBICACION_REGISTRADA',
          entityType: 'obras',
          result: 'SUCCESS',
          previousValue: expect.objectContaining({ lat: undefined, lng: undefined }),
          newValue: expect.objectContaining({ precisionGpsMetros: 12, capturaManual: false }),
        }),
      );
    });

    it('400 for 0, 0 (GPS without fix)', async () => {
      await expect(service.registrarUbicacionObra(mockObra.id, { ...dto, lat: 0, lng: 0 }, 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.obras.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'UBICACION_INVALIDA' }));
    });

    it('400 for coordinates outside Mexico (e.g. lat and lng swapped)', async () => {
      await expect(
        service.registrarUbicacionObra(mockObra.id, { ...dto, lat: 45, lng: 19.4326 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.obras.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'UBICACION_FUERA_DE_MEXICO' }));
    });

    it('400 when the GPS accuracy is worse than 100 m', async () => {
      await expect(
        service.registrarUbicacionObra(mockObra.id, { ...dto, precisionGpsMetros: 250 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'GPS_IMPRECISO' }));
    });

    it('404 when the obra does not exist', async () => {
      prisma.obras.findFirst.mockResolvedValue(null);
      await expect(service.registrarUbicacionObra('missing', dto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
