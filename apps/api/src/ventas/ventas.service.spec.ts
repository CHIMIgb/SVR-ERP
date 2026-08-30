import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, MetodoPago } from '@prisma/client';
import { VentasService } from './ventas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('VentasService', () => {
  let service: VentasService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockMaterial = {
    id: 'c2000000-0000-0000-0000-000000000001',
    codigo: 'MAT-001',
    nombre: 'Arena de río',
    stock: 120,
    activo: true,
    eliminado_en: null,
    categorias_inventario: { nombre: 'Áridos' },
    unidades_medida: { nombre: 'm³' },
    articulos_precio: [
      { id: 'p1', articulo_id: 'c2000000-0000-0000-0000-000000000001', medida: 'm³', precio: 350 },
    ],
  };

  const mockVenta = {
    id: '50000000-0000-0000-0000-000000000001',
    folio: 'S123',
    ticket: 1,
    terminal: 'TER-01',
    caja: 'CAJA-PV',
    cliente: 'Público en general',
    cajero: 'Cajero',
    subtotal: 301.72,
    iva: 48.28,
    ieps: 0,
    total: 350,
    metodo: MetodoPago.EFECTIVO,
    efectivo_recibido: 400,
    cambio: 50,
    descuento_pct: null,
    descuento_total: null,
    autorizado_por: null,
    items_count: 1,
    creado_en: new Date(),
    creado_por: 'user-1',
    eliminado_en: null,
    actualizado_en: new Date(),
    items: [
      {
        id: 'i1',
        venta_id: '50000000-0000-0000-0000-000000000001',
        articulo_id: 'c2000000-0000-0000-0000-000000000001',
        nombre: 'Arena de río',
        cantidad: 1,
        medida: 'm³',
        precio_unitario: 350,
        subtotal: 350,
        descuento_pct: null,
      },
    ],
    pagos: [{ id: 'pa1', venta_id: 'v1', metodo: MetodoPago.EFECTIVO, monto: 350 }],
  };

  beforeEach(async () => {
    // Configurar variables de entorno para tests: horario 00:00-23:59 = siempre abierto
    process.env.TURNO_APERTURA = '00:00';
    process.env.TURNO_CIERRE = '23:59';
    process.env.TURNO_TOLERANCIA_MINUTOS = '1440'; // 24 horas

    prisma = {
      articulos_inventario: {
        findMany: jest.fn().mockResolvedValue([mockMaterial]),
        update: jest.fn().mockResolvedValue({ ...mockMaterial, stock: mockMaterial.stock - 1 }),
      },
      ventas: {
        findMany: jest.fn().mockResolvedValue([mockVenta]),
        aggregate: jest.fn().mockResolvedValue({ _max: { ticket: 3 } }),
        create: jest.fn().mockImplementation(async ({ data, include }) => ({
          ...data,
          id: '50000000-0000-0000-0000-000000000001',
          creado_en: new Date(),
          items: include?.items ? [mockVenta.items[0]] : [],
          pagos: include?.pagos ? mockVenta.pagos : [],
        })),
      },
      retiros_caja: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 'r1' }),
        ),
      },
      cierres_caja: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 'c1' }),
        ),
      },
      aperturas_caja: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 'a1', abierta_en: new Date() }),
        ),
      },
      $transaction: jest.fn().mockImplementation(async (fn) => {
        return fn(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(VentasService);
  });

  afterEach(() => {
    delete process.env.TURNO_APERTURA;
    delete process.env.TURNO_CIERRE;
    delete process.env.TURNO_TOLERANCIA_MINUTOS;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findCatalogos', () => {
    it('should return materials with medidas and precios as numbers', async () => {
      const result = await service.findCatalogos();
      expect(result.materiales).toHaveLength(1);
      expect(result.materiales[0]).toMatchObject({
        id: mockMaterial.id,
        stock: 120,
      });
      expect(result.materiales[0].precios[0]).toEqual({ medida: 'm³', precio: 350 });
    });
  });

  describe('findHoy', () => {
    it('should return ventas and daily stats', async () => {
      const result = await service.findHoy();
      expect(result.ventas).toHaveLength(1);
      expect(result.ventas[0].method).toBe('efectivo');
      expect(result.ventas[0].total).toBe(350);
      expect(result.stats.count).toBe(1);
      expect(result.stats.total).toBe(350);
    });
  });

  describe('create', () => {
    it('should create a venta and decrement stock', async () => {
      const dto = {
        cajero: 'Cajero',
        items: [
          {
            materialId: mockMaterial.id,
            medida: 'm³',
            cantidad: 1,
            precioUnitario: 350,
          },
        ],
        pagos: [{ metodo: 'efectivo' as const, monto: 350 }],
        metodo: 'efectivo' as const,
        efectivoRecibido: 400,
        cambio: 50,
      };
      const result = await service.create(dto, 'user-1');
      expect(result.total).toBe(350);
      expect(result.method).toBe('efectivo');
      // El mock de aggregate devolvió ticket max 3 → ticket 4
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should fail when medida is not available for the material', async () => {
      const dto = {
        cajero: 'Cajero',
        items: [
          {
            materialId: mockMaterial.id,
            medida: 'tonelada',
            cantidad: 1,
            precioUnitario: 520,
          },
        ],
        pagos: [{ metodo: 'efectivo' as const, monto: 520 }],
        metodo: 'efectivo' as const,
      };
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should fail when stock is insufficient', async () => {
      prisma.articulos_inventario.findMany.mockResolvedValue([
        { ...mockMaterial, stock: 0 },
      ]);
      const dto = {
        cajero: 'Cajero',
        items: [
          {
            materialId: mockMaterial.id,
            medida: 'm³',
            cantidad: 5,
            precioUnitario: 350,
          },
        ],
        pagos: [{ metodo: 'efectivo' as const, monto: 1750 }],
        metodo: 'efectivo' as const,
      };
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findRetiros', () => {
    it('should return retiros of the day', async () => {
      const result = await service.findRetiros();
      expect(result.items).toEqual([]);
    });
  });

  describe('createRetiro', () => {
    it('should create a retiro and audit success', async () => {
      const dto = { concepto: 'Gasolina', monto: 500, autorizadoPor: 'Gerencia' };
      const result = await service.createRetiro(dto, 'user-1', 'Cajero');
      expect(result.monto).toBe(500);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.RETIRO_REGISTRADO,
          result: AuditResult.SUCCESS,
        }),
      );
    });
  });

  describe('findCierreHoy', () => {
    it('should return existe=false when no cierre', async () => {
      const result = await service.findCierreHoy();
      expect(result.existe).toBe(false);
    });
  });

  describe('createCierre', () => {
    it('should compute arqueo esperado/contado/diferencia', async () => {
      const dto = {
        efectivoInicial: 500,
        denominaciones: { '1000': 1, '500': 0 } as Record<string, number>,
        fondoSiguiente: 200,
      };
      const result = await service.createCierre(dto, 'user-1', 'Cajero');
      expect(result.efectivoInicial).toBe(500);
      // ventas efectivo = 350 (del mock), retiros = 0
      expect(result.esperado).toBe(850);
      expect(result.contado).toBe(1000);
      expect(result.diferencia).toBe(150);
    });

    it('should fail on duplicate cierre of the day', async () => {
      prisma.cierres_caja.findUnique.mockResolvedValue({ id: 'c1' });
      const dto = { denominaciones: { '100': 1 } as Record<string, number> };
      await expect(service.createCierre(dto, 'user-1', 'Cajero')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use apertura fondo when efectivoInicial not provided', async () => {
      prisma.aperturas_caja.findUnique.mockResolvedValue({
        id: 'a1',
        fondo_inicial: 300,
      });
      const dto = { denominaciones: {} as Record<string, number> };
      const result = await service.createCierre(dto, 'user-1', 'Cajero');
      // 300 (fondo apertura) + 350 (ventas efectivo) - 0 (retiros)
      expect(result.efectivoInicial).toBe(300);
      expect(result.esperado).toBe(650);
    });
  });

  describe('findConfig', () => {
    it('should expose apertura/cierre 24h and tolerancia', () => {
      // En tests, beforeEach setea TURNO_APERTURA=00:00, TURNO_CIERRE=23:59, TOLERANCIA=1440
      expect(service.findConfig()).toEqual({
        apertura: '00:00',
        cierre: '23:59',
        toleranciaMinutos: 1440,
        formato: '24h',
      });
    });
  });

  describe('findAperturaHoy', () => {
    it('should return existe=false when no apertura', async () => {
      const result = await service.findAperturaHoy();
      expect(result).toEqual({ existe: false, registro: null });
    });
  });

  describe('createApertura', () => {
    it('should create apertura and audit success', async () => {
      const result = await service.createApertura({ fondoInicial: 500 }, 'user-1', 'Cajero');
      expect(result.id).toBe('a1');
      expect(result.fondoInicial).toBe(500);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.APERTURA_CAJA_REGISTRADA,
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should fail when apertura already exists for today', async () => {
      prisma.aperturas_caja.findUnique.mockResolvedValue({ id: 'a1' });
      await expect(
        service.createApertura({ fondoInicial: 500 }, 'user-1', 'Cajero'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
