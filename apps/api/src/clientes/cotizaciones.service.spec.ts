import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult, EstadoCotizacion } from '@prisma/client';
import { CotizacionesService } from './cotizaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CotizacionesService', () => {
  let service: CotizacionesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockClienteId = '550e8400-e29b-41d4-a716-446655440010';

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
    });

    it('should apply custom page and limit', async () => {
      await service.findByCliente(mockClienteId, { page: 2, limit: 5 });
      expect(prisma.cotizaciones.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('should throw BadRequestException AND audit failure when cliente not found', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(service.findByCliente('non-existent')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.COTIZACION_CREADA,
          result: AuditResult.FAIL,
          errorCode: 'CLIENTE_NO_ENCONTRADO',
        }),
      );
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
          previousValue: { estado: 'Pendiente' },
          newValue: { estado: 'Aceptada' },
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

    it('should reject when estado is the same (ESTADO_SIN_CAMBIO)', async () => {
      prisma.cotizaciones.findFirst.mockResolvedValue({
        ...mockCotizacion,
        estado: EstadoCotizacion.ACEPTADA,
      });
      await expect(
        service.cambiarEstado(mockCotizacion.id, { estado: EstadoCotizacion.ACEPTADA }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: AuditResult.FAIL,
          errorCode: 'ESTADO_SIN_CAMBIO',
        }),
      );
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
});
