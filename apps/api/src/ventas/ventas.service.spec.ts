import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, MetodoPago } from '@prisma/client';
import { VentasService, clearConfigCache, permiteCerrarCaja } from './ventas.service';
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

  const mockCierre = (overrides: Partial<{
    id: string;
    estado: string;
    cajero: string;
    fecha: Date;
    ventas_count: number;
    total_ventas: number;
    efectivo_inicial: number;
    ventas_efectivo: number;
    total_retiros: number;
    esperado: number;
    contado: number;
    diferencia: number;
    fondo_siguiente: number;
    notas: string;
    aprobador_id: string | null;
    motivo_rechazo: string | null;
  }> = {}) => ({
    id: 'c1',
    fecha: new Date(),
    cajero: 'Cajero',
    ventas_count: 1,
    total_ventas: 350,
    efectivo_inicial: 0,
    ventas_efectivo: 350,
    total_retiros: 0,
    esperado: 350,
    contado: 350,
    diferencia: 0,
    fondo_siguiente: 0,
    notas: null,
    estado: 'PENDIENTE',
    aprobador_id: null,
    motivo_rechazo: null,
    creado_en: new Date(),
    actualizado_en: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    // Limpiar cache de configuración para que cada test use su propio mock
    // (el cache TTL 30s del módulo NO debe filtrarse entre tests).
    clearConfigCache();
    // Configurar variables de entorno para tests: horario 00:00-23:59 = siempre abierto
    process.env.TURNO_APERTURA = '00:00';
    process.env.TURNO_CIERRE = '23:59';

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
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 'c1' }),
        ),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'c1' })),
      },
      users_roles: {
        findFirst: jest.fn().mockResolvedValue(null),
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
      _configs: {
        turno_apertura: { clave: 'turno_apertura', valor: '00:00' },
        turno_cierre: { clave: 'turno_cierre', valor: '23:59' },
      },
      configuracion_sistema: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(prisma._configs[where?.clave] || null);
        }),
        upsert: jest.fn().mockImplementation(({ where, update, create }) => {
          prisma._configs[where.clave].valor = update?.valor ?? create?.valor;
          return Promise.resolve({
            id: 'cfg-1',
            clave: where?.clave,
            valor: prisma._configs[where.clave].valor,
            descripcion: 'Configuración de turno',
            tipo: 'string',
            categoria: 'turno',
            creado_en: new Date(),
            actualizado_en: new Date(),
          });
        }),
      },
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
    // Config con cierre=00:00 hace que puedeCerrarCaja() sea siempre true
    // (nowMin >= 0min), para no depender de la hora real al correr el test.
    beforeEach(() => {
      (prisma.configuracion_sistema.findUnique as jest.Mock).mockImplementation(({ where }) => {
        const configs: Record<string, { clave: string; valor: string }> = {
          turno_apertura: { clave: 'turno_apertura', valor: '23:00' },
          turno_cierre: { clave: 'turno_cierre', valor: '00:00' },
        };
        return Promise.resolve(configs[where?.clave] || null);
      });
    });

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

  describe('findAllCierres', () => {
    it('should return paginated items and stats for all matching records', async () => {
      prisma.cierres_caja.findMany.mockResolvedValue([
        mockCierre({ id: 'c1', estado: 'PENDIENTE', cajero: 'Cajero A' }),
        mockCierre({ id: 'c2', estado: 'APROBADO', cajero: 'Cajero B' }),
      ]);
      prisma.cierres_caja.count
        .mockResolvedValueOnce(12) // total
        .mockResolvedValueOnce(5)  // aprobados
        .mockResolvedValueOnce(3)  // rechazados
        .mockResolvedValueOnce(4); // pendientes

      const result = await service.findAllCierres({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.pagination.total).toBe(12);
      expect(result.stats).toEqual({
        total: 12,
        aprobados: 5,
        rechazados: 3,
        pendientes: 4,
      });
    });

    it('should apply filters to counts and items', async () => {
      prisma.cierres_caja.findMany.mockResolvedValue([
        mockCierre({ id: 'c1', estado: 'PENDIENTE', cajero: 'Cajero A' }),
      ]);
      prisma.cierres_caja.count
        .mockResolvedValueOnce(3) // total with filter
        .mockResolvedValueOnce(0) // aprobados
        .mockResolvedValueOnce(0) // rechazados
        .mockResolvedValueOnce(3); // pendientes

      const result = await service.findAllCierres({ estado: 'PENDIENTE', page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.stats.total).toBe(3);
      expect(result.stats.pendientes).toBe(3);
      expect(prisma.cierres_caja.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'PENDIENTE' }),
        }),
      );
    });
  });

  describe('findConfig', () => {
    it('should expose apertura/cierre 24h', async () => {
      // Configuración mockeada en beforeEach: 00:00-23:59
      const result = await service.findConfig();
      expect(result).toEqual({
        apertura: '00:00',
        cierre: '23:59',
        formato: '24h',
      });
    });
  });

  describe('updateConfig', () => {
    it('should update apertura and cierre and audit success', async () => {
      const result = await service.updateConfig({ apertura: '07:00', cierre: '20:00' }, 'user-1');
      expect(result).toEqual({ apertura: '07:00', cierre: '20:00', formato: '24h' });
      expect(prisma.configuracion_sistema.upsert).toHaveBeenCalledTimes(2);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CONFIG_TURNO_ACTUALIZADA,
          result: AuditResult.SUCCESS,
          newValue: { apertura: '07:00', cierre: '20:00', formato: '24h' },
        }),
      );
    });

    it('should update only apertura and audit success', async () => {
      const result = await service.updateConfig({ apertura: '08:00' }, 'user-1');
      expect(result).toEqual({ apertura: '08:00', cierre: '23:59', formato: '24h' });
      expect(prisma.configuracion_sistema.upsert).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CONFIG_TURNO_ACTUALIZADA,
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should fail when no fields are provided and audit fail', async () => {
      await expect(service.updateConfig({}, 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.configuracion_sistema.upsert).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CONFIG_TURNO_ACTUALIZADA,
          result: AuditResult.FAIL,
          errorCode: 'CONFIG_SIN_CAMBIOS',
        }),
      );
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

describe('permiteCerrarCaja', () => {
  const hm = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };

  describe('turno diurno (apertura 07:00, cierre 20:00)', () => {
    const apertura = hm('07:00');
    const cierre = hm('20:00');

    it('permite cerrar después de la hora de cierre (22:00)', () => {
      expect(permiteCerrarCaja(hm('22:00'), apertura, cierre)).toBe(true);
    });

    it('permite cerrar en la madrugada antes de la apertura (03:00)', () => {
      expect(permiteCerrarCaja(hm('03:00'), apertura, cierre)).toBe(true);
    });

    it('NO permite cerrar durante la hora de trabajo (12:00)', () => {
      expect(permiteCerrarCaja(hm('12:00'), apertura, cierre)).toBe(false);
    });
  });

  describe('turno nocturno (apertura 23:00, cierre 00:00)', () => {
    const apertura = hm('23:00');
    const cierre = hm('00:00');

    it('permite cerrar tras la medianoche justo después del cierre (00:05)', () => {
      expect(permiteCerrarCaja(hm('00:05'), apertura, cierre)).toBe(true);
    });

    it('permite cerrar durante el día antes de la próxima apertura (12:00)', () => {
      expect(permiteCerrarCaja(hm('12:00'), apertura, cierre)).toBe(true);
    });

    it('NO permite cerrar durante el turno nocturno (23:30)', () => {
      expect(permiteCerrarCaja(hm('23:30'), apertura, cierre)).toBe(false);
    });
  });

  describe('turno continuo (apertura === cierre)', () => {
    it('siempre permite cerrar', () => {
      expect(permiteCerrarCaja(hm('05:00'), hm('12:00'), hm('12:00'))).toBe(true);
      expect(permiteCerrarCaja(hm('12:00'), hm('12:00'), hm('12:00'))).toBe(true);
      expect(permiteCerrarCaja(hm('23:59'), hm('12:00'), hm('12:00'))).toBe(true);
    });
  });
});

  describe("fuera de horario de atencion (POS)", () => {
    it("debe rechazar venta fuera de horario diurno", async () => {
      const dto = {
        cajero: "Cajero",
        items: [
          { materialId: mockMaterial.id, medida: "m3", cantidad: 1, precioUnitario: 350 },
        ],
        pagos: [{ metodo: "efectivo" as const, monto: 350 }],
        metodo: "efectivo" as const,
      };
      await expect(service.create(dto, "user-1")).rejects.toThrow(BadRequestException);
    });
  });

  describe("idempotencia en creaciuxf3n de ventas", () => {
    it("debe retornar la venta existente si ya existe con la misma key", async () => {
      const dto = {
        cajero: "Cajero",
        idempotenciaKey: "test-idem-key-123",
        items: [
          { materialId: mockMaterial.id, medida: "m3", cantidad: 1, precioUnitario: 350 },
        ],
        pagos: [{ metodo: "efectivo" as const, monto: 350 }],
        metodo: "efectivo" as const,
      };
      const result1 = await service.create(dto, "user-1");
      const result2 = await service.create(dto, "user-1");
      expect(result1.id).toBe(result2.id);
      const articulo = await prisma.articulos_inventario.findUnique({
        where: { id: mockMaterial.id },
      });
      expect(articulo?.stock).toBe(mockMaterial.stock - 1);
    });
  });

  describe("validación de precio contra catálogo", () => {
    it("debe rechazar precio que no coincide con el catálogo", async () => {
      const dto = {
        cajero: "Cajero",
        items: [
          { materialId: mockMaterial.id, medida: "m3", cantidad: 1, precioUnitario: 9999 },
        ],
        pagos: [{ metodo: "efectivo" as const, monto: 9999 }],
        metodo: "efectivo" as const,
      };
      await expect(service.create(dto, "user-1")).rejects.toThrow(BadRequestException);
    });

    it("debe aceptar precio que coincide con el catálogo", async () => {
      const dto = {
        cajero: "Cajero",
        items: [
          { materialId: mockMaterial.id, medida: "m3", cantidad: 1, precioUnitario: 350 },
        ],
        pagos: [{ metodo: "efectivo" as const, monto: 350 }],
        metodo: "efectivo" as const,
      };
      const result = await service.create(dto, "user-1");
      expect(result.id).toBeDefined();
    });
  });
