import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, EstadoOrdenCompra, Prisma } from '@prisma/client';
import { ProveedoresService } from './proveedores.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ProveedoresService', () => {
  let service: ProveedoresService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const USER_ID = 'a0000000-0000-0000-0000-000000000099';

  const mockProveedor = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: null,
    nombre: 'Ferretería El Tornillo',
    rfc: 'TOR890101ABC',
    correo: 'ventas@tornillo.mx',
    telefono: '55-1111-2222',
    categoria: 'Materiales',
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: USER_ID,
    actualizado_por: USER_ID,
    eliminado_en: null,
  };

  const mockOrden = {
    id: '660e8400-e29b-41d4-a716-446655440010',
    folio: 'OC-2026-001',
    proveedor_id: mockProveedor.id,
    proveedores: { id: mockProveedor.id, nombre: mockProveedor.nombre },
    descripcion: 'Compra de cemento',
    monto: 1000,
    pagado: 0,
    fecha: new Date('2026-09-01'),
    estado: EstadoOrdenCompra.PENDIENTE,
    motivo_cancelacion: null,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: USER_ID,
    actualizado_por: USER_ID,
    eliminado_en: null,
  };

  const mockPago = {
    id: '770e8400-e29b-41d4-a716-446655440010',
    codigo: 'PAG-PROV-2026-001',
    proveedor_id: mockProveedor.id,
    orden_compra_id: mockOrden.id,
    monto: 400,
    fecha_pago: new Date('2026-09-02'),
    metodo_pago: 'TRANSFERENCIA',
    referencia: 'Ref-001',
    activo: true,
    creado_en: new Date(),
    creado_por: USER_ID,
    eliminado_en: null,
  };

  // $transaction con callback: delega en los mismos mocks de prisma.
  const runTx = jest.fn((cb: (tx: never) => Promise<unknown>) => cb(prisma as never));

  beforeEach(async () => {
    prisma = {
      proveedores: {
        findMany: jest.fn().mockResolvedValue([mockProveedor]),
        findFirst: jest.fn().mockResolvedValue(mockProveedor),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockProveedor),
        update: jest.fn().mockResolvedValue(mockProveedor),
      },
      ordenes_compra: {
        findMany: jest.fn().mockResolvedValue([mockOrden]),
        findFirst: jest.fn().mockResolvedValue(mockOrden),
        count: jest.fn().mockResolvedValue(5),
        create: jest.fn().mockResolvedValue(mockOrden),
        update: jest.fn().mockResolvedValue(mockOrden),
      },
      cuentas_por_pagar: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue({
          id: '880e8400-e29b-41d4-a716-446655440010',
          proveedor_id: mockProveedor.id,
          orden_compra_id: mockOrden.id,
          monto: 1000,
          monto_pagado: 0,
          estado: 'PENDIENTE',
          activo: true,
          actualizado_en: new Date(),
        }),
        create: jest.fn().mockResolvedValue({ id: '880e8400-e29b-41d4-a716-446655440010' }),
        update: jest.fn().mockResolvedValue({}),
      },
      pagos_proveedor: {
        create: jest.fn().mockResolvedValue(mockPago),
        count: jest.fn().mockResolvedValue(0),
      },
      transacciones: {
        create: jest.fn().mockResolvedValue({ id: '990e8400-e29b-41d4-a716-446655440010' }),
      },
      $transaction: runTx,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ProveedoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── proveedores ──────────────────────────────
  describe('findAll', () => {
    it('should return paginated proveedores', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].nombre).toBe('Ferretería El Tornillo');
    });

    it('should build OR search with 4 fields', async () => {
      await service.findAll({ search: 'tornillo' });
      const callArgs = prisma.proveedores.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toHaveLength(4);
    });

    it('should filter by categoria', async () => {
      await service.findAll({ categoria: 'Materiales' });
      const callArgs = prisma.proveedores.findMany.mock.calls[0][0];
      expect(callArgs.where.categoria).toBe('Materiales');
    });

    it('should paginate correctly', async () => {
      await service.findAll({ page: 2, limit: 10 });
      const callArgs = prisma.proveedores.findMany.mock.calls[0][0];
      expect(callArgs.skip).toBe(10);
      expect(callArgs.take).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a serialized proveedor', async () => {
      const result = await service.findOne(mockProveedor.id);
      expect(result.id).toBe(mockProveedor.id);
      expect(result.categoria).toBe('Materiales');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.proveedores.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { nombre: 'Nuevo Proveedor', categoria: 'Servicios' };

    it('should create and log PROVEEDOR_CREADO with SUCCESS', async () => {
      const result = await service.create(dto, USER_ID);
      expect(prisma.proveedores.create).toHaveBeenCalled();
      expect(result.nombre).toBe('Ferretería El Tornillo');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PROVEEDOR_CREADO,
          result: AuditResult.SUCCESS,
          actorUserId: USER_ID,
        }),
      );
    });

    it('should default categoria to Otros when omitted', async () => {
      await service.create({ nombre: 'Sin Categoría' }, USER_ID);
      expect(prisma.proveedores.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ categoria: 'Otros' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update and log PROVEEDOR_ACTUALIZADO', async () => {
      const result = await service.update(mockProveedor.id, { nombre: 'Nuevo Nombre' }, USER_ID);
      expect(prisma.proveedores.update).toHaveBeenCalled();
      expect(result.id).toBe(mockProveedor.id);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.PROVEEDOR_ACTUALIZADO }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.proveedores.findFirst.mockResolvedValue(null);
      await expect(service.update('non-existent', { nombre: 'X' }, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete proveedor without pending CxP', async () => {
      const result = await service.remove(mockProveedor.id, USER_ID);
      expect(prisma.proveedores.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eliminado_en: expect.anything() }),
        }),
      );
      expect(result.message).toContain('eliminado');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.PROVEEDOR_ELIMINADO }),
      );
    });

    it('should throw ConflictException when proveedor has pending CxP', async () => {
      prisma.cuentas_por_pagar.findFirst.mockResolvedValue({
        id: 'x',
        estado: 'PENDIENTE',
      });
      await expect(service.remove(mockProveedor.id, USER_ID)).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PROVEEDOR_ELIMINADO,
          result: AuditResult.FAIL,
          errorCode: 'PROVEEDOR_CON_CXP_PENDIENTE',
        }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.proveedores.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── estados de cuenta ────────────────────────
  describe('findEstadoCuentaResumen', () => {
    it('should compute total, pagado and saldo per proveedor', async () => {
      prisma.proveedores.findMany.mockResolvedValue([
        {
          ...mockProveedor,
          ordenes_compra: [
            { id: '1', monto: 1000, pagado: 400 },
            { id: '2', monto: 500, pagado: 0 },
          ],
        },
      ]);
      const result = await service.findEstadoCuentaResumen();
      expect(result).toHaveLength(1);
      expect(result[0].operaciones).toBe(2);
      expect(result[0].total).toBe(1500);
      expect(result[0].pagado).toBe(400);
      expect(result[0].saldo).toBe(1100);
    });
  });

  describe('findLedgerPorProveedor', () => {
    it('should build ledger with saldo corrido by fecha', async () => {
      prisma.ordenes_compra.findMany.mockResolvedValue([
        { ...mockOrden, folio: 'OC-2026-001', monto: 1000, pagado: 400, fecha: new Date('2026-09-01'), estado: EstadoOrdenCompra.PENDIENTE },
        { ...mockOrden, folio: 'OC-2026-002', monto: 500, pagado: 0, fecha: new Date('2026-09-03'), estado: EstadoOrdenCompra.PENDIENTE },
      ]);
      const result = await service.findLedgerPorProveedor(mockProveedor.id);
      expect(result.movimientos).toHaveLength(2);
      expect(result.movimientos[0].saldo).toBe(600);
      expect(result.movimientos[1].saldo).toBe(1100);
      expect(result.totales.saldo).toBe(1100);
    });

    it('should throw NotFoundException when proveedor not found', async () => {
      prisma.proveedores.findFirst.mockResolvedValue(null);
      await expect(service.findLedgerPorProveedor('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── órdenes de compra ────────────────────────
  describe('findAllOrdenes', () => {
    it('should return paginated ordenes', async () => {
      const result = await service.findAllOrdenes({});
      expect(result.items).toHaveLength(1);
      expect(result.items[0].folio).toBe('OC-2026-001');
    });

    it('should build OR search with folio, descripcion and proveedor', async () => {
      await service.findAllOrdenes({ search: 'cemento' });
      const callArgs = prisma.ordenes_compra.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('should filter by proveedorId and estado', async () => {
      await service.findAllOrdenes({ proveedorId: mockProveedor.id, estado: EstadoOrdenCompra.PENDIENTE });
      const callArgs = prisma.ordenes_compra.findMany.mock.calls[0][0];
      expect(callArgs.where.proveedor_id).toBe(mockProveedor.id);
      expect(callArgs.where.estado).toBe(EstadoOrdenCompra.PENDIENTE);
    });
  });

  describe('findOneOrden', () => {
    it('should include pagos_proveedor as abonos', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue({
        ...mockOrden,
        pagos_proveedor: [mockPago],
      });
      const result = await service.findOneOrden(mockOrden.id);
      expect(result.abonos).toHaveLength(1);
      expect(result.abonos[0].codigo).toBe('PAG-PROV-2026-001');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue(null);
      await expect(service.findOneOrden('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createOrden', () => {
    const dto = { proveedorId: mockProveedor.id, descripcion: 'Cemento 50kg', monto: 800 };

    it('should create OC + CxP inside $transaction and log ORDEN_COMPRA_CREADA', async () => {
      const result = await service.createOrden(dto, USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.ordenes_compra.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ folio: 'OC-2026-006', estado: EstadoOrdenCompra.PENDIENTE }),
        }),
      );
      expect(prisma.cuentas_por_pagar.create).toHaveBeenCalled();
      expect(result.folio).toBe('OC-2026-001');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ORDEN_COMPRA_CREADA,
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException when proveedor does not exist', async () => {
      prisma.proveedores.findFirst.mockResolvedValue(null);
      await expect(service.createOrden(dto, USER_ID)).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'PROVEEDOR_NO_ENCONTRADO' }),
      );
    });

    it('should map duplicate folio (P2002) to ConflictException with fallir', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      prisma.ordenes_compra.create.mockRejectedValue(p2002);
      await expect(service.createOrden(dto, USER_ID)).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'FOLIO_DUPLICADO' }),
      );
    });
  });

  describe('updateOrden', () => {
    it('should update orden and sync CxP monto', async () => {
      const result = await service.updateOrden(mockOrden.id, { monto: 1200 }, USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.ordenes_compra.update).toHaveBeenCalled();
      expect(prisma.cuentas_por_pagar.update).toHaveBeenCalled();
      expect(result.id).toBe(mockOrden.id);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ORDEN_COMPRA_ACTUALIZADA }),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue(null);
      await expect(service.updateOrden('non-existent', { monto: 1 }, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject editing RECIBIDA/CANCELADA ordenes', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue({
        ...mockOrden,
        estado: EstadoOrdenCompra.RECIBIDA,
      });
      await expect(service.updateOrden(mockOrden.id, { descripcion: 'X' }, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject monto lower than already pagado', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue({
        ...mockOrden,
        pagado: 600,
      });
      await expect(service.updateOrden(mockOrden.id, { monto: 500 }, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeOrden', () => {
    it('should soft delete orden without pagos', async () => {
      const result = await service.removeOrden(mockOrden.id, USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.message).toContain('eliminada');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ORDEN_COMPRA_ELIMINADA }),
      );
    });

    it('should throw ConflictException when orden has pagos', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue({ ...mockOrden, pagado: 400 });
      await expect(service.removeOrden(mockOrden.id, USER_ID)).rejects.toThrow(ConflictException);
    });
  });

  describe('cambiarEstadoOrden', () => {
    it('should approve PENDIENTE -> APROBADA', async () => {
      prisma.ordenes_compra.update.mockResolvedValue({ ...mockOrden, estado: EstadoOrdenCompra.APROBADA });
      const result = await service.cambiarEstadoOrden(
        mockOrden.id,
        { estado: EstadoOrdenCompra.APROBADA },
        USER_ID,
      );
      expect(result.estado).toBe(EstadoOrdenCompra.APROBADA);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ORDEN_COMPRA_ESTADO_CAMBIADO }),
      );
    });

    it('should throw BadRequestException on invalid transition APROBADA -> PENDIENTE', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue({
        ...mockOrden,
        estado: EstadoOrdenCompra.APROBADA,
      });
      await expect(
        service.cambiarEstadoOrden(mockOrden.id, { estado: EstadoOrdenCompra.PENDIENTE }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require motivo to cancel', async () => {
      await expect(
        service.cambiarEstadoOrden(mockOrden.id, { estado: EstadoOrdenCompra.CANCELADA }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cancel when orden has pagos', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue({ ...mockOrden, pagado: 100 });
      await expect(
        service.cambiarEstadoOrden(
          mockOrden.id,
          { estado: EstadoOrdenCompra.CANCELADA, motivo: 'Error' },
          USER_ID,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── abonos ───────────────────────────────────
  describe('registrarAbono', () => {
    const dto = { ordenCompraId: mockOrden.id, monto: 400, metodoPago: 'TRANSFERENCIA' };

    it('should create pago + update OC/CxP + create transaccion EGRESO', async () => {
      const result = await service.registrarAbono(mockProveedor.id, dto, USER_ID);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.pagos_proveedor.create).toHaveBeenCalled();
      expect(prisma.ordenes_compra.update).toHaveBeenCalled();
      expect(prisma.cuentas_por_pagar.update).toHaveBeenCalled();
      const txCall = prisma.transacciones.create.mock.calls[0][0];
      expect(txCall.data.tipo).toBe('EGRESO');
      expect(txCall.data.categoria).toBe('PROVEEDORES');
      expect(txCall.data.entidad_id).toBe(mockProveedor.id);
      expect(result.abono.codigo).toBe('PAG-PROV-2026-001');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PAGO_PROVEEDOR_REGISTRADO,
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException when proveedor does not exist', async () => {
      prisma.proveedores.findFirst.mockResolvedValue(null);
      await expect(service.registrarAbono('non-existent', dto, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when orden not found for proveedor', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue(null);
      await expect(service.registrarAbono(mockProveedor.id, dto, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when orden is CANCELADA', async () => {
      prisma.ordenes_compra.findFirst.mockResolvedValue({
        ...mockOrden,
        estado: EstadoOrdenCompra.CANCELADA,
      });
      await expect(service.registrarAbono(mockProveedor.id, dto, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException when abono exceeds saldo', async () => {
      await expect(
        service.registrarAbono(mockProveedor.id, { ...dto, monto: 1500 }, USER_ID),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'ABONO_EXCEDE_MONTO' }),
      );
    });
  });
});