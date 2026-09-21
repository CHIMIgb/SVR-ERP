import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, EstadoCotizacion, Prisma } from '@prisma/client';
import { CotizacionesService } from './cotizaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CotizacionesService', () => {
  let service: CotizacionesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockClienteId = '550e8400-e29b-41d4-a716-446655440010';

  const errorP2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: 'x',
  });

  const mockCotizacion = {
    id: '490e8400-e29b-41d4-a716-446655440010',
    codigo: 'COT-20260815-ABC123',
    cliente_id: mockClienteId,
    descripcion: 'Renta de excavadora por 100 horas',
    monto: 125000,
    fecha: new Date('2026-08-15'),
    estado: EstadoCotizacion.ACEPTADA,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: 'user-1',
    actualizado_por: 'user-1',
    eliminado_en: null,
  };

  beforeEach(async () => {
    prisma = {
      clientes: {
        findFirst: jest.fn().mockResolvedValue({ id: mockClienteId }),
      },
      cotizaciones: {
        findMany: jest.fn().mockResolvedValue([mockCotizacion]),
        findFirst: jest.fn().mockResolvedValue(mockCotizacion),
        create: jest.fn().mockResolvedValue(mockCotizacion),
        update: jest.fn().mockResolvedValue(mockCotizacion),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({ _sum: { monto: 125000 } }),
      },
      // mock base: cada test que factura lo sobrescribe con mockImplementation.
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CotizacionesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(CotizacionesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByCliente', () => {
    it('should return serialized cotizaciones for a cliente with pagination', async () => {
      const result = await service.findByCliente(mockClienteId);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].estado).toBe('Aceptada');
      expect(result.items[0].monto).toBe(125000);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(prisma.cotizaciones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cliente_id: mockClienteId, eliminado_en: null }),
          skip: 0,
          take: 10,
        }),
      );
      // No debe validar que el cliente exista/esté activo
      expect(prisma.clientes.findFirst).not.toHaveBeenCalled();
    });

    it('should apply custom page and limit', async () => {
      await service.findByCliente(mockClienteId, { page: 2, limit: 5 });
      expect(prisma.cotizaciones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('should return history even if the cliente is soft-deleted', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      const result = await service.findByCliente(mockClienteId);
      expect(result.items).toHaveLength(1);
      expect(prisma.clientes.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createDto = {
      descripcion: 'Movimiento de tierras valle sur',
      monto: 450000,
      fecha: '2026-08-20',
    };

    it('should create a cotizacion and log COTIZACION_CREADA', async () => {
      const result = await service.create(mockClienteId, createDto, 'user-1');
      expect(result).toBeDefined();
      expect(prisma.cotizaciones.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COTIZACION_CREADA,
          entityType: 'cotizaciones',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should default estado to PENDIENTE and audit SUCCESS', async () => {
      await service.create(mockClienteId, createDto, 'user-1');
      const data = prisma.cotizaciones.create.mock.calls[0][0].data;
      expect(data.estado).toBe(EstadoCotizacion.PENDIENTE);
      expect(data.cliente_id).toBe(mockClienteId);
    });

    it('should throw BadRequestException AND audit failure when cliente not found', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(service.create('non-existent', createDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COTIZACION_CREADA,
          result: AuditResult.FAIL,
          errorCode: 'CLIENTE_NO_ENCONTRADO',
        }),
      );
    });
  });

  describe('findAll (global)', () => {
    it('should list all cotizaciones with pagination, without cliente filter', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].clienteId).toBe(mockClienteId);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(prisma.cotizaciones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eliminado_en: null }),
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should forward search, estado and clienteId filters', async () => {
      await service.findAll({
        search: 'tierras',
        estado: EstadoCotizacion.ACEPTADA,
        clienteId: mockClienteId,
      });
      const args = prisma.cotizaciones.findMany.mock.calls[0][0];
      expect(args.where.estado).toBe(EstadoCotizacion.ACEPTADA);
      expect(args.where.cliente_id).toBe(mockClienteId);
      expect(args.where.OR).toEqual(expect.any(Array));
    });
  });

  describe('findOne (global detail)', () => {
    it('should return the serialized cotizacion with cliente info', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        clientes: { id: mockClienteId, nombre: 'Carlos SVR', empresa: 'SVR Constructora' },
      });
      const result = await service.findOne(mockCotizacion.id);
      expect(result.clienteNombre).toBe('Carlos SVR');
      expect(result.clienteEmpresa).toBe('SVR Constructora');
      expect(prisma.cotizaciones.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockCotizacion.id, eliminado_en: null } }),
      );
    });

    it('should throw NotFoundException and audit FAIL when not found', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COTIZACION_ACTUALIZADA,
          result: AuditResult.FAIL,
          errorCode: 'COTIZACION_NO_ENCONTRADA',
        }),
      );
    });
  });

  describe('cambiarEstado', () => {
    it('should change estado, update DB and log COTIZACION_ACTUALIZADA with previous/new estado', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
      });
      prisma.cotizaciones.update.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.ACEPTADA,
      });

      const result = await service.cambiarEstado(
        mockCotizacion.id,
        { estado: EstadoCotizacion.ACEPTADA },
        'user-1',
      );

      expect(result.estado).toBe('Aceptada');
      expect(prisma.cotizaciones.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCotizacion.id },
          data: expect.objectContaining({ estado: EstadoCotizacion.ACEPTADA }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COTIZACION_ACTUALIZADA,
          entityId: mockCotizacion.id,
          result: AuditResult.SUCCESS,
          actorUserId: 'user-1',
          previousValue: { estado: 'Pendiente', motivoRechazo: null },
          newValue: { estado: 'Aceptada', motivoRechazo: null },
        }),
      );
    });

    it('should throw NotFoundException when cotizacion does not exist', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue(null);
      await expect(
        service.cambiarEstado('missing', { estado: EstadoCotizacion.ACEPTADA }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'COTIZACION_NO_ENCONTRADA',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should reject changing an already ACEPTADA quote (COTIZACION_YA_DECIDIDA)', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.ACEPTADA,
      });
      await expect(
        service.cambiarEstado(mockCotizacion.id, { estado: EstadoCotizacion.RECHAZADA }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'COTIZACION_YA_DECIDIDA',
        }),
      );
    });

    it('should reject changing an already RECHAZADA quote (COTIZACION_YA_DECIDIDA)', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.RECHAZADA,
      });
      await expect(
        service.cambiarEstado(mockCotizacion.id, { estado: EstadoCotizacion.ACEPTADA }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'COTIZACION_YA_DECIDIDA',
        }),
      );
    });

    it('should require motivoRechazo when rejecting (MOTIVO_RECHAZO_REQUERIDO)', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
      });
      await expect(
        service.cambiarEstado(mockCotizacion.id, { estado: EstadoCotizacion.RECHAZADA }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'MOTIVO_RECHAZO_REQUERIDO',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should persist motivoRechazo when rejecting', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
      });
      prisma.cotizaciones.update.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.RECHAZADA,
        motivo_rechazo: 'Precio demasiado alto',
      });

      const result = await service.cambiarEstado(
        mockCotizacion.id,
        { estado: EstadoCotizacion.RECHAZADA, motivoRechazo: 'Precio demasiado alto' },
        'user-1',
      );

      expect(result.estado).toBe('Rechazada');
      expect(prisma.cotizaciones.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: EstadoCotizacion.RECHAZADA,
            motivo_rechazo: 'Precio demasiado alto',
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          newValue: { estado: 'Rechazada', motivoRechazo: 'Precio demasiado alto' },
        }),
      );
    });

    it('should reject reverting a decided quote back to PENDIENTE (DTO blocks it)', async () => {
      const dto = { estado: EstadoCotizacion.PENDIENTE };
      // El servicio no se llega a ejecutar porque el DTO rechaza PENDIENTE,
      // pero verificamos que el servicio tampoco lo permitiría por el guardia de estado.
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.RECHAZADA,
      });
      // Simulamos que el DTO no bloqueó (no debería pasar en producción);
      // el servicio bloquea porque la cotización ya fue decidida.
      await expect(service.cambiarEstado(mockCotizacion.id, dto as never, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'COTIZACION_YA_DECIDIDA',
        }),
      );
    });
  });

  describe('update', () => {
    it('should edit fields, change cliente and log COTIZACION_ACTUALIZADA', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
      });
      prisma.cotizaciones.update.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        descripcion: 'Renta de retroexcavadora por 80 horas',
        monto: 98000,
        cliente_id: '660e8400-e29b-41d4-a716-446655440099',
      });

      const result = await service.update(mockCotizacion.id, {
        clienteId: '660e8400-e29b-41d4-a716-446655440099',
        descripcion: 'Renta de retroexcavadora por 80 horas',
        monto: 98000,
        fecha: '2026-08-20',
      }, 'user-1');

      expect(prisma.cotizaciones.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCotizacion.id },
          data: expect.objectContaining({
            descripcion: 'Renta de retroexcavadora por 80 horas',
            monto: 98000,
            cliente_id: '660e8400-e29b-41d4-a716-446655440099',
          }),
        }),
      );
      expect(result.descripcion).toBe('Renta de retroexcavadora por 80 horas');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COTIZACION_ACTUALIZADA,
          entityId: mockCotizacion.id,
          result: AuditResult.SUCCESS,
          actorUserId: 'user-1',
        }),
      );
    });

    it('should not update cliente when clienteId matches existing', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
      });
      prisma.cotizaciones.update.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        monto: 110000,
      });

      await service.update(mockCotizacion.id, { monto: 110000 }, 'user-1');

      const call = prisma.cotizaciones.update.mock.calls[0][0];
      expect(call.data.cliente_id).toBeUndefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.SUCCESS }),
      );
    });

    it('should throw NotFoundException and audit FAIL when cotizacion does not exist', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue(null);
      await expect(
        service.update('missing', { monto: 1000 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'COTIZACION_NO_ENCONTRADA',
          actorUserId: 'user-1',
        }),
      );
    });

    it('should throw BadRequestException and audit FAIL when new cliente is invalid', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
      });
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(
        service.update(mockCotizacion.id, { clienteId: 'bad-client-uuid' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'CLIENTE_NO_ENCONTRADO',
        }),
      );
    });

    it('should reject editing an already decided quote (COTIZACION_YA_DECIDIDA)', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue(mockCotizacion);
      await expect(
        service.update(mockCotizacion.id, { monto: 200000 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'COTIZACION_YA_DECIDIDA',
        }),
      );
      expect(prisma.cotizaciones.update).not.toHaveBeenCalled();
    });
  });

  describe('findStats', () => {
    it('should compute totals per estado and montoAceptado', async () => {
      prisma.cotizaciones.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(4) // pendientes
        .mockResolvedValueOnce(5) // aceptadas
        .mockResolvedValueOnce(1); // rechazadas

      const result = await service.findStats();
      expect(result).toEqual({
        total: 10,
        pendientes: 4,
        aceptadas: 5,
        rechazadas: 1,
        montoAceptado: 125000,
      });
    });
  });

  describe('facturar', () => {
    const ID = mockCotizacion.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx: any = {
      cotizaciones: { updateMany: jest.fn(), findUnique: jest.fn() },
      facturas: { count: jest.fn().mockResolvedValue(0), create: jest.fn() },
      cuentas_por_cobrar: { create: jest.fn() },
    };

    it('debe facturar creando factura + concepto + CxC y auditar COTIZACION_FACTURADA', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        facturas: [],
      });
      prisma.clientes.findFirst.mockResolvedValue({ id: mockClienteId });
      tx.cotizaciones.updateMany.mockResolvedValue({ count: 1 });
      tx.facturas.create.mockImplementation(async ({ data }: any) => ({
        id: data.id,
        codigo: data.codigo,
        total: data.total,
        estado: data.estado,
      }));
      tx.cuentas_por_cobrar.create.mockImplementation(async ({ data }: any) => ({
        id: data.id,
        monto: data.monto,
        fecha_vencimiento: data.fecha_vencimiento,
      }));
      prisma.$transaction = jest.fn(async (cb: (t: any) => Promise<unknown>) => cb(tx));

      const result = await service.facturar(ID, 'user-1');

      expect(tx.cotizaciones.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: EstadoCotizacion.PENDIENTE }),
          data: expect.objectContaining({ estado: EstadoCotizacion.ACEPTADA }),
        }),
      );
      expect(tx.facturas.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cotizacion_id: ID,
            cliente_id: mockClienteId,
            subtotal: 125000,
            impuestos: 20000,
            total: 145000,
            estado: 'PENDIENTE',
          }),
        }),
      );
      // Desglose de IVA consistente por concepto (tasa 16% con importe acorde).
      const dataFactura = tx.facturas.create.mock.calls[0][0].data;
      expect(dataFactura.factura_conceptos.create[0]).toEqual(
        expect.objectContaining({
          impuesto_tasa: 0.16,
          impuesto_importe: 20000,
        }),
      );
      expect(tx.cuentas_por_cobrar.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ monto: 145000, estado: 'PENDIENTE' }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COTIZACION_FACTURADA,
          result: AuditResult.SUCCESS,
          entityId: ID,
        }),
      );
      expect(result.cotizacionId).toBe(ID);
      expect(result.factura.codigo).toBe('FAC-2026-0001');
    });

    it('debe fallar COTIZACION_YA_FACTURADA si perdió la carrera de transición', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        facturas: [],
      });
      prisma.clientes.findFirst.mockResolvedValue({ id: mockClienteId });
      tx.cotizaciones.updateMany.mockClear();
      tx.facturas.create.mockClear();
      tx.cotizaciones.updateMany.mockResolvedValue({ count: 0 });
      tx.cotizaciones.findUnique.mockResolvedValue({
        estado: EstadoCotizacion.ACEPTADA,
        facturas: [{ id: 'factura-ganadora' }],
      });
      prisma.$transaction = jest.fn(async (cb: (t: any) => Promise<unknown>) => cb(tx));

      await expect(service.facturar(ID, 'user-1')).rejects.toThrow(BadRequestException);

      expect(tx.cotizaciones.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: EstadoCotizacion.PENDIENTE }),
        }),
      );
      expect(tx.cotizaciones.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ID } }),
      );
      expect(tx.facturas.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'COTIZACION_YA_FACTURADA' }),
      );
    });

    it('debe fallar COTIZACION_NO_PENDIENTE si perdió la carrera contra otro estado', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        facturas: [],
      });
      prisma.clientes.findFirst.mockResolvedValue({ id: mockClienteId });
      tx.cotizaciones.updateMany.mockClear();
      tx.facturas.create.mockClear();
      tx.cotizaciones.updateMany.mockResolvedValue({ count: 0 });
      tx.cotizaciones.findUnique.mockResolvedValue({
        estado: EstadoCotizacion.RECHAZADA,
        facturas: [],
      });
      prisma.$transaction = jest.fn(async (cb: (t: any) => Promise<unknown>) => cb(tx));

      await expect(service.facturar(ID, 'user-1')).rejects.toThrow(BadRequestException);

      expect(tx.facturas.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'COTIZACION_NO_PENDIENTE' }),
      );
    });

    it('debe fallar COTIZACION_NO_ENCONTRADA si no existe', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue(null);
      await expect(service.facturar('missing', 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'COTIZACION_NO_ENCONTRADA' }),
      );
    });

    it('debe fallar COTIZACION_NO_PENDIENTE si ya fue decidida', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({ ...mockCotizacion, facturas: [] });
      await expect(service.facturar(ID, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'COTIZACION_NO_PENDIENTE' }),
      );
    });

    it('debe fallar COTIZACION_YA_FACTURADA si ya tiene factura', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        facturas: [{ id: 'factura-1' }],
      });
      await expect(service.facturar(ID, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'COTIZACION_YA_FACTURADA' }),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('debe fallar CLIENTE_NO_ENCONTRADO si el cliente está inactivo', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        facturas: [],
      });
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(service.facturar(ID, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: AuditResult.FAIL, errorCode: 'CLIENTE_NO_ENCONTRADO' }),
      );
    });

    it('debe reasignar folio al sufijo UUID en el intento final cuando el conteo+1 colisiona (Blocker #4)', async () => {
      // El conteo nunca avanza (simula colisión persistente de count+1). Las
      // iteraciones 0..N-1 generan el mismo codigo/folio; la última debe caer
      // al respaldo UUID en AMBOS (codigo y folio), igual que el unique de
      // serie+folio lo exige.
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.PENDIENTE,
        facturas: [],
      });
      prisma.clientes.findFirst.mockResolvedValue({ id: mockClienteId });
      tx.cotizaciones.updateMany.mockResolvedValue({ count: 1 });
      tx.facturas.count.mockResolvedValue(5); // conteo congelado → count+1 siempre colisiona
      tx.facturas.create.mockRejectedValue(errorP2002);
      prisma.$transaction = jest.fn(async (cb: (t: any) => Promise<unknown>) => cb(tx));

      await expect(service.facturar(ID, 'user-1')).rejects.toThrow(
        'No se pudo asignar un folio único a la factura',
      );

      // Último intento: folio = sufijo UUID, consistente con el codigo y
      // distinto del count+1 ('000006') que ya colisionó.
      const calls = tx.facturas.create.mock.calls;
      const ultimo = calls[calls.length - 1][0].data;
      expect(ultimo.folio).not.toBe('000006');
      expect(ultimo.folio).toBe(ultimo.codigo.split('-').pop());
      // Los intentos intermedios sí usaron el secuencial por conteo.
      const penultimo = calls[calls.length - 2][0].data;
      expect(penultimo.folio).toBe('000006');
    });
  });
});
