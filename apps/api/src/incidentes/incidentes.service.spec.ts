import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prioridad, EstadoIncidente, AuditAction, AuditResult } from '@prisma/client';
import { IncidentesService } from './incidentes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('IncidentesService', () => {
  let service: IncidentesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockObra = {
    id: '00000000-0000-0000-0000-000000000010',
    nombre: 'Valle Sur',
    activo: true,
    eliminado_en: null,
  };

  const mockMaquina = {
    id: '00000000-0000-0000-0000-000000000020',
    nombre: 'Excavadora CAT 320',
    activo: true,
    eliminado_en: null,
  };

  const mockIncidente = {
    id: '00000000-0000-0000-0000-000000000030',
    titulo: 'Fuga de aceite hidráulico',
    descripcion: 'Se detectó fuga en manguera principal',
    prioridad: Prioridad.ALTA,
    estado: EstadoIncidente.ABIERTO,
    fecha: new Date('2025-04-27'),
    maquina_id: mockMaquina.id,
    obra_id: mockObra.id,
    obra_texto: mockObra.nombre,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: 'user-1',
    actualizado_por: 'user-1',
    eliminado_en: null,
    maquinas: { id: mockMaquina.id, nombre: mockMaquina.nombre },
    obras: { id: mockObra.id, nombre: mockObra.nombre },
  };

  beforeEach(async () => {
    prisma = {
      incidentes: {
        findMany: jest.fn().mockResolvedValue([mockIncidente]),
        findFirst: jest.fn().mockResolvedValue(mockIncidente),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockIncidente),
        update: jest.fn().mockResolvedValue({ ...mockIncidente, estado: EstadoIncidente.RESUELTO }),
      },
      maquinas: {
        findFirst: jest.fn().mockResolvedValue(mockMaquina),
        findMany: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.estado === 'MANTENIMIENTO') return Promise.resolve([]);
          if (args?.where?.fallas_mecanicas?.some) return Promise.resolve([]);
          return Promise.resolve([{ ...mockMaquina, fallas_mecanicas: [] }]);
        }),
      },
      obras: {
        findFirst: jest.fn().mockResolvedValue(mockObra),
        findMany: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.estado?.not === 'FINALIZADA') {
            return Promise.resolve([{ ...mockObra, estado: 'EN_PROCESO' }]);
          }
          return Promise.resolve([mockObra]);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(IncidentesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated incidentes', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prisma.incidentes.findMany).toHaveBeenCalled();
    });

    it('should pass search to where clause', async () => {
      await service.findAll({ search: 'fuga' });
      const callArgs = prisma.incidentes.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(4);
    });

    it('should pass prioridad filter', async () => {
      await service.findAll({ prioridad: Prioridad.ALTA });
      const callArgs = prisma.incidentes.findMany.mock.calls[0][0];
      expect(callArgs.where.prioridad).toBe(Prioridad.ALTA);
    });

    it('should pass estado filter', async () => {
      await service.findAll({ estado: EstadoIncidente.ABIERTO });
      const callArgs = prisma.incidentes.findMany.mock.calls[0][0];
      expect(callArgs.where.estado).toBe(EstadoIncidente.ABIERTO);
    });

    it('should pass maquinaId and obraId filters', async () => {
      await service.findAll({ maquinaId: mockMaquina.id, obraId: mockObra.id });
      const callArgs = prisma.incidentes.findMany.mock.calls[0][0];
      expect(callArgs.where.maquina_id).toBe(mockMaquina.id);
      expect(callArgs.where.obra_id).toBe(mockObra.id);
    });
  });

  describe('findOne', () => {
    it('should return a single incidente', async () => {
      const result = await service.findOne(mockIncidente.id);
      expect(result.id).toBe(mockIncidente.id);
      expect(result.titulo).toBe('Fuga de aceite hidráulico');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.incidentes.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      titulo: 'Fuga de aceite hidráulico',
      descripcion: 'Se detectó fuga en manguera principal',
      prioridad: Prioridad.ALTA,
      estado: EstadoIncidente.ABIERTO,
      fecha: '2025-04-27',
      obraId: mockObra.id,
      maquinaId: mockMaquina.id,
    };

    it('should create a new incidente and log INCIDENTE_CREADO', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result.titulo).toBe('Fuga de aceite hidráulico');
      expect(prisma.incidentes.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.INCIDENTE_CREADO,
          entityType: 'incidentes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw BadRequestException if obra not found', async () => {
      prisma.obras.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if maquina not found', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow creating without maquinaId', async () => {
      const dtoSinMaquina: any = { ...createDto };
      delete dtoSinMaquina.maquinaId;
      const result = await service.create(dtoSinMaquina, 'user-1');
      expect(result).toBeDefined();
      expect(prisma.incidentes.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an incidente and log INCIDENTE_ACTUALIZADO', async () => {
      const result = await service.update(mockIncidente.id, { titulo: 'Fuga reparada' }, 'user-1');
      expect(prisma.incidentes.update).toHaveBeenCalled();
      expect(result.titulo).toBe('Fuga de aceite hidráulico');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.INCIDENTE_ACTUALIZADO,
          entityType: 'incidentes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if incidente not found', async () => {
      prisma.incidentes.findFirst.mockResolvedValue(null);
      await expect(service.update('non-existent', { titulo: 'X' }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if obra not found on update', async () => {
      prisma.obras.findFirst.mockResolvedValue(null);
      await expect(
        service.update(mockIncidente.id, { obraId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if maquina not found on update', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(
        service.update(mockIncidente.id, { maquinaId: 'bad' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete an incidente and log INCIDENTE_ELIMINADO', async () => {
      const result = await service.remove(mockIncidente.id, 'user-1');
      expect(prisma.incidentes.update).toHaveBeenCalled();
      expect(result.message).toBe('Incidente eliminado exitosamente');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.INCIDENTE_ELIMINADO,
          entityType: 'incidentes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if incidente not found', async () => {
      prisma.incidentes.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolver', () => {
    it('should mark incidente as RESUELTO and log INCIDENTE_RESUELTO', async () => {
      const result = await service.resolver(mockIncidente.id, 'user-1');
      expect(prisma.incidentes.update).toHaveBeenCalled();
      expect(result.estado).toBe('Resuelto');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.INCIDENTE_RESUELTO,
          entityType: 'incidentes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if incidente not found', async () => {
      prisma.incidentes.findFirst.mockResolvedValue(null);
      await expect(service.resolver('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if incidente already RESUELTO', async () => {
      prisma.incidentes.findFirst.mockResolvedValue({ ...mockIncidente, estado: EstadoIncidente.RESUELTO });
      await expect(service.resolver(mockIncidente.id, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reportar', () => {
    const reportarDto = { descripcion: 'Se reporta por riesgo de caída de material' };

    it('should register report and log INCIDENTE_REPORTADO', async () => {
      const result = await service.reportar(mockIncidente.id, reportarDto, 'user-1');
      expect(prisma.incidentes.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.INCIDENTE_REPORTADO,
          entityType: 'incidentes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
          newValue: { descripcion: reportarDto.descripcion },
        }),
      );
    });

    it('should throw NotFoundException if incidente not found', async () => {
      prisma.incidentes.findFirst.mockResolvedValue(null);
      await expect(
        service.reportar('non-existent', reportarDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if incidente already reported', async () => {
      prisma.incidentes.findFirst.mockResolvedValue({
        ...mockIncidente,
        reporte_descripcion: 'Reporte previo',
      });
      await expect(
        service.reportar(mockIncidente.id, reportarDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findStats', () => {
    it('should return total, abiertos and criticos', async () => {
      prisma.incidentes.count = jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(4).mockResolvedValueOnce(1);
      const result = await service.findStats();
      expect(result).toEqual({ total: 10, abiertos: 4, criticos: 1 });
    });
  });

  describe('findCatalogos', () => {
    it('should return maquinas and obras', async () => {
      const result = await service.findCatalogos();
      expect(result).toHaveProperty('maquinas');
      expect(result).toHaveProperty('obras');
      expect(result.maquinas).toHaveLength(1);
      expect(result.obras).toHaveLength(1);
    });

    it('should exclude maquinas with active fallas', async () => {
      prisma.maquinas.findMany.mockImplementation((args: any) => {
        if (args?.where?.estado === 'MANTENIMIENTO') return Promise.resolve([]);
        if (args?.where?.fallas_mecanicas?.some) return Promise.resolve([]);
        return Promise.resolve([{ ...mockMaquina, fallas_mecanicas: [{ id: 'f1' }] }]);
      });
      const result = await service.findCatalogos();
      expect(result.maquinas).toHaveLength(0);
    });

    it('should exclude FINALIZADA obras', async () => {
      prisma.obras.findMany.mockImplementation((args: any) => {
        if (args?.where?.estado?.not === 'FINALIZADA') {
          return Promise.resolve([]);
        }
        return Promise.resolve([mockObra]);
      });
      const result = await service.findCatalogos();
      expect(result.obras).toHaveLength(0);
    });
  });
});
