import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TipoTransaccion, AuditAction, AuditResult } from '@prisma/client';
import { FinanzasService } from './finanzas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('FinanzasService', () => {
  let service: FinanzasService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockTransaccion = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: 'TRA-20260820-ABC123',
    tipo: TipoTransaccion.INGRESO,
    categoria: 'Pago de Obra',
    monto: 15000,
    fecha: new Date('2026-08-20'),
    descripcion: 'Anticipo de obra',
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: 'user-1',
    actualizado_por: 'user-1',
    eliminado_en: null,
  };

  beforeEach(async () => {
    prisma = {
      transacciones: {
        findMany: jest.fn().mockResolvedValue([mockTransaccion]),
        findFirst: jest.fn().mockResolvedValue(mockTransaccion),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockTransaccion),
        update: jest.fn().mockResolvedValue(mockTransaccion),
        groupBy: jest.fn().mockResolvedValue([
          { tipo: TipoTransaccion.INGRESO, _sum: { monto: 15000 }, _count: { _all: 2 } },
          { tipo: TipoTransaccion.EGRESO, _sum: { monto: 4000 }, _count: { _all: 1 } },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanzasService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(FinanzasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated transacciones', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toHaveProperty('monto', 15000);
      expect(result.pagination.total).toBe(1);
      expect(prisma.transacciones.findMany).toHaveBeenCalled();
    });

    it('should exclude soft-deleted rows by default', async () => {
      await service.findAll({});
      const callArgs = prisma.transacciones.findMany.mock.calls[0][0];
      expect(callArgs.where.eliminado_en).toBeNull();
    });

    it('should build search OR with descripcion/categoria/codigo', async () => {
      await service.findAll({ search: 'anticipo' });
      const callArgs = prisma.transacciones.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('should apply tipo, categoria and date filters', async () => {
      await service.findAll({
        tipo: TipoTransaccion.EGRESO,
        categoria: 'Nómina',
        fechaDesde: '2026-08-01',
        fechaHasta: '2026-08-31',
      });
      const callArgs = prisma.transacciones.findMany.mock.calls[0][0];
      expect(callArgs.where.tipo).toBe(TipoTransaccion.EGRESO);
      expect(callArgs.where.categoria).toBe('Nómina');
      expect(callArgs.where.fecha.gte).toBeDefined();
      expect(callArgs.where.fecha.lte).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a serialized transaccion', async () => {
      const result = await service.findOne(mockTransaccion.id);
      expect(result.id).toBe(mockTransaccion.id);
      expect(result.monto).toBe(15000);
      expect(result.fecha).toBe('2026-08-20');
      expect(result.codigo).toBe('TRA-20260820-ABC123');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.transacciones.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      tipo: TipoTransaccion.EGRESO,
      categoria: 'Combustible',
      monto: 850,
      fecha: '2026-08-21',
      descripcion: 'Diesel maquinaria',
    };

    it('should create and log TRANSACCION_CREADA', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result).toBeDefined();
      expect(prisma.transacciones.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TRANSACCION_CREADA,
          entityType: 'transacciones',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update and log TRANSACCION_ACTUALIZADA', async () => {
      const result = await service.update(mockTransaccion.id, { monto: 900 }, 'user-1');
      expect(prisma.transacciones.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TRANSACCION_ACTUALIZADA,
          entityType: 'transacciones',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if not found AND audit the failure', async () => {
      prisma.transacciones.findFirst.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { monto: 100 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TRANSACCION_ACTUALIZADA,
          result: AuditResult.FAIL,
          errorCode: 'TRANSACCION_NO_ENCONTRADA',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete and log TRANSACCION_ELIMINADA', async () => {
      const result = await service.remove(mockTransaccion.id, 'user-1');
      expect(result.message).toContain('eliminada');
      expect(prisma.transacciones.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eliminado_en: expect.any(Date), activo: false }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TRANSACCION_ELIMINADA,
          entityType: 'transacciones',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if not found AND audit the failure', async () => {
      prisma.transacciones.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(NotFoundException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TRANSACCION_ELIMINADA,
          result: AuditResult.FAIL,
          errorCode: 'TRANSACCION_NO_ENCONTRADA',
        }),
      );
    });
  });

  describe('findStats', () => {
    it('should compute balance, totals and cantidad', async () => {
      const result = await service.findStats();
      expect(result.totalIngresos).toBe(15000);
      expect(result.totalEgresos).toBe(4000);
      expect(result.balance).toBe(11000);
      expect(result.cantidad).toBe(3);
    });

    it('should return zeros when there are no transacciones', async () => {
      prisma.transacciones.groupBy.mockResolvedValue([]);
      const result = await service.findStats();
      expect(result).toEqual({
        balance: 0,
        totalIngresos: 0,
        totalEgresos: 0,
        cantidad: 0,
      });
    });
  });
});
