import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MaquinasService } from '../maquinas/maquinas.service';

describe('MantenimientoService', () => {
  let service: MantenimientoService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
  const mockMaquinasService = {
    mapaCodigoAId: jest.fn().mockResolvedValue(new Map([['M001', 'maquina-uuid-1']])),
  };

  const mockRegistro = {
    id: 'reg-uuid-1',
    maquina_id: 'maquina-uuid-1',
    tipo: 'PREVENTIVO',
    descripcion: 'Cambio de aceite y filtros',
    fecha: new Date('2026-08-20'),
    horas_servicio: 1000,
    costo: 5500,
    proximo_servicio_horas: 1250,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    maquinas: { id: 'maquina-uuid-1', codigo: 'M001' },
  };

  beforeEach(async () => {
    prisma = {
      registros_mantenimiento: {
        findMany: jest.fn().mockResolvedValue([mockRegistro]),
        findFirst: jest.fn().mockResolvedValue(mockRegistro),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockRegistro),
        update: jest.fn().mockResolvedValue(mockRegistro),
        aggregate: jest.fn().mockResolvedValue({ _avg: { horas_servicio: 940 } }),
      },
      maquinas: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValue([{ id: 'maquina-uuid-1', horometro: 1200 }]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MantenimientoService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: MaquinasService, useValue: mockMaquinasService },
      ],
    }).compile();

    service = module.get(MantenimientoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    maquinaId: 'M001',
    tipo: 'Preventivo' as const,
    descripcion: 'Cambio de aceite y filtros',
    fecha: '2026-08-20',
    horasServicio: 1000,
    costo: 5500,
    proximoServicioHoras: 1250,
    ...overrides,
  });

  describe('findAll', () => {
    it('should return paginated registros', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should map "Correctivo"/"Preventivo" tipo filter to DB enum', async () => {
      await service.findAll({ tipo: 'Correctivo' });
      const callArgs = prisma.registros_mantenimiento.findMany.mock.calls[0][0];
      expect(callArgs.where.tipo).toBe('CORRECTIVO');
    });

    it('should serialize tipo back to UI label', async () => {
      const result = await service.findAll({});
      expect(result.items[0].tipo).toBe('Preventivo');
      expect(result.items[0].maquinaId).toBe('M001');
    });
  });

  describe('findStats', () => {
    it('should flag a machine as próxima when horometro is within 50hrs of proximoServicioHoras', async () => {
      prisma.registros_mantenimiento.findMany.mockResolvedValue([
        { maquina_id: 'maquina-uuid-1', fecha: new Date('2026-08-20'), proximo_servicio_horas: 1250 },
      ]);
      const stats = await service.findStats();
      expect(stats.serviciosProximos).toBe(1);
      expect(stats.totalMaquinas).toBe(4);
      expect(stats.equiposEnOptimoEstado).toBe(3);
      expect(stats.promedioHorasServicio).toBe(940);
    });
  });

  describe('create', () => {
    it('should create a registro when the machine exists and dates are valid', async () => {
      const result = await service.create(createDto(), 'user-1');
      expect(result.maquinaId).toBe('M001');
      expect(prisma.registros_mantenimiento.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MANTENIMIENTO_REGISTRADO', result: 'SUCCESS', actorUserId: 'user-1' }),
      );
    });

    it('should reject when proximoServicioHoras is not greater than horasServicio', async () => {
      await expect(
        service.create(createDto({ horasServicio: 1000, proximoServicioHoras: 1000 }), 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'PROXIMO_SERVICIO_INVALIDO' }));
      expect(prisma.registros_mantenimiento.create).not.toHaveBeenCalled();
    });

    it('should reject when the machine does not exist', async () => {
      await expect(service.create(createDto({ maquinaId: 'M999' }), 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'MAQUINA_NO_ENCONTRADA' }));
    });
  });

  describe('update', () => {
    it('should update and audit with previous/new value', async () => {
      prisma.registros_mantenimiento.update.mockResolvedValue({ ...mockRegistro, costo: 6000 });
      const result = await service.update('reg-uuid-1', { costo: 6000 }, 'user-1');
      expect(result.costo).toBe(6000);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MANTENIMIENTO_ACTUALIZADO', result: 'SUCCESS' }),
      );
    });

    it('should reject when the effective proximoServicioHoras is not greater than horasServicio', async () => {
      await expect(service.update('reg-uuid-1', { proximoServicioHoras: 900 }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should 404 when the registro does not exist', async () => {
      prisma.registros_mantenimiento.findFirst.mockResolvedValue(null);
      await expect(service.update('missing', { costo: 100 }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete and audit', async () => {
      const result = await service.remove('reg-uuid-1', 'user-1');
      expect(result.message).toContain('eliminado');
      expect(prisma.registros_mantenimiento.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'reg-uuid-1' }, data: expect.objectContaining({ activo: false }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MANTENIMIENTO_ELIMINADO', result: 'SUCCESS' }),
      );
    });

    it('should 404 when the registro does not exist', async () => {
      prisma.registros_mantenimiento.findFirst.mockResolvedValue(null);
      await expect(service.remove('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
