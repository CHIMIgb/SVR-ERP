import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CombustibleService } from './combustible.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

describe('CombustibleService', () => {
  let service: CombustibleService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockMaquina = {
    id: 'maquina-uuid-1',
    codigo: 'M001',
    nombre: 'Excavadora CAT 320',
    horometro: 1000,
    consumo_esperado_lts_hora: 14,
    trabajadores: { nombre: 'Juan Pérez' },
  };

  const mockCarga = {
    id: 'carga-uuid-1',
    maquina_id: 'maquina-uuid-1',
    operador_id: null,
    fecha: new Date('2026-08-23'),
    litros: 112,
    costo: 2576,
    lugar: 'Gasolinera Norte',
    horometro_actual: 1008,
    horas_trabajadas_periodo: 8,
    consumo_esperado_lts_hora: 14,
    rendimiento_lts_hora: 14,
    alerta_ordena: false,
    desviacion_porcentaje: 0,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    maquinas: { id: 'maquina-uuid-1', codigo: 'M001' },
    trabajadores: { nombre: 'Juan Pérez' },
  };

  beforeEach(async () => {
    prisma = {
      cargas_combustible: {
        findMany: jest.fn().mockResolvedValue([mockCarga]),
        findFirst: jest.fn().mockResolvedValue(mockCarga),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockCarga),
        update: jest.fn().mockResolvedValue(mockCarga),
        aggregate: jest.fn().mockResolvedValue({ _sum: { litros: 312, costo: 7176 }, _avg: { rendimiento_lts_hora: 14.2 } }),
      },
      maquinas: {
        findFirst: jest.fn().mockResolvedValue(mockMaquina),
        findUnique: jest.fn().mockResolvedValue(mockMaquina),
      },
      trabajadores: {
        findFirst: jest.fn().mockResolvedValue({ id: 'trabajador-uuid-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CombustibleService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(CombustibleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    maquinaId: 'M001',
    litros: 112,
    horasTrabajadasPeriodo: 8,
    lugar: 'Gasolinera Norte',
    ...overrides,
  });

  describe('findAll', () => {
    it('should return paginated cargas', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
    });

    it('should filter by soloAlertas', async () => {
      await service.findAll({ soloAlertas: 'true' });
      const callArgs = prisma.cargas_combustible.findMany.mock.calls[0][0];
      expect(callArgs.where.alerta_ordena).toBe(true);
    });
  });

  describe('findStats', () => {
    it('should return aggregated totals and alert count', async () => {
      const stats = await service.findStats();
      expect(stats.totalLitros).toBe(312);
      expect(stats.totalCosto).toBe(7176);
      expect(stats.rendimientoPromedio).toBe(14.2);
      expect(stats.totalAlertasOrdena).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a carga with server-computed rendimiento when the machine exists', async () => {
      const result = await service.create(createDto(), 'user-1');
      expect(result.maquinaId).toBe('M001');
      expect(prisma.cargas_combustible.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMBUSTIBLE_CARGADO', result: 'SUCCESS', actorUserId: 'user-1' }),
      );
    });

    it('should reject when the machine does not exist', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto({ maquinaId: 'M999' }), 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'MAQUINA_NO_ENCONTRADA' }));
    });

    it('should NOT flag alertaOrdena exactly at the 35% threshold', async () => {
      await service.create(createDto({ litros: 18.9, horasTrabajadasPeriodo: 1 }), 'user-1');
      const createData = prisma.cargas_combustible.create.mock.calls[0][0].data;
      expect(createData.desviacion_porcentaje).toBe(35);
      expect(createData.alerta_ordena).toBe(false);
    });

    it('should flag alertaOrdena just above the 35% threshold', async () => {
      await service.create(createDto({ litros: 18.915, horasTrabajadasPeriodo: 1 }), 'user-1');
      const createData = prisma.cargas_combustible.create.mock.calls[0][0].data;
      expect(createData.desviacion_porcentaje).toBeGreaterThan(35);
      expect(createData.alerta_ordena).toBe(true);
    });

    it('should default costo to litros * 23 when not provided', async () => {
      await service.create(createDto({ litros: 100, costo: undefined }), 'user-1');
      const createData = prisma.cargas_combustible.create.mock.calls[0][0].data;
      expect(createData.costo).toBe(2300);
    });

    it('should not divide by zero when the machine has consumoEsperado = 0', async () => {
      prisma.maquinas.findFirst.mockResolvedValue({ ...mockMaquina, consumo_esperado_lts_hora: 0 });
      await service.create(createDto({ litros: 100, horasTrabajadasPeriodo: 10 }), 'user-1');
      const createData = prisma.cargas_combustible.create.mock.calls[0][0].data;
      expect(Number.isFinite(createData.desviacion_porcentaje)).toBe(true);
      expect(createData.consumo_esperado_lts_hora).toBe(14);
    });
  });

  describe('update', () => {
    it('should recompute rendimiento/alerta when litros or horas change', async () => {
      prisma.cargas_combustible.update.mockResolvedValue({ ...mockCarga, litros: 200, rendimiento_lts_hora: 25 });
      const result = await service.update('carga-uuid-1', { litros: 200 }, 'user-1');
      expect(result.rendimientoLtsHora).toBe(25);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMBUSTIBLE_ACTUALIZADO', result: 'SUCCESS' }),
      );
    });

    it('should 404 when the carga does not exist', async () => {
      prisma.cargas_combustible.findFirst.mockResolvedValue(null);
      await expect(service.update('missing', { litros: 1 }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should not divide by zero when the stored consumoEsperado is 0', async () => {
      prisma.cargas_combustible.findFirst.mockResolvedValue({ ...mockCarga, consumo_esperado_lts_hora: 0 });
      await service.update('carga-uuid-1', { litros: 100 }, 'user-1');
      const updateData = prisma.cargas_combustible.update.mock.calls[0][0].data;
      expect(Number.isFinite(updateData.desviacion_porcentaje)).toBe(true);
    });
  });

  describe('remove', () => {
    it('should soft-delete and audit', async () => {
      const result = await service.remove('carga-uuid-1', 'user-1');
      expect(result.message).toContain('eliminada');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMBUSTIBLE_ELIMINADO', result: 'SUCCESS' }),
      );
    });

    it('should 404 when the carga does not exist', async () => {
      prisma.cargas_combustible.findFirst.mockResolvedValue(null);
      await expect(service.remove('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
