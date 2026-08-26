import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NominaService } from './nomina.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AsistenciaService } from '../asistencia/asistencia.service';

describe('NominaService', () => {
  let service: NominaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
  const mockAsistencia = { findSemanal: jest.fn().mockResolvedValue([]) };

  const mockTrabajador = {
    id: 'trab-uuid-1',
    nombre: 'Juan Pérez',
    puesto: 'Operador',
    avatar: 'JP',
    sueldo_fiscal: 2500,
    sueldo_efectivo: 3500,
    metodo_pago: 'MIXTO',
    tarifa_hora_extra: 90,
    estado: 'ACTIVO',
    categorias_puesto: { nombre: 'Operador' },
  };

  const mockPeriodo = {
    id: 'periodo-uuid-1',
    codigo: 'NOM-2026-S35',
    nombre: 'Semana 35: 24 Ago – 29 Ago 2026',
    tipo: 'SEMANAL',
    fecha_inicio: new Date(Date.UTC(2026, 7, 24)),
    fecha_fin: new Date(Date.UTC(2026, 7, 29)),
    estado: 'ABIERTO',
  };

  const mockNomina = {
    id: 'nomina-uuid-1',
    periodo_id: mockPeriodo.id,
    trabajador_id: mockTrabajador.id,
    dias_trabajados: 0,
    dias_faltas: 0,
    horas_ordinarias: 0,
    horas_extra: 0,
    sueldo_fiscal: 2500,
    sueldo_efectivo: 3500,
    total_percepciones: 0,
    total_deducciones: 0,
    total_neto: 6000,
    metodo_pago: 'MIXTO',
    estado: 'PENDIENTE',
    trabajadores: mockTrabajador,
    percepciones_nomina: [],
    deducciones_nomina: [],
  };

  beforeEach(async () => {
    prisma = {
      periodos_nomina: {
        findFirst: jest.fn().mockResolvedValue(mockPeriodo),
        create: jest.fn().mockResolvedValue(mockPeriodo),
      },
      nominas: {
        findFirst: jest.fn().mockResolvedValue(mockNomina),
        findMany: jest.fn().mockResolvedValue([mockNomina]),
        findUniqueOrThrow: jest.fn().mockResolvedValue(mockNomina),
        create: jest.fn().mockResolvedValue(mockNomina),
        update: jest.fn().mockResolvedValue(mockNomina),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      trabajadores: {
        findMany: jest.fn().mockResolvedValue([mockTrabajador]),
      },
      percepciones_nomina: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      deducciones_nomina: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NominaService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: AsistenciaService, useValue: mockAsistencia },
      ],
    }).compile();

    service = module.get(NominaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findActual', () => {
    it('reuses an existing periodo for the week and lists its nominas', async () => {
      const result = await service.findActual({}, 'user-1');
      expect(result.periodo.codigo).toBe('NOM-2026-S35');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].trabajadorNombre).toBe('Juan Pérez');
      expect(prisma.periodos_nomina.create).not.toHaveBeenCalled();
    });

    it('creates the periodo when none exists for the week yet', async () => {
      prisma.periodos_nomina.findFirst.mockResolvedValue(null);
      await service.findActual({}, 'user-1');
      expect(prisma.periodos_nomina.create).toHaveBeenCalled();
    });

    it('auto-creates a nomina row for active trabajadores missing one', async () => {
      prisma.nominas.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([mockNomina]);
      await service.findActual({}, 'user-1');
      expect(prisma.nominas.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ trabajador_id: mockTrabajador.id, estado: 'PENDIENTE' }) }),
      );
    });

    it('does not duplicate a nomina row that already exists for the period', async () => {
      prisma.nominas.findMany.mockResolvedValue([mockNomina]);
      await service.findActual({}, 'user-1');
      expect(prisma.nominas.create).not.toHaveBeenCalled();
    });
  });

  describe('sincronizarAsistencia', () => {
    it('pulls real weekly totals from AsistenciaService and updates the nomina row', async () => {
      mockAsistencia.findSemanal.mockResolvedValue([
        { trabajadorId: mockTrabajador.id, totalDiasAsistidos: 5, totalFaltas: 1, totalHorasOrdinarias: 40, totalHorasExtra: 3 },
      ]);
      const result = await service.sincronizarAsistencia(mockPeriodo.id, 'user-1');

      expect(mockAsistencia.findSemanal).toHaveBeenCalledWith({ fecha: '2026-08-24' });
      expect(prisma.nominas.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ dias_trabajados: 5, dias_faltas: 1, horas_extra: 3 }) }),
      );
      expect(result.totalHorasExtraSincronizadas).toBe(3);
      expect(result.totalFaltasAplicadas).toBe(1);
    });

    it('creates an auto percepcion line for overtime using the tarifa configured on the trabajador', async () => {
      mockAsistencia.findSemanal.mockResolvedValue([
        { trabajadorId: mockTrabajador.id, totalDiasAsistidos: 6, totalFaltas: 0, totalHorasOrdinarias: 48, totalHorasExtra: 2 },
      ]);
      await service.sincronizarAsistencia(mockPeriodo.id, 'user-1');
      expect(prisma.percepciones_nomina.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tipo: 'HORAS_EXTRA_AUTO', monto: 180 }) }),
      );
    });

    it('creates an auto deduccion line for faltas using 1/6 of the weekly wage per day', async () => {
      mockAsistencia.findSemanal.mockResolvedValue([
        { trabajadorId: mockTrabajador.id, totalDiasAsistidos: 4, totalFaltas: 2, totalHorasOrdinarias: 32, totalHorasExtra: 0 },
      ]);
      await service.sincronizarAsistencia(mockPeriodo.id, 'user-1');
      expect(prisma.deducciones_nomina.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tipo: 'FALTA_AUTO', monto: 2000 }) }),
      );
    });

    it('clears previous auto-generated lines before regenerating them (no duplicate accumulation)', async () => {
      await service.sincronizarAsistencia(mockPeriodo.id, 'user-1');
      expect(prisma.percepciones_nomina.deleteMany).toHaveBeenCalledWith({ where: { nomina_id: mockNomina.id, tipo: 'HORAS_EXTRA_AUTO' } });
      expect(prisma.deducciones_nomina.deleteMany).toHaveBeenCalledWith({ where: { nomina_id: mockNomina.id, tipo: 'FALTA_AUTO' } });
    });

    it('404s when the periodo does not exist', async () => {
      prisma.periodos_nomina.findFirst.mockResolvedValue(null);
      await expect(service.sincronizarAsistencia('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarAjuste', () => {
    it('creates a percepcion for a Bono and recomputes totals', async () => {
      prisma.percepciones_nomina.findMany.mockResolvedValue([{ monto: 500 }]);
      await service.registrarAjuste(mockNomina.id, { tipo: 'Bono', monto: 500, concepto: 'Productividad' }, 'user-1');
      expect(prisma.percepciones_nomina.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tipo: 'BONO', monto: 500 }) }),
      );
      expect(prisma.nominas.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ total_percepciones: 500 }) }),
      );
    });

    it('creates a deduccion for a Descuento', async () => {
      await service.registrarAjuste(mockNomina.id, { tipo: 'Descuento', monto: 300, concepto: 'Daño a herramienta' }, 'user-1');
      expect(prisma.deducciones_nomina.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tipo: 'DESCUENTO', monto: 300 }) }),
      );
    });

    it('creates a deduccion for a Prestamo', async () => {
      await service.registrarAjuste(mockNomina.id, { tipo: 'Prestamo', monto: 1000, concepto: 'Anticipo' }, 'user-1');
      expect(prisma.deducciones_nomina.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tipo: 'PRESTAMO', monto: 1000 }) }),
      );
    });

    it('404s when the nomina row does not exist', async () => {
      prisma.nominas.findFirst.mockResolvedValue(null);
      await expect(
        service.registrarAjuste('missing', { tipo: 'Bono', monto: 100, concepto: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizarEstado', () => {
    it('marks a nomina row as Pagado', async () => {
      prisma.nominas.findUniqueOrThrow.mockResolvedValue({ ...mockNomina, estado: 'PAGADA' });
      const result = await service.actualizarEstado(mockNomina.id, { estado: 'Pagado' }, 'user-1');
      expect(result.estado).toBe('Pagado');
      expect(prisma.nominas.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: 'PAGADA' }) }));
    });

    it('404s when the nomina row does not exist', async () => {
      prisma.nominas.findFirst.mockResolvedValue(null);
      await expect(service.actualizarEstado('missing', { estado: 'Pagado' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('pagarTodos', () => {
    it('marks every nomina in the periodo as Pagado', async () => {
      const result = await service.pagarTodos(mockPeriodo.id, 'user-1');
      expect(prisma.nominas.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { periodo_id: mockPeriodo.id, eliminado_en: null }, data: expect.objectContaining({ estado: 'PAGADA' }) }),
      );
      expect(result.actualizados).toBe(1);
    });

    it('404s when the periodo does not exist', async () => {
      prisma.periodos_nomina.findFirst.mockResolvedValue(null);
      await expect(service.pagarTodos('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
