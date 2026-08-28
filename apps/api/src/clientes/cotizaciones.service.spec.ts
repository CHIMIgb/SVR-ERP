import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
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
        create: jest.fn().mockResolvedValue(mockCotizacion),
        count: jest.fn().mockResolvedValue(1),
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
});
