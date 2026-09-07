import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult } from '@prisma/client';
import { CobranzaService } from './cobranza.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CobranzaService', () => {
  let service: CobranzaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const USER_ID = 'a0000000-0000-0000-0000-000000000099';
  const CLIENTE_ID = 'b0000000-0000-0000-0000-000000000001';
  const CUENTA_ID = 'c1000000-0000-0000-0000-000000000001';
  const PAGO_ID = 'd1000000-0000-0000-0000-000000000001';

  const mockCliente = {
    id: CLIENTE_ID,
    nombre: 'Constructora Beta',
    empresa: 'Beta SA de CV',
    activo: true,
    eliminado_en: null,
  };

  const mockCuenta = {
    id: CUENTA_ID,
    cliente_id: CLIENTE_ID,
    factura_id: null,
    monto: 1000,
    monto_pagado: 0,
    fecha_vencimiento: new Date('2026-10-01'),
    estado: 'PENDIENTE',
    activo: true,
    creado_en: new Date('2026-09-01'),
    actualizado_en: new Date(),
    clientes: { id: CLIENTE_ID, nombre: 'Constructora Beta', empresa: 'Beta SA de CV' },
    facturas: null,
    pagos: [],
  };

  const mockPago = {
    id: PAGO_ID,
    codigo: 'PAG-CXC-2026-001',
    cuenta_por_cobrar_id: CUENTA_ID,
    cliente_id: CLIENTE_ID,
    factura_id: null,
    monto: 400,
    fecha_pago: new Date('2026-09-02'),
    metodo_pago: 'TRANSFERENCIA',
    referencia: 'REF-001',
    estado: 'CONFIRMADO',
    activo: true,
    clientes: { empresa: 'Beta SA de CV' },
    creado_en: new Date(),
    creado_por: USER_ID,
  };

  // $transaction con callback: delega en los mismos mocks de prisma.
  const runTx = jest.fn((cb: (tx: never) => Promise<unknown>) => cb(prisma as never));

  beforeEach(async () => {
    prisma = {
      cuentas_por_cobrar: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      clientes: { findFirst: jest.fn() },
      facturas: { findFirst: jest.fn(), updateMany: jest.fn() },
      pagos: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      transacciones: { create: jest.fn() },
      $transaction: runTx,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CobranzaService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(CobranzaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('devuelve items paginados y aplica filtros', async () => {
      prisma.cuentas_por_cobrar.findMany.mockResolvedValue([mockCuenta]);
      prisma.cuentas_por_cobrar.count.mockResolvedValue(1);

      const result = await service.findAll({ estado: 'PENDIENTE', page: 1, limit: 10 });

      expect(prisma.cuentas_por_cobrar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activo: true, estado: 'PENDIENTE' }),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      );
      expect(result.items[0]).toEqual(
        expect.objectContaining({ id: CUENTA_ID, saldo: 1000, situacion: 'AL_CORRIENTE' }),
      );
    });

    it('filtra por ATRASO_GRAVE con vencimiento hace 30+ días', async () => {
      prisma.cuentas_por_cobrar.findMany.mockResolvedValue([]);
      prisma.cuentas_por_cobrar.count.mockResolvedValue(0);
      const hace40 = new Date();
      hace40.setDate(hace40.getDate() - 40);
      const vencida = { ...mockCuenta, fecha_vencimiento: hace40, estado: 'PENDIENTE' };
      prisma.cuentas_por_cobrar.findMany.mockResolvedValue([vencida]);

      const result = await service.findAll({ situacion: 'ATRASO_GRAVE' });

      expect(prisma.cuentas_por_cobrar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: { not: 'PAGADO' } }),
        }),
      );
      expect(result.items[0].situacion).toBe('ATRASO_GRAVE');
    });
  });

  describe('findOne', () => {
    it('serializa la cuenta encontrada', async () => {
      prisma.cuentas_por_cobrar.findFirst.mockResolvedValue(mockCuenta);
      const result = await service.findOne(CUENTA_ID);
      expect(result).toEqual(expect.objectContaining({ id: CUENTA_ID, saldo: 1000 }));
    });

    it('audita FAIL y lanza NotFound si no existe', async () => {
      prisma.cuentas_por_cobrar.findFirst.mockResolvedValue(null);
      await expect(service.findOne(CUENTA_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CXC_CONSULTADA,
          result: AuditResult.FAIL,
          errorCode: 'CUENTA_NO_ENCONTRADA',
        }),
      );
    });
  });

  describe('crearCuenta', () => {
    it('lanza NotFound si el cliente no existe', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(
        service.crearCuenta({ clienteId: CLIENTE_ID, monto: 500 }, USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CXC_CREADA, errorCode: 'CLIENTE_NO_ENCONTRADO' }),
      );
    });

    it('rechaza factura con CxC ya asociada', async () => {
      const facturaId = 'f0000000-0000-0000-0000-000000000001';
      prisma.clientes.findFirst.mockResolvedValue(mockCliente);
      prisma.facturas.findFirst.mockResolvedValue({ id: facturaId, cliente_id: CLIENTE_ID });
      prisma.cuentas_por_cobrar.findUnique.mockResolvedValue({ id: 'otra' });

      await expect(
        service.crearCuenta({ clienteId: CLIENTE_ID, facturaId, monto: 500 }, USER_ID),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'FACTURA_YA_EN_CXC' }),
      );
    });

    it('crea la cuenta y audita CXC_CREADA SUCCESS', async () => {
      prisma.clientes.findFirst.mockResolvedValue(mockCliente);
      prisma.cuentas_por_cobrar.create.mockResolvedValue(mockCuenta);

      const result = await service.crearCuenta(
        { clienteId: CLIENTE_ID, monto: 1000, fechaVencimiento: '2026-10-01' },
        USER_ID,
      );

      expect(prisma.cuentas_por_cobrar.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cliente_id: CLIENTE_ID, estado: 'PENDIENTE' }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CXC_CREADA,
          result: AuditResult.SUCCESS,
          entityId: CUENTA_ID,
        }),
      );
      expect(result.saldo).toBe(1000);
    });
  });

  describe('actualizarCuenta', () => {
    it('lanza Conflict si la cuenta ya tiene cobros', async () => {
      prisma.cuentas_por_cobrar.findFirst.mockResolvedValue(mockCuenta);
      prisma.pagos.count.mockResolvedValue(1);

      await expect(
        service.actualizarCuenta(CUENTA_ID, { monto: 2000 }, USER_ID),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CXC_ACTUALIZADA, errorCode: 'CXC_CON_PAGOS' }),
      );
    });

    it('actualiza y audita CXC_ACTUALIZADA SUCCESS', async () => {
      prisma.cuentas_por_cobrar.findFirst.mockResolvedValue(mockCuenta);
      prisma.pagos.count.mockResolvedValue(0);
      prisma.cuentas_por_cobrar.update.mockResolvedValue({ ...mockCuenta, monto: 2000 });

      const result = await service.actualizarCuenta(CUENTA_ID, { monto: 2000 }, USER_ID);

      expect(prisma.cuentas_por_cobrar.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ monto: 2000 }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CXC_ACTUALIZADA,
          result: AuditResult.SUCCESS,
          entityId: CUENTA_ID,
        }),
      );
      expect(result.monto).toBe(2000);
    });
  });

  describe('registrarCobro', () => {
    it('rechaza cobro que excede el saldo', async () => {
      prisma.cuentas_por_cobrar.findFirst.mockResolvedValue(mockCuenta);

      await expect(
        service.registrarCobro(CUENTA_ID, { monto: 9999, metodoPago: 'EFECTIVO' }, USER_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COBRO_REGISTRADO,
          result: AuditResult.FAIL,
          errorCode: 'COBRO_EXCEDE_SALDO',
        }),
      );
    });

    it('registra pago + ingreso en finanzas y audita COBRO_REGISTRADO', async () => {
      prisma.cuentas_por_cobrar.findFirst
        .mockResolvedValueOnce(mockCuenta) // validación
        .mockResolvedValueOnce({ ...mockCuenta, monto_pagado: 400, estado: 'PARCIAL', pagos: [{ fecha_pago: new Date('2026-09-02') }] });
      prisma.pagos.create.mockResolvedValue(mockPago);
      prisma.transacciones.create.mockResolvedValue({});
      prisma.cuentas_por_cobrar.update.mockResolvedValue({});

      const result = await service.registrarCobro(
        CUENTA_ID,
        { monto: 400, metodoPago: 'TRANSFERENCIA', referencia: 'REF-001' },
        USER_ID,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.pagos.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cuenta_por_cobrar_id: CUENTA_ID,
            estado: 'CONFIRMADO',
            monto: 400,
          }),
        }),
      );
      expect(prisma.transacciones.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'INGRESO',
            categoria: 'COBRANZA',
            entidad_tipo: 'COBRO',
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COBRO_REGISTRADO,
          result: AuditResult.SUCCESS,
          entityType: 'pagos',
        }),
      );
      expect(mockAudit.log.mock.calls[0][0].entityId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.cobro.monto).toBe(400);
      expect(result.cuenta.estado).toBe('PARCIAL');
    });

    it('salda la factura asociada a PAGADA cuando la CxC queda liquidada', async () => {
      const FACTURA_ID = 'e0000000-0000-0000-0000-000000000001';
      const cuentaConFactura = { ...mockCuenta, factura_id: FACTURA_ID };
      prisma.cuentas_por_cobrar.findFirst
        .mockResolvedValueOnce(cuentaConFactura) // validación
        .mockResolvedValueOnce({
          ...cuentaConFactura,
          monto_pagado: 1000,
          estado: 'PAGADO',
          pagos: [{ fecha_pago: new Date('2026-09-02') }],
        });
      prisma.pagos.create.mockResolvedValue(mockPago);
      prisma.transacciones.create.mockResolvedValue({});
      prisma.cuentas_por_cobrar.update.mockResolvedValue({});
      prisma.facturas.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.registrarCobro(
        CUENTA_ID,
        { monto: 1000, metodoPago: 'TRANSFERENCIA' },
        USER_ID,
      );

      expect(prisma.facturas.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: FACTURA_ID, estado: 'TIMBRADA' }),
          data: expect.objectContaining({ estado: 'PAGADA' }),
        }),
      );
      expect(result.cuenta.estado).toBe('SALDADO');
    });
  });

  describe('cobrosDeCuenta', () => {
    it('lanza NotFound si la cuenta no existe', async () => {
      prisma.cuentas_por_cobrar.findFirst.mockResolvedValue(null);
      await expect(service.cobrosDeCuenta(CUENTA_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CXC_CONSULTADA, errorCode: 'CUENTA_NO_ENCONTRADA' }),
      );
    });

    it('devuelve los cobros y el saldo restante', async () => {
      prisma.cuentas_por_cobrar.findFirst.mockResolvedValue(mockCuenta);
      prisma.pagos.findMany.mockResolvedValue([mockPago]);

      const result = await service.cobrosDeCuenta(CUENTA_ID);

      expect(result.cobros).toHaveLength(1);
      expect(result.cobros[0]).toEqual(expect.objectContaining({ monto: 400, metodoPago: 'TRANSFERENCIA' }));
      expect(result.saldo).toBe(1000);
    });
  });

  describe('cobrosAll', () => {
    it('devuelve cobros globales paginados y serializados', async () => {
      prisma.pagos.findMany.mockResolvedValue([mockPago]);
      prisma.pagos.count.mockResolvedValue(1);

      const result = await service.cobrosAll({ metodoPago: 'TRANSFERENCIA', page: 1, limit: 10 });

      expect(prisma.pagos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            activo: true,
            cuenta_por_cobrar_id: { not: null },
            metodo_pago: 'TRANSFERENCIA',
          }),
        }),
      );
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: PAGO_ID,
          cuentaId: CUENTA_ID,
          clienteNombre: 'Beta SA de CV',
          monto: 400,
          metodoPago: 'TRANSFERENCIA',
        }),
      );
      expect(result.items[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('filtra por búsqueda sobre el cliente', async () => {
      prisma.pagos.findMany.mockResolvedValue([]);
      prisma.pagos.count.mockResolvedValue(0);

      await service.cobrosAll({ search: 'Beta' });

      expect(prisma.pagos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientes: { OR: expect.any(Array) },
          }),
        }),
      );
    });
  });

  describe('vencimientos', () => {
    it('devuelve solo cuentas con saldo pendiente ordenadas por vencimiento', async () => {
      const vencida = {
        ...mockCuenta,
        fecha_vencimiento: new Date('2026-08-15'),
        monto_pagado: 200,
        clientes: { id: CLIENTE_ID, nombre: 'Constructora Beta', empresa: 'Beta SA de CV' },
      };
      prisma.cuentas_por_cobrar.findMany.mockResolvedValue([vencida]);
      prisma.cuentas_por_cobrar.count.mockResolvedValue(1);

      const result = await service.vencimientos({ page: 1, limit: 10 });

      expect(prisma.cuentas_por_cobrar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: { not: 'PAGADO' } }),
          orderBy: expect.arrayContaining([{ fecha_vencimiento: 'asc' }]),
        }),
      );
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: CUENTA_ID,
          cuentaId: CUENTA_ID,
          clienteNombre: 'Beta SA de CV',
          monto: 800,
          fechaVencimiento: '2026-08-15',
        }),
      );
      expect(result.pagination.total).toBe(1);
    });

    it('aplica rango vencido (fecha < hoy) y por vencer (fecha >= hoy)', async () => {
      prisma.cuentas_por_cobrar.findMany.mockResolvedValue([]);
      prisma.cuentas_por_cobrar.count.mockResolvedValue(0);

      await service.vencimientos({ rango: 'vencido', page: 1, limit: 10 });
      const callVencido = prisma.cuentas_por_cobrar.findMany.mock.calls.at(-1)[0];
      expect(callVencido.where.fecha_vencimiento).toEqual(
        expect.objectContaining({ lt: expect.any(Date) }),
      );

      await service.vencimientos({ rango: 'por_vencer', page: 1, limit: 10 });
      const callPorVencer = prisma.cuentas_por_cobrar.findMany.mock.calls.at(-1)[0];
      expect(callPorVencer.where.fecha_vencimiento).toEqual(
        expect.objectContaining({ gte: expect.any(Date) }),
      );
    });
  });

  describe('stats', () => {
    it('calcula total, vencido, cobrado del mes y clientes con saldo', async () => {
      prisma.cuentas_por_cobrar.aggregate
        .mockResolvedValueOnce({ _sum: { monto: 10000, monto_pagado: 2000 } }) // total
        .mockResolvedValueOnce({ _sum: { monto: 3000, monto_pagado: 0 } }); // vencido
      prisma.pagos.aggregate.mockResolvedValueOnce({ _sum: { monto: 500 } }); // cobradoMes
      prisma.cuentas_por_cobrar.findMany.mockResolvedValue([
        { cliente_id: CLIENTE_ID, monto: 1000, monto_pagado: 400 },
        { cliente_id: CLIENTE_ID, monto: 500, monto_pagado: 500 },
      ]);

      const result = await service.stats();

      expect(result).toEqual({
        totalPorCobrar: 8000,
        vencido: 3000,
        cobradoMes: 500,
        clientesConSaldo: 1,
      });
    });
  });

  describe('exportar', () => {
    it('genera CSV con BOM y encabezados', async () => {
      prisma.cuentas_por_cobrar.findMany.mockResolvedValue([mockCuenta]);

      const result = await service.exportar({});

      expect(result.startsWith('\uFEFF"ID","Cliente"')).toBe(true);
      expect(result).toContain('Constructora Beta');
      expect(result).not.toContain('ATRASO_GRAVE"');
    });
  });
});