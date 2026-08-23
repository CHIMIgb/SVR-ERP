import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BitacoraService', () => {
  let service: BitacoraService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  const mockBitacora = {
    id: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
    maquina_id: 'm1c2d3e4-f5a6-7890-abcd-ef1234567890',
    actividad: 'Excavación para cimentación profunda',
    horas: 8,
    fecha: new Date('2025-04-27'),
    obra_texto: 'Valle Sur',
    obra_id: null,
    codigo: null,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: 'user-1',
    actualizado_por: 'user-1',
    eliminado_en: null,
    maquinas: { id: 'm1', nombre: 'Excavadora CAT 320' },
    obras: null,
  };

  const mockMaquina = { id: 'm1c2d3e4-f5a6-7890-abcd-ef1234567890', nombre: 'Excavadora CAT 320', activo: true, eliminado_en: null };

  beforeEach(async () => {
    prisma = {
      bitacoras_operacion: {
        findMany: jest.fn().mockResolvedValue([mockBitacora]),
        findFirst: jest.fn().mockResolvedValue(mockBitacora),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockBitacora),
        update: jest.fn().mockResolvedValue(mockBitacora),
      },
      maquinas: {
        findFirst: jest.fn().mockResolvedValue(mockMaquina),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findMany: jest.fn().mockImplementation((args: any) => {
          // Para findStats: retorna máquinas sin mantenimiento/sin fallas
          if (args?.where?.estado === 'MANTENIMIENTO') return Promise.resolve([]);
          if (args?.where?.fallas_mecanicas?.some) return Promise.resolve([]);
          // Para findCatalogos: retorna máquina con fallas_mecanicas vacías
          return Promise.resolve([{ ...mockMaquina, fallas_mecanicas: [] }]);
        }),
      },
      obras: {
        findFirst: jest.fn().mockResolvedValue({ id: 'o1', nombre: 'Valle Sur', activo: true, eliminado_en: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findMany: jest.fn().mockImplementation((args: any) => {
          // Para findCatalogos con filtro FINALIZADA
          if (args?.where?.estado?.not === 'FINALIZADA') {
            return Promise.resolve([{ id: 'o1', nombre: 'Valle Sur', estado: 'EN_PROCESO' }]);
          }
          return Promise.resolve([{ id: 'o1', nombre: 'Valle Sur' }]);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BitacoraService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(BitacoraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ──
  describe('findAll', () => {
    it('should return paginated bitacoras', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prisma.bitacoras_operacion.findMany).toHaveBeenCalled();
    });

    it('should pass search to where clause', async () => {
      await service.findAll({ search: 'excavación' });
      const callArgs = prisma.bitacoras_operacion.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('should pass maquinaId filter', async () => {
      await service.findAll({ maquinaId: 'm1' });
      const callArgs = prisma.bitacoras_operacion.findMany.mock.calls[0][0];
      expect(callArgs.where.maquina_id).toBe('m1');
    });

    it('should pass obraId filter', async () => {
      await service.findAll({ obraId: 'o1' });
      const callArgs = prisma.bitacoras_operacion.findMany.mock.calls[0][0];
      expect(callArgs.where.obra_id).toBe('o1');
    });

    it('should pass date range filters', async () => {
      await service.findAll({ fechaDesde: '2025-04-01', fechaHasta: '2025-04-30' });
      const callArgs = prisma.bitacoras_operacion.findMany.mock.calls[0][0];
      expect(callArgs.where.fecha).toBeDefined();
      expect(callArgs.where.fecha.gte).toBeDefined();
      expect(callArgs.where.fecha.lte).toBeDefined();
    });
  });

  // ── findOne ──
  describe('findOne', () => {
    it('should return a single bitacora', async () => {
      const result = await service.findOne(mockBitacora.id);
      expect(result.id).toBe(mockBitacora.id);
      expect(result.actividad).toBe('Excavación para cimentación profunda');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.bitacoras_operacion.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ──
  describe('create', () => {
    const createDto = {
      maquinaId: 'm1c2d3e4-f5a6-7890-abcd-ef1234567890',
      actividad: 'Excavación para cimentación',
      horas: 8,
      fecha: '2025-04-27',
      obraTexto: 'Valle Sur',
    };

    it('should create a new bitacora', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result.actividad).toBe('Excavación para cimentación profunda');
      expect(prisma.bitacoras_operacion.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if machine not found', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ ...createDto, maquinaId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if obra not found', async () => {
      prisma.obras.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ ...createDto, obraId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── update ──
  describe('update', () => {
    it('should update a bitacora', async () => {
      const result = await service.update(mockBitacora.id, { actividad: 'Nueva actividad' }, 'user-1');
      expect(prisma.bitacoras_operacion.update).toHaveBeenCalled();
      expect(result.actividad).toBe('Excavación para cimentación profunda');
    });

    it('should throw NotFoundException if bitacora not found', async () => {
      prisma.bitacoras_operacion.findFirst.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { actividad: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if machine not found on update', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(
        service.update(mockBitacora.id, { maquinaId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ──
  describe('remove', () => {
    it('should soft delete a bitacora', async () => {
      const result = await service.remove(mockBitacora.id);
      expect(result.message).toContain('Bitácora eliminada');
      expect(prisma.bitacoras_operacion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eliminado_en: expect.any(Date) }),
        }),
      );
    });

    it('should throw NotFoundException if bitacora not found', async () => {
      prisma.bitacoras_operacion.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findStats ──
  describe('findStats', () => {
    it('should return bitacora statistics', async () => {
      const result = await service.findStats();
      expect(result).toHaveProperty('totalRegistros');
      expect(result).toHaveProperty('horasTotales');
      expect(result).toHaveProperty('maquinasActivas');
      expect(result.totalRegistros).toBe(1);
      expect(result.horasTotales).toBe(8);
      // maquinasActivas = 1 (machines with bitacora minus those in maintenance/with faults)
      expect(result.maquinasActivas).toBe(1);
    });

    it('should exclude machines in MANTENIMIENTO from maquinasActivas count', async () => {
      // Simulate the machine in bitacora is in MANTENIMIENTO
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.maquinas.findMany.mockImplementation((args: any) => {
        if (args?.where?.estado === 'MANTENIMIENTO') {
          return Promise.resolve([{ id: 'm1c2d3e4-f5a6-7890-abcd-ef1234567890' }]);
        }
        if (args?.where?.fallas_mecanicas?.some) return Promise.resolve([]);
        return Promise.resolve([]);
      });

      const result = await service.findStats();
      expect(result.maquinasActivas).toBe(0);
    });

    it('should exclude machines with active faults from maquinasActivas count', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.maquinas.findMany.mockImplementation((args: any) => {
        if (args?.where?.estado === 'MANTENIMIENTO') return Promise.resolve([]);
        if (args?.where?.fallas_mecanicas?.some) {
          return Promise.resolve([{ id: 'm1c2d3e4-f5a6-7890-abcd-ef1234567890' }]);
        }
        return Promise.resolve([]);
      });

      const result = await service.findStats();
      expect(result.maquinasActivas).toBe(0);
    });
  });

  // ── findCatalogos ──
  describe('findCatalogos', () => {
    it('should return machines and obras catalogs', async () => {
      const result = await service.findCatalogos();
      expect(result).toHaveProperty('maquinas');
      expect(result).toHaveProperty('obras');
      expect(result.maquinas).toHaveLength(1);
      expect(result.obras).toHaveLength(1);
    });

    it('should exclude machines with active faults from catalog', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.maquinas.findMany.mockImplementation((args: any) => {
        if (args?.where?.fallas_mecanicas?.some) {
          // Machine has active faults — returned by query but filtered in code
          return Promise.resolve([
            { id: 'm1', nombre: 'Excavadora CAT 320', fallas_mecanicas: [{ id: 'f1' }] },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.findCatalogos();
      expect(result.maquinas).toHaveLength(0);
    });

    it('should exclude FINALIZADA obras from catalog', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.obras.findMany.mockImplementation((args: any) => {
        if (args?.where?.estado?.not === 'FINALIZADA') {
          // No obras returned because all are FINALIZADA
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const result = await service.findCatalogos();
      expect(result.obras).toHaveLength(0);
    });
  });
});
