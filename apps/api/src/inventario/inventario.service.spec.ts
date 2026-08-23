import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('InventarioService', () => {
  let service: InventarioService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let auditService: { log: jest.Mock; logFailure: jest.Mock };

  const mockArticulo = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    codigo: 'FAC-001',
    nombre: 'Filtro de Aceite CAT',
    stock: 12,
    stock_minimo: 5,
    precio_unitario: 450,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    categoria_id: 'c1',
    proveedor_id: 'p1',
    unidad_id: 'u1',
    eliminado_en: null,
    categorias_inventario: { id: 'c1', nombre: 'Refacciones' },
    proveedores: { id: 'p1', nombre: 'CAT México' },
    unidades_medida: { id: 'u1', codigo: 'Pza', nombre: 'Pieza' },
  };

  const mockCatalogos = {
    categorias: [{ id: 'c1', nombre: 'Refacciones' }],
    proveedores: [{ id: 'p1', nombre: 'CAT México' }],
    unidades: [{ id: 'u1', codigo: 'Pza', nombre: 'Pieza' }],
  };

  beforeEach(async () => {
    prisma = {
      articulos_inventario: {
        findMany: jest.fn().mockResolvedValue([mockArticulo]),
        findFirst: jest.fn().mockResolvedValue(mockArticulo),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockArticulo),
        update: jest.fn().mockResolvedValue(mockArticulo),
      },
      categorias_inventario: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', nombre: 'Refacciones' }),
        findMany: jest.fn().mockResolvedValue(mockCatalogos.categorias),
      },
      proveedores: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p1', nombre: 'CAT México' }),
        findMany: jest.fn().mockResolvedValue(mockCatalogos.proveedores),
      },
      unidades_medida: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u1', codigo: 'Pza', nombre: 'Pieza' }),
        findMany: jest.fn().mockResolvedValue(mockCatalogos.unidades),
      },
      movimientos_inventario: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation((ops: Promise<unknown>[]) =>
        Promise.all(ops),
      ),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
      logFailure: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(InventarioService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ──
  describe('findAll', () => {
    it('should return paginated articles', async () => {
      const result = await service.findAll({});

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prisma.articulos_inventario.findMany).toHaveBeenCalled();
    });

    it('should pass search to where clause', async () => {
      await service.findAll({ search: 'filtro' });

      const callArgs = prisma.articulos_inventario.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('should pass categoriaId filter', async () => {
      await service.findAll({ categoriaId: 'c1' });

      const callArgs = prisma.articulos_inventario.findMany.mock.calls[0][0];
      expect(callArgs.where.categoria_id).toBe('c1');
    });

    it('should apply stock bajo post-filter', async () => {
      const lowStock = { ...mockArticulo, stock: 2, stock_minimo: 5 };
      prisma.articulos_inventario.findMany.mockResolvedValue([lowStock]);

      const result = await service.findAll({ stockEstado: 'bajo' });
      expect(result.items).toHaveLength(1);
    });

    it('should apply stock ok post-filter', async () => {
      const okStock = { ...mockArticulo, stock: 20, stock_minimo: 5 };
      prisma.articulos_inventario.findMany.mockResolvedValue([okStock]);

      const result = await service.findAll({ stockEstado: 'ok' });
      expect(result.items).toHaveLength(1);
    });
  });

  // ── findOne ──
  describe('findOne', () => {
    it('should return a single article', async () => {
      const result = await service.findOne(mockArticulo.id);
      expect(result.id).toBe(mockArticulo.id);
      expect(result.nombre).toBe('Filtro de Aceite CAT');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.articulos_inventario.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ──
  describe('create', () => {
    const createDto = {
      nombre: 'Aceite Hidráulico',
      categoriaId: 'c1',
      proveedorId: 'p1',
      unidadId: 'u1',
      stock: 50,
      stockMinimo: 10,
      precioUnitario: 1200,
    };

    it('should create a new article and register audit', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result.nombre).toBe('Filtro de Aceite CAT');
      expect(prisma.articulos_inventario.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_CREADO',
          result: 'SUCCESS',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should log STOCK_BAJO_DETECTADO when created with low stock', async () => {
      const lowStockDto = { ...createDto, stock: 2, stockMinimo: 10 };
      await service.create(lowStockDto, 'user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_DETECTADO',
          metadata: expect.objectContaining({ contexto: 'Creación con stock bajo' }),
        }),
      );
    });

    it('should log failure if category not found', async () => {
      prisma.categorias_inventario.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, categoriaId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(auditService.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_CREADO',
          errorCode: 'CATEGORY_NOT_FOUND',
        }),
      );
    });

    it('should log failure if supplier not found', async () => {
      prisma.proveedores.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, proveedorId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(auditService.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_CREADO',
          errorCode: 'SUPPLIER_NOT_FOUND',
        }),
      );
    });

    it('should log failure if unit not found', async () => {
      prisma.unidades_medida.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, unidadId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(auditService.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_CREADO',
          errorCode: 'UNIT_NOT_FOUND',
        }),
      );
    });
  });

  // ── update ──
  describe('update', () => {
    it('should update an article and register audit', async () => {
      const result = await service.update(mockArticulo.id, { nombre: 'Nuevo Nombre' }, 'user-1');
      expect(prisma.articulos_inventario.update).toHaveBeenCalled();
      expect(result.nombre).toBe('Filtro de Aceite CAT');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_ACTUALIZADO',
          result: 'SUCCESS',
        }),
      );
    });

    it('should log STOCK_BAJO_DETECTADO when stock drops below threshold', async () => {
      // Current: stock=12, min=5. Update: stock=3 → 3<=5 but was >5
      await service.update(mockArticulo.id, { stock: 3 }, 'user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_DETECTADO',
        }),
      );
    });

    it('should log STOCK_BAJO_RESUELTO when stock rises above threshold', async () => {
      // Current: stock=12, min=5 → above. Set min to 15 → 12<=15 was OK
      prisma.articulos_inventario.findFirst.mockResolvedValue({
        ...mockArticulo,
        stock: 3,
        stock_minimo: 5,
      });

      await service.update(mockArticulo.id, { stock: 10 }, 'user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_RESUELTO',
        }),
      );
    });

    it('should throw NotFoundException if article not found', async () => {
      prisma.articulos_inventario.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { nombre: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log failure on invalid category', async () => {
      prisma.categorias_inventario.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockArticulo.id, { categoriaId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(auditService.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_ACTUALIZADO',
          errorCode: 'CATEGORY_NOT_FOUND',
        }),
      );
    });
  });

  // ── remove ──
  describe('remove', () => {
    it('should soft delete an article and register audit', async () => {
      const result = await service.remove(mockArticulo.id, 'user-1');
      expect(result.message).toContain('eliminado');
      expect(prisma.articulos_inventario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eliminado_en: expect.any(Date) }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARTICULO_ELIMINADO',
          result: 'SUCCESS',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should throw NotFoundException if article not found', async () => {
      prisma.articulos_inventario.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── crearMovimiento ──
  describe('crearMovimiento', () => {
    it('should create an ENTRADA movement, update stock, and register audit', async () => {
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
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOVIMIENTO_REGISTRADO',
          result: 'SUCCESS',
          previousValue: { stock: 12 },
          newValue: expect.objectContaining({ tipo: 'ENTRADA', stockResultante: 22 }),
        }),
      );
    });

    it('should create a SALIDA movement and reduce stock', async () => {
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

    it('should log STOCK_BAJO_DETECTADO when SALIDA drops below threshold', async () => {
      // Current: stock=12, min=5. SALIDA de 10 → stock=2 ≤ 5
      await service.crearMovimiento(
        {
          articuloId: mockArticulo.id,
          tipo: 'SALIDA',
          cantidad: 10,
        },
        'user-1',
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_DETECTADO',
        }),
      );
    });

    it('should log STOCK_BAJO_RESUELTO when ENTRADA rises above threshold', async () => {
      // Set article as low stock: stock=3, min=5
      prisma.articulos_inventario.findFirst.mockResolvedValue({
        ...mockArticulo,
        stock: 3,
        stock_minimo: 5,
      });

      await service.crearMovimiento(
        {
          articuloId: mockArticulo.id,
          tipo: 'ENTRADA',
          cantidad: 5,
        },
        'user-1',
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_BAJO_RESUELTO',
        }),
      );
    });

    it('should log STOCK_INSUFICIENTE on insufficient stock', async () => {
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

      expect(auditService.logFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STOCK_INSUFICIENTE',
          errorCode: 'INSUFFICIENT_STOCK',
        }),
      );
    });

    it('should throw NotFoundException if article not found', async () => {
      prisma.articulos_inventario.findFirst.mockResolvedValue(null);

      await expect(
        service.crearMovimiento(
          { articuloId: 'bad', tipo: 'ENTRADA', cantidad: 1 },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findCatalogos ──
  describe('findCatalogos', () => {
    it('should return categories, suppliers, and units', async () => {
      const result = await service.findCatalogos();
      expect(result).toHaveProperty('categorias');
      expect(result).toHaveProperty('proveedores');
      expect(result).toHaveProperty('unidades');
      expect(result.categorias).toHaveLength(1);
    });
  });

  // ── findStats ──
  describe('findStats', () => {
    it('should return inventory statistics', async () => {
      const result = await service.findStats();
      expect(result).toHaveProperty('totalArticulos');
      expect(result).toHaveProperty('stockBajo');
      expect(result).toHaveProperty('valorTotal');
      expect(result.totalArticulos).toBe(1);
    });

    it('should count low stock items correctly', async () => {
      prisma.articulos_inventario.findMany.mockResolvedValue([
        { stock: 2, stock_minimo: 5, precio_unitario: 100 },
        { stock: 20, stock_minimo: 5, precio_unitario: 200 },
        { stock: 3, stock_minimo: 3, precio_unitario: 50 },
      ]);

      const result = await service.findStats();
      expect(result.totalArticulos).toBe(3);
      expect(result.stockBajo).toBe(2); // 2<=5 and 3<=3
    });
  });
});
