import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult } from '@prisma/client';
import { FacturasService } from './facturas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('FacturasService', () => {
  let service: FacturasService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const USER_ID = 'c0000000-0000-0000-0000-000000000001';
  const CLIENTE_ID = 'b0000000-0000-0000-0000-000000000001';
  const FACTURA_ID = 'e0000000-0000-0000-0000-000000000001';
  const CONCEPTO_ID = 'e0000000-0000-0000-0000-000000000002';

  const mockCliente = { id: CLIENTE_ID, nombre: 'Cliente Beta', empresa: 'Beta SA', rfc: 'X', activo: true, eliminado_en: null };

  const mockFactura = {
    id: FACTURA_ID,
    codigo: 'FAC-2026-0001',
    serie: 'F',
    folio: '000001',
    cliente_id: CLIENTE_ID,
    cotizacion_id: null,
    subtotal: 1000,
    impuestos: 160,
    total: 1160,
    moneda: 'MXN',
    tipo_cambio: 1,
    forma_pago: 'PAGO_EN_UNA_SOLA_EXHIBICION',
    metodo_pago: 'PPD',
    uso_cfdi: 'G03',
    estado: 'PENDIENTE',
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    clientes: mockCliente,
    cotizaciones: null,
    factura_conceptos: [],
    cuentas_por_cobrar: null,
  };

  const mockConcepto = {
    id: CONCEPTO_ID,
    factura_id: FACTURA_ID,
    cantidad: 1,
    unidad: 'pza',
    descripcion: 'Servicio',
    valor_unitario: 1000,
    importe: 1000,
    descuento: 0,
    objeto_impuesto: '04',
    impuesto_tasa: 0.16,
    impuesto_importe: 160,
    activo: true,
  };

  // $transaction con callback: delega en los mismos mocks de prisma.
  const runTx = jest.fn((cb: (tx: never) => Promise<unknown>) => cb(prisma as never));

  beforeEach(async () => {
    prisma = {
      clientes: { findFirst: jest.fn() },
      facturas: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      factura_conceptos: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: runTx,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacturasService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(FacturasService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('devuelve items paginados y aplica filtros', async () => {
      prisma.facturas.findMany.mockResolvedValue([mockFactura]);
      prisma.facturas.count.mockResolvedValue(1);

      const result = await service.findAll({ estado: 'PENDIENTE', page: 1, limit: 10 });

      expect(prisma.facturas.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activo: true, estado: 'PENDIENTE' }),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      );
      expect(result.items[0]).toEqual(expect.objectContaining({ id: FACTURA_ID, total: 1160 }));
    });
  });

  describe('findOne', () => {
    it('serializa la factura encontrada', async () => {
      prisma.facturas.findFirst.mockResolvedValue(mockFactura);
      const result = await service.findOne(FACTURA_ID);
      expect(result).toEqual(expect.objectContaining({ id: FACTURA_ID, total: 1160 }));
    });

    it('audita FAIL y lanza NotFound si no existe', async () => {
      prisma.facturas.findFirst.mockResolvedValue(null);
      await expect(service.findOne(FACTURA_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.FACTURA_ACTUALIZADA,
          result: AuditResult.FAIL,
          errorCode: 'FACTURA_NO_ENCONTRADA',
        }),
      );
    });
  });

  describe('create', () => {
    const dto = {
      clienteId: CLIENTE_ID,
      conceptos: [{ cantidad: 2, unidad: 'pza', descripcion: 'Servicio', valorUnitario: 500 }],
    };

    it('lanza NotFound si el cliente no existe', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(service.create(dto as never, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_CREADA, errorCode: 'CLIENTE_NO_ENCONTRADO' }),
      );
    });

    it('rechaza factura sin conceptos', async () => {
      prisma.clientes.findFirst.mockResolvedValue(mockCliente);
      await expect(
        service.create({ clienteId: CLIENTE_ID, conceptos: [] } as never, USER_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('crea la factura, calcula IVA y audita FACTURA_CREADA SUCCESS', async () => {
      prisma.clientes.findFirst.mockResolvedValue(mockCliente);
      prisma.facturas.count.mockResolvedValue(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.facturas.create.mockImplementation(async ({ data }: any) => ({
        ...mockFactura,
        ...data,
        id: FACTURA_ID,
        cotizacion_id: data.cotizacion_id ?? null,
        timbrado_en: null,
      }));
      prisma.facturas.findFirst.mockResolvedValue({ ...mockFactura, factura_conceptos: [mockConcepto] });

      const result = await service.create(dto as never, USER_ID);

      expect(prisma.facturas.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cliente_id: CLIENTE_ID,
            estado: 'PENDIENTE',
            subtotal: 1000,
            impuestos: 160,
            total: 1160,
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.FACTURA_CREADA,
          result: AuditResult.SUCCESS,
          entityId: FACTURA_ID,
        }),
      );
      expect(result.total).toBe(1160);
    });
  });

  describe('update', () => {
    it('lanza Conflict si la factura no está PENDIENTE', async () => {
      prisma.facturas.findFirst.mockResolvedValue({ ...mockFactura, estado: 'TIMBRADA' });
      await expect(service.update(FACTURA_ID, { usoCfdi: 'G01' }, USER_ID)).rejects.toBeInstanceOf(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_ACTUALIZADA, errorCode: 'FACTURA_NO_EDITABLE' }),
      );
    });

    it('actualiza y audita FACTURA_ACTUALIZADA SUCCESS', async () => {
      prisma.facturas.findFirst
        .mockResolvedValueOnce(mockFactura) // validación
        .mockResolvedValueOnce({ ...mockFactura, uso_cfdi: 'G01' }); // findOne posterior
      prisma.facturas.update.mockResolvedValue({ ...mockFactura, uso_cfdi: 'G01' });

      const result = await service.update(FACTURA_ID, { usoCfdi: 'G01' }, USER_ID);

      expect(prisma.facturas.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ uso_cfdi: 'G01' }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.FACTURA_ACTUALIZADA,
          result: AuditResult.SUCCESS,
          entityId: FACTURA_ID,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('lanza Conflict si la factura tiene CxC asociada', async () => {
      prisma.facturas.findFirst.mockResolvedValue({
        ...mockFactura,
        cuentas_por_cobrar: { id: 'cxc-1' },
      });
      await expect(service.remove(FACTURA_ID, USER_ID)).rejects.toBeInstanceOf(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_CANCELADA, errorCode: 'FACTURA_CON_CXC' }),
      );
    });

    it('marca activo=false y audita FACTURA_CANCELADA', async () => {
      prisma.facturas.findFirst.mockResolvedValue(mockFactura); // validación con CxC null
      prisma.facturas.update.mockResolvedValue({ ...mockFactura, activo: false });

      const result = await service.remove(FACTURA_ID, USER_ID);

      expect(prisma.facturas.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ activo: false }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_CANCELADA, result: AuditResult.SUCCESS }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('cambiarEstado', () => {
    it('timbra PENDIENTE → TIMBRADA y audita FACTURA_TIMBRADA', async () => {
      prisma.facturas.findFirst
        .mockResolvedValueOnce(mockFactura) // validación
        .mockResolvedValueOnce({ ...mockFactura, estado: 'TIMBRADA', timbrado_en: new Date() }); // findOne
      prisma.facturas.update.mockResolvedValue({ ...mockFactura, estado: 'TIMBRADA', timbrado_en: new Date() });

      const result = await service.cambiarEstado(FACTURA_ID, { estado: 'TIMBRADA' }, USER_ID);

      expect(prisma.facturas.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'TIMBRADA' }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_TIMBRADA, result: AuditResult.SUCCESS }),
      );
      expect(result).toBeDefined();
    });

    it('no permite timbrar una factura ya timbrada', async () => {
      prisma.facturas.findFirst.mockResolvedValue({ ...mockFactura, estado: 'TIMBRADA' });
      await expect(
        service.cambiarEstado(FACTURA_ID, { estado: 'TIMBRADA' }, USER_ID),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_TIMBRADA, errorCode: 'FACTURA_NO_TIMBRABLE' }),
      );
    });

    it('requiere motivo al cancelar', async () => {
      prisma.facturas.findFirst.mockResolvedValue(mockFactura);
      await expect(
        service.cambiarEstado(FACTURA_ID, { estado: 'CANCELADA' }, USER_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('agregarConcepto', () => {
    it('recusa factura no editable', async () => {
      prisma.facturas.findFirst.mockResolvedValue({ ...mockFactura, estado: 'TIMBRADA' });
      await expect(
        service.agregarConcepto(FACTURA_ID, { cantidad: 1, unidad: 'pza', descripcion: 'X', valorUnitario: 100 }, USER_ID),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_ACTUALIZADA, errorCode: 'FACTURA_NO_EDITABLE' }),
      );
    });

    it('agrega el concepto, recalcula y audita', async () => {
      prisma.facturas.findFirst
        .mockResolvedValueOnce(mockFactura) // validación editable
        .mockResolvedValueOnce({ ...mockFactura, factura_conceptos: [mockConcepto] }); // findOne
      prisma.factura_conceptos.create.mockResolvedValue(mockConcepto);
      prisma.factura_conceptos.findMany.mockResolvedValue([mockConcepto]);
      prisma.facturas.update.mockResolvedValue({ ...mockFactura, total: 1160 });

      const result = await service.agregarConcepto(
        FACTURA_ID,
        { cantidad: 1, unidad: 'pza', descripcion: 'Servicio', valorUnitario: 1000 },
        USER_ID,
      );

      expect(prisma.factura_conceptos.create).toHaveBeenCalled();
      expect(prisma.facturas.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ total: 1160 }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.FACTURA_ACTUALIZADA, result: AuditResult.SUCCESS }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('eliminarConcepto', () => {
    it('elimina (soft) el concepto y recalcula', async () => {
      prisma.facturas.findFirst
        .mockResolvedValueOnce(mockFactura) // validación editable
        .mockResolvedValueOnce({ ...mockFactura, factura_conceptos: [] }); // findOne
      prisma.factura_conceptos.findFirst.mockResolvedValue(mockConcepto);
      prisma.factura_conceptos.update.mockResolvedValue({ ...mockConcepto, activo: false });
      prisma.factura_conceptos.findMany.mockResolvedValue([]);
      prisma.facturas.update.mockResolvedValue({ ...mockFactura, total: 0 });

      const result = await service.eliminarConcepto(FACTURA_ID, CONCEPTO_ID, USER_ID);

      expect(prisma.factura_conceptos.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ activo: false }) }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('stats', () => {
    it('devuelve totales por estado y total facturado', async () => {
      prisma.facturas.count.mockResolvedValue(10);
      prisma.facturas.groupBy.mockResolvedValue([
        { estado: 'PENDIENTE', _count: { _all: 6 } },
        { estado: 'TIMBRADA', _count: { _all: 3 } },
        { estado: 'CANCELADA', _count: { _all: 1 } },
      ]);
      prisma.facturas.aggregate.mockResolvedValue({ _sum: { total: 50000 } });

      const result = await service.stats();

      expect(result).toEqual({
        total: 10,
        pendientes: 6,
        timbradas: 3,
        canceladas: 1,
        montoTotal: 50000,
      });
      expect(prisma.facturas.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: { in: ['TIMBRADA', 'PAGADA'] } }),
        }),
      );
    });
  });

  describe('exportar', () => {
    it('genera CSV con BOM y encabezados aplicando filtros', async () => {
      prisma.facturas.findMany.mockResolvedValue([mockFactura]);

      const csv = await service.exportar({ search: 'Beta' });

      expect(csv.startsWith('\ufeffCodigo,Serie,Folio,Cliente,RFC,FechaEmision,Subtotal,Impuestos,Total,Estado')).toBe(true);
      expect(csv).toContain('FAC-2026-0001');
      expect(csv).toContain(',1160,PENDIENTE');
      expect(prisma.facturas.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
      );
    });
  });
});