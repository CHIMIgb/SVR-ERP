import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('InventarioService', () => {
  let service: InventarioService;

  const mockPrisma = {
    articulos_inventario: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    categorias_inventario: {
      findUnique: jest.fn(),
    },
    proveedores: {
      findFirst: jest.fn(),
    },
    unidades_medida: {
      findUnique: jest.fn(),
    },
    movimientos_inventario: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((fns: Promise<unknown>[]) => Promise.all(fns)),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
    logFailure: jest.fn().mockResolvedValue(undefined),
  };

  const mockArticulo = {
    id: 'a1',
    nombre: 'Filtro de Aceite CAT',
    codigo: 'FA-CAT-001',
    stock: 12,
    stock_minimo: 5,
    precio_unitario: 450,
    categoria_id: 'c1',
    proveedor_id: 'p1',
    unidad_id: 'u1',
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    eliminado_en: null,
    creado_por: 'user-1',
    actualizado_por: 'user-1',
    categorias_inventario: { id: 'c1', nombre: 'Refacciones' },
    proveedores: { id: 'p1', nombre: 'CAT México' },
    unidades_medida: { id: 'u1', codigo: 'Pza', nombre: 'Pieza' },
  };

  const mockCategoria = { id: 'c1', nombre: 'Refacciones', activo: true };
  const mockProveedor = { id: 'p1', nombre: 'CAT México', activo: true, eliminado_en: null };
  const mockUnidad = { id: 'u1', codigo: 'Pza', nombre: 'Pieza', activo: true };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.categorias_inventario.findUnique.mockResolvedValue(mockCategoria);
    mockPrisma.proveedores.findFirst.mockResolvedValue(mockProveedor);
    mockPrisma.unidades_medida.findUnique.mockResolvedValue(mockUnidad);
    mockPrisma.articulos_inventario.findFirst.mockResolvedValue(mockArticulo);
    mockPrisma.articulos_inventario.findMany.mockResolvedValue([mockArticulo]);
    mockPrisma.articulos_inventario.count.mockResolvedValue(1);
    mockPrisma.articulos_inventario.create.mockResolvedValue(mockArticulo);
    mockPrisma.articulos_inventario.update.mockResolvedValue(mockArticulo);
    mockPrisma.movimientos_inventario.create.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(InventarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated articles', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a single article', async () => {
      const result = await service.findOne('a1');
      expect(result.id).toBe('a1');
      expect(result.nombre).toBe('Filtro de Aceite CAT');
    });

    it('should throw NotFoundException for non-existent article', async () => {
      mockPrisma.articulos_inventario.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Filtro de Aceite CAT',
      codigo: 'FA-CAT-001',
      categoriaId: 'c1',
      proveedorId: 'p1',
      unidadId: 'u1',
      stock: 12,
      stockMinimo: 5,
      precioUnitario: 450,
    };

    it('should create a new article and log ARTICULO_CREADO', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result.nombre).toBe('Filtro de Aceite CAT');
      expect(mockPrisma.articulos_inventario.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_CREADO',
          result: 'SUCCESS',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should log STOCK_BAJO_DETECTADO when creating with stock <= minimo', async () => {
      const lowStockDto = { ...createDto, stock: 3, stockMinimo: 5 };
      await service.create(lowStockDto, 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_DETECTADO',
        }),
      );
    });

    it('should log failure when category not found', async () => {
      mockPrisma.categorias_inventario.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ ...createDto, categoriaId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'CATEGORY_NOT_FOUND',
        }),
      );
    });

    it('should log failure when supplier not found', async () => {
      mockPrisma.proveedores.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ ...createDto, proveedorId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'SUPPLIER_NOT_FOUND',
        }),
      );
    });

    it('should log failure when unit not found', async () => {
      mockPrisma.unidades_medida.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ ...createDto, unidadId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'UNIT_NOT_FOUND',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an article and log ARTICULO_ACTUALIZADO', async () => {
      const result = await service.update(mockArticulo.id, { nombre: 'Nuevo Nombre' }, 'user-1');
      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_ACTUALIZADO',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should detect stock threshold crossing downward', async () => {
      // stock=12, stockMinimo=5 → update to stock=3 (below minimo)
      await service.update(mockArticulo.id, { stock: 3 }, 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_DETECTADO',
        }),
      );
    });

    it('should detect stock threshold crossing upward', async () => {
      // stock=12, stockMinimo=5 → reduce minimo to 15 (stock now below)
      // Then update minimo back to 2 (stock above minimo, resolving)
      const lowStock = { ...mockArticulo, stock: 3, stock_minimo: 5 };
      mockPrisma.articulos_inventario.findFirst.mockResolvedValue(lowStock);

      // update stock from 3 to 10 (above minimo 5)
      await service.update(mockArticulo.id, { stock: 10 }, 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_RESUELTO',
        }),
      );
    });

    it('should throw NotFoundException for non-existent article', async () => {
      mockPrisma.articulos_inventario.findFirst.mockResolvedValue(null);
      await expect(service.update('non-existent', { nombre: 'X' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should log failure for invalid category on update', async () => {
      mockPrisma.categorias_inventario.findUnique.mockResolvedValue(null);
      await expect(
        service.update(mockArticulo.id, { categoriaId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'CATEGORY_NOT_FOUND',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete and log ARTICULO_ELIMINADO', async () => {
      const result = await service.remove(mockArticulo.id, 'user-1');
      expect(result.message).toContain('eliminado');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_ELIMINADO',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should throw NotFoundException for non-existent article', async () => {
      mockPrisma.articulos_inventario.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('crearMovimiento', () => {
    it('should register ENTRADA and log MOVIMIENTO_REGISTRADO', async () => {
      const result = await service.crearMovimiento(
        {
          articuloId: mockArticulo.id,
          tipo: 'ENTRADA',
          cantidad: 10,
        },
        'user-1',
      );

      expect(result.tipo).toBe('ENTRADA');
      expect(result.stockResultante).toBe(22); // 12 + 10
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOVIMIENTO_REGISTRADO',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should register SALIDA and log MOVIMIENTO_REGISTRADO', async () => {
      const result = await service.crearMovimiento(
        {
          articuloId: mockArticulo.id,
          tipo: 'SALIDA',
          cantidad: 5,
        },
        'user-1',
      );

      expect(result.tipo).toBe('SALIDA');
      expect(result.stockResultante).toBe(7); // 12 - 5
    });

    it('should detect stock threshold crossing on SALIDA', async () => {
      // stock=12, minimo=5 → SALIDA de 10 → stock=2 (below 5)
      await service.crearMovimiento(
        {
          articuloId: mockArticulo.id,
          tipo: 'SALIDA',
          cantidad: 10,
        },
        'user-1',
      );

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_DETECTADO',
        }),
      );
    });

    it('should detect stock resolution on ENTRADA', async () => {
      const lowStock = { ...mockArticulo, stock: 2, stock_minimo: 5 };
      mockPrisma.articulos_inventario.findFirst.mockResolvedValue(lowStock);

      // stock=2 (bajo) → ENTRADA de 5 → stock=7 (above 5)
      await service.crearMovimiento(
        {
          articuloId: mockArticulo.id,
          tipo: 'ENTRADA',
          cantidad: 5,
        },
        'user-1',
      );

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_RESUELTO',
        }),
      );
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      await expect(
        service.crearMovimiento(
          {
            articuloId: mockArticulo.id,
            tipo: 'SALIDA',
            cantidad: 100,
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockAudit.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'INSUFFICIENT_STOCK',
        }),
      );
    });

    it('should throw NotFoundException for non-existent article', async () => {
      mockPrisma.articulos_inventario.findFirst.mockResolvedValue(null);
      await expect(
        service.crearMovimiento(
          { articuloId: 'bad', tipo: 'ENTRADA', cantidad: 1 },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
