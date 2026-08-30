import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EstadoProyecto, AuditAction, AuditResult } from '@prisma/client';
import { ProyectosService } from './proyectos.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ProyectosService', () => {
  let service: ProyectosService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockCliente = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nombre: 'Constructora ABC',
    eliminado_en: null,
  };

  const mockProyecto = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: null,
    nombre: 'Fraccionamiento Valle Sur',
    cliente_id: mockCliente.id,
    presupuesto: 1200000,
    progreso: 85,
    estado: EstadoProyecto.EN_PROCESO,
    ingreso_cobrado: 1020000,
    gastado: 950000,
    fecha_inicio: new Date('2025-01-10'),
    fecha_fin: new Date('2025-05-30'),
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: 'user-1',
    actualizado_por: 'user-1',
    eliminado_en: null,
    clientes: { id: mockCliente.id, nombre: mockCliente.nombre },
  };

  beforeEach(async () => {
    prisma = {
      proyectos: {
        findMany: jest.fn().mockResolvedValue([mockProyecto]),
        findFirst: jest.fn().mockResolvedValue(mockProyecto),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockProyecto),
        update: jest.fn().mockResolvedValue(mockProyecto),
        aggregate: jest.fn().mockResolvedValue({ _sum: { presupuesto: 1200000 } }),
      },
      clientes: {
        findFirst: jest.fn().mockResolvedValue(mockCliente),
        findMany: jest.fn().mockResolvedValue([mockCliente]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyectosService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ProyectosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated proyectos', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prisma.proyectos.findMany).toHaveBeenCalled();
    });

    it('should pass search to where clause (nombre y cliente)', async () => {
      await service.findAll({ search: 'valle' });
      const callArgs = prisma.proyectos.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(2);
    });

    it('should pass estado and clienteId filters', async () => {
      await service.findAll({ estado: EstadoProyecto.FINALIZADO, clienteId: mockCliente.id });
      const callArgs = prisma.proyectos.findMany.mock.calls[0][0];
      expect(callArgs.where.estado).toBe(EstadoProyecto.FINALIZADO);
      expect(callArgs.where.cliente_id).toBe(mockCliente.id);
    });
  });

  describe('findOne', () => {
    it('should return a single proyecto serialized', async () => {
      const result = await service.findOne(mockProyecto.id);
      expect(result.nombre).toBe('Fraccionamiento Valle Sur');
      expect(result.cliente).toBe(mockCliente.nombre);
      expect(result.presupuesto).toBe(1200000);
      expect(result.fechaInicio).toBe('2025-01-10');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.proyectos.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Puente Atizapán',
      clienteId: mockCliente.id,
      presupuesto: 8900000,
      fechaInicio: '2025-06-15',
      fechaFin: '2026-04-20',
    };

    it('should create a proyecto and log PROYECTO_CREADO', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result.nombre).toBe('Fraccionamiento Valle Sur');
      expect(prisma.proyectos.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PROYECTO_CREADO,
          entityType: 'proyectos',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should default estado EN_PROCESO and progreso 0', async () => {
      await service.create(createDto, 'user-1');
      const data = prisma.proyectos.create.mock.calls[0][0].data;
      expect(data.estado).toBe(EstadoProyecto.EN_PROCESO);
      expect(data.progreso).toBe(0);
    });

    it('should throw BadRequestException if cliente not found', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if fechaFin < fechaInicio', async () => {
      await expect(
        service.create(
          { ...createDto, fechaInicio: '2026-04-20', fechaFin: '2025-06-15' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a proyecto and log PROYECTO_ACTUALIZADO', async () => {
      const result = await service.update(
        mockProyecto.id,
        { nombre: 'Valle Sur Fase II' },
        'user-1',
      );
      expect(prisma.proyectos.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PROYECTO_ACTUALIZADO,
          entityType: 'proyectos',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if proyecto not found', async () => {
      prisma.proyectos.findFirst.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { nombre: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if cliente not found on update', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(
        service.update(mockProyecto.id, { clienteId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if resulting dates are inverted', async () => {
      await expect(
        service.update(mockProyecto.id, { fechaFin: '2024-01-01' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a proyecto and log PROYECTO_ELIMINADO', async () => {
      const result = await service.remove(mockProyecto.id, 'user-1');
      expect(prisma.proyectos.update).toHaveBeenCalled();
      expect(result.message).toBe('Proyecto eliminado exitosamente');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PROYECTO_ELIMINADO,
          entityType: 'proyectos',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if proyecto not found', async () => {
      prisma.proyectos.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizarFinanzas', () => {
    it('should update finanzas and log PROYECTO_FINANZAS_ACTUALIZADO', async () => {
      const result = await service.actualizarFinanzas(
        mockProyecto.id,
        { ingresoCobrado: 1100000, gastado: 980000 },
        'user-1',
      );
      expect(prisma.proyectos.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PROYECTO_FINANZAS_ACTUALIZADO,
          entityType: 'proyectos',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
          previousValue: { ingresoCobrado: 1020000, gastado: 950000 },
          newValue: { ingresoCobrado: 1020000, gastado: 950000 },
        }),
      );
    });

    it('should allow updating only one field', async () => {
      await service.actualizarFinanzas(mockProyecto.id, { gastado: 999999 }, 'user-1');
      expect(prisma.proyectos.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when both fields are missing', async () => {
      await expect(
        service.actualizarFinanzas(mockProyecto.id, {}, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if proyecto not found', async () => {
      prisma.proyectos.findFirst.mockResolvedValue(null);
      await expect(
        service.actualizarFinanzas('non-existent', { gastado: 1 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findStats', () => {
    it('should return totals and presupuesto agregado', async () => {
      prisma.proyectos.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3);
      const result = await service.findStats();
      expect(result).toEqual({
        total: 10,
        enProceso: 7,
        finalizados: 3,
        presupuestoTotal: 1200000,
      });
    });
  });

  describe('findCatalogos', () => {
    it('should return clientes catalog', async () => {
      const result = await service.findCatalogos();
      expect(result).toHaveProperty('clientes');
      expect(result.clientes).toHaveLength(1);
      expect(prisma.clientes.findMany).toHaveBeenCalled();
    });
  });
});
