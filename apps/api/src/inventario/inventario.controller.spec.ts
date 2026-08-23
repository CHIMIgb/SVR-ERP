import { Test, TestingModule } from '@nestjs/testing';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InventarioController', () => {
  let controller: InventarioController;
  let service: InventarioService;

  const mockResult = {
    items: [
      {
        id: 'a1',
        nombre: 'Filtro de Aceite',
        stock: 12,
        stockMinimo: 5,
        precioUnitario: 450,
        categoria: 'Refacciones',
        proveedor: 'CAT México',
        unidad: 'Pieza',
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockResult),
    findOne: jest.fn().mockResolvedValue(mockResult.items[0]),
    create: jest.fn().mockResolvedValue(mockResult.items[0]),
    update: jest.fn().mockResolvedValue(mockResult.items[0]),
    remove: jest.fn().mockResolvedValue({ message: 'Artículo eliminado exitosamente' }),
    crearMovimiento: jest.fn().mockResolvedValue({
      articuloId: 'a1',
      tipo: 'ENTRADA',
      cantidad: 10,
      stockAnterior: 12,
      stockResultante: 22,
    }),
    findCatalogos: jest.fn().mockResolvedValue({
      categorias: [{ id: 'c1', nombre: 'Refacciones' }],
      proveedores: [{ id: 'p1', nombre: 'CAT México' }],
      unidades: [{ id: 'u1', codigo: 'Pza', nombre: 'Pieza' }],
    }),
    findStats: jest.fn().mockResolvedValue({
      totalArticulos: 1,
      stockBajo: 0,
      valorTotal: 5400,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventarioController],
      providers: [
        { provide: InventarioService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(InventarioController);
    service = module.get(InventarioService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated articles', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a single article', async () => {
      const result = await controller.findOne('a1');
      expect(result.id).toBe('a1');
      expect(service.findOne).toHaveBeenCalledWith('a1');
    });
  });

  describe('create', () => {
    it('should create a new article passing userId', async () => {
      const dto = {
        nombre: 'Nuevo',
        categoriaId: 'c1',
        proveedorId: 'p1',
        unidadId: 'u1',
        stock: 10,
        stockMinimo: 2,
        precioUnitario: 100,
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.create(dto as never, req as never);
      expect(result.nombre).toBe('Filtro de Aceite');
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should update an article passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.update('a1', { nombre: 'X' }, req as never);
      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith('a1', { nombre: 'X' }, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft delete an article passing userId', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.remove('a1', req as never);
      expect(result.message).toContain('eliminado');
      expect(service.remove).toHaveBeenCalledWith('a1', 'user-1');
    });
  });

  describe('crearMovimiento', () => {
    it('should create a stock movement passing userId', async () => {
      const dto = {
        articuloId: 'a1',
        tipo: 'ENTRADA' as const,
        cantidad: 10,
      };
      const req = { user: { id: 'user-1' } };
      const result = await controller.crearMovimiento(dto, req as never);
      expect(result.tipo).toBe('ENTRADA');
      expect(result.stockResultante).toBe(22);
      expect(service.crearMovimiento).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('findCatalogos', () => {
    it('should return catalog data', async () => {
      const result = await controller.findCatalogos();
      expect(result).toHaveProperty('categorias');
      expect(result).toHaveProperty('proveedores');
      expect(result).toHaveProperty('unidades');
    });
  });

  describe('findStats', () => {
    it('should return inventory stats', async () => {
      const result = await controller.findStats();
      expect(result.totalArticulos).toBe(1);
      expect(result.stockBajo).toBe(0);
      expect(result.valorTotal).toBe(5400);
    });
  });
});
