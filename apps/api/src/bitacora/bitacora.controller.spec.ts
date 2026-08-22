import { Test, TestingModule } from '@nestjs/testing';
import { BitacoraController } from './bitacora.controller';
import { BitacoraService } from './bitacora.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BitacoraController', () => {
  let controller: BitacoraController;
  let service: BitacoraService;

  const mockResult = {
    items: [
      {
        id: 'b1',
        maquinaId: 'm1',
        maquina: 'Excavadora CAT 320',
        actividad: 'Excavación para cimentación',
        horas: 8,
        fecha: '2025-04-27',
        obra: 'Valle Sur',
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockResult.items[0]),
    create: jest.fn().mockResolvedValue(mockResult.items[0]),
    update: jest.fn().mockResolvedValue(mockResult.items[0]),
    remove: jest.fn().mockResolvedValue({ message: 'eliminado' }),
    findStats: jest.fn().mockResolvedValue({
      totalRegistros: 1,
      horasTotales: 8,
      maquinasActivas: 1,
    }),
    findCatalogos: jest.fn().mockResolvedValue({
      maquinas: [{ id: 'm1', nombre: 'Excavadora CAT 320' }],
      obras: [{ id: 'o1', nombre: 'Valle Sur' }],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BitacoraController],
      providers: [
        { provide: BitacoraService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(BitacoraController);
    service = module.get(BitacoraService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated bitacoras', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a single bitacora', async () => {
      const result = await controller.findOne('b1');
      expect(result.id).toBe('b1');
      expect(service.findOne).toHaveBeenCalledWith('b1');
    });
  });

  describe('create', () => {
    it('should create a new bitacora', async () => {
      const dto = {
        maquinaId: 'm1',
        actividad: 'Excavación',
        horas: 8,
        fecha: '2025-04-27',
        obraTexto: 'Valle Sur',
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result.actividad).toBe('Excavación para cimentación');
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should update a bitacora', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(
        'b1',
        { actividad: 'Nueva' },
        req as never,
      );
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith('b1', { actividad: 'Nueva' }, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft delete a bitacora', async () => {
      const result = await controller.remove('b1');
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith('b1');
    });
  });

  describe('findStats', () => {
    it('should return bitacora stats', async () => {
      const result = await controller.findStats();
      expect(result.totalRegistros).toBe(1);
      expect(result.horasTotales).toBe(8);
      expect(result.maquinasActivas).toBe(1);
    });
  });

  describe('findCatalogos', () => {
    it('should return catalog data', async () => {
      const result = await controller.findCatalogos();
      expect(result).toHaveProperty('maquinas');
      expect(result).toHaveProperty('obras');
    });
  });
});
