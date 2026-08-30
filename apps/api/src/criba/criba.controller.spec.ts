import { Test, TestingModule } from '@nestjs/testing';
import { CribaController } from './criba.controller';
import { CribaService } from './criba.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CribaController', () => {
  let controller: CribaController;
  let service: CribaService;

  const mockRegistro = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    fecha: '2026-08-15',
    turno: 'Matutino',
    operadorId: '550e8400-e29b-41d4-a716-446655440001',
    operador: 'Juan Pérez',
    tipoMaterial: 'Criba fina',
    materialProducido: 320,
    horasTrabajadas: 8,
    materialAlBanco: 290,
  };

  const mockResult = {
    items: [mockRegistro],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockRegistro),
    create: jest.fn().mockResolvedValue(mockRegistro),
    update: jest.fn().mockResolvedValue(mockRegistro),
    remove: jest.fn().mockResolvedValue({ message: 'eliminado' }),
    findStats: jest.fn().mockResolvedValue({
      totalProducido: 1000,
      totalAlBanco: 870,
      totalHoras: 24,
      eficiencia: 87,
      porMaterial: [],
    }),
    findCatalogos: jest.fn().mockResolvedValue({
      trabajadores: [{ id: 't1', nombre: 'Juan Pérez' }],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CribaController],
      providers: [
        { provide: CribaService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(CribaController);
    service = module.get(CribaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated registros', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findStats', () => {
    it('should return criba stats', async () => {
      const result = await controller.findStats();
      expect(result.totalProducido).toBe(1000);
      expect(result.eficiencia).toBe(87);
    });
  });

  describe('findCatalogos', () => {
    it('should return catalog data', async () => {
      const result = await controller.findCatalogos();
      expect(result).toHaveProperty('trabajadores');
    });
  });

  describe('findOne', () => {
    it('should return a single registro', async () => {
      const result = await controller.findOne(mockRegistro.id);
      expect(result.id).toBe(mockRegistro.id);
      expect(service.findOne).toHaveBeenCalledWith(mockRegistro.id);
    });
  });

  describe('create', () => {
    it('should create a registro passing userId', async () => {
      const dto = {
        fecha: '2026-08-20',
        turno: 'MATUTINO' as const,
        tipoMaterial: 'Criba gruesa',
        materialProducido: 250,
        horasTrabajadas: 8,
        materialAlBanco: 220,
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should update a registro passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update(
        mockRegistro.id,
        { materialAlBanco: 310 },
        req as never,
      );
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(mockRegistro.id, { materialAlBanco: 310 }, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft delete a registro passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove(mockRegistro.id, req as never);
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith(mockRegistro.id, 'user-1');
    });
  });
});
