import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  EstadoReporteCampo,
  Prioridad,
  TipoReporteCampo,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { ReportesCampoService } from './reportes-campo.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ReportesCampoService', () => {
  let service: ReportesCampoService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockReporte = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: null,
    tipo: TipoReporteCampo.PIPERO,
    usuario: 'Marcos G.',
    usuario_id: null,
    maquina_id: '550e8400-e29b-41d4-a716-446655440020',
    fecha: new Date('2025-04-27'),
    hora: new Date('1970-01-01T14:15:00'),
    descripcion: 'Suministro de 200L de diésel. Tanque lleno.',
    estado: EstadoReporteCampo.VISTO,
    prioridad: null,
    detalles: { litros: 200, costo: 4600 },
    obra_id: null,
    obra_texto: 'Valle Sur',
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    eliminado_en: null,
    maquinas: { id: 'm1', codigo: 'M004', nombre: 'Camión Pipero' },
    obras: null,
  };

  beforeEach(async () => {
    prisma = {
      reportes_campo: {
        findMany: jest.fn().mockResolvedValue([mockReporte]),
        findFirst: jest.fn().mockResolvedValue(mockReporte),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockReporte),
        update: jest.fn().mockResolvedValue(mockReporte),
      },
      maquinas: {
        findFirst: jest.fn().mockResolvedValue({ id: mockReporte.maquina_id }),
      },
      obras: {
        findFirst: jest.fn().mockResolvedValue({ id: 'obra-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesCampoService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ReportesCampoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated reportes', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
    });

    it('should pass search to where clause (usuario, descripcion, obra)', async () => {
      await service.findAll({ search: 'diésel' });
      const callArgs = prisma.reportes_campo.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('should pass estado, tipo and prioridad filters', async () => {
      await service.findAll({
        estado: EstadoReporteCampo.PENDIENTE,
        tipo: TipoReporteCampo.INCIDENTE,
        prioridad: Prioridad.ALTA,
      });
      const callArgs = prisma.reportes_campo.findMany.mock.calls[0][0];
      expect(callArgs.where.estado).toBe(EstadoReporteCampo.PENDIENTE);
      expect(callArgs.where.tipo).toBe(TipoReporteCampo.INCIDENTE);
      expect(callArgs.where.prioridad).toBe(Prioridad.ALTA);
    });
  });

  describe('findOne', () => {
    it('should return a serialized reporte', async () => {
      const result = await service.findOne(mockReporte.id);
      expect(result.tipo).toBe('Pipero');
      expect(result.estado).toBe('Visto');
      expect(result.maquinaCodigo).toBe('M004');           // código para mostrar
      expect(result.maquinaId).toBe(mockReporte.maquina_id); // UUID para editar
      expect(result.hora).toBe('14:15');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      tipo: TipoReporteCampo.PIPERO,
      usuario: 'Marcos G.',
      maquinaId: mockReporte.maquina_id as string,
      obraTexto: 'Valle Sur',
      fecha: '2025-04-27',
      hora: '14:15',
      descripcion: 'Suministro de 200L de diésel. Tanque lleno.',
    };

    it('should create a reporte (PENDIENTE) and log REPORTE_CREADO', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(prisma.reportes_campo.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_CREADO,
          entityType: 'reportes_campo',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw BadRequest if máquina not found AND audit the failure', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_CREADO,
          result: AuditResult.FAIL,
          errorCode: 'MAQUINA_NO_ENCONTRADA',
        }),
      );
    });

    it('should default estado PENDIENTE and link usuario_id to creator', async () => {
      await service.create(createDto, 'user-1');
      const data = prisma.reportes_campo.create.mock.calls[0][0].data;
      expect(data.estado).toBe(EstadoReporteCampo.PENDIENTE);
      expect(data.usuario_id).toBe('user-1');
    });
  });

  describe('update — edición limitada a PENDIENTES', () => {
    it('should update a PENDIENTE reporte and log REPORTE_ACTUALIZADO', async () => {
      prisma.reportes_criba; // noop para lint
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoReporteCampo.PENDIENTE,
      });

      const result = await service.update(
        mockReporte.id,
        { descripcion: 'Corrección de errata en el reporte' },
        'user-1',
      );

      expect(prisma.reportes_campo.update).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ACTUALIZADO,
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should reject editing a non-PENDIENTE reporte AND audit the failure', async () => {
      // mockReporte está VISTO
      await expect(
        service.update(mockReporte.id, { descripcion: 'X' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ACTUALIZADO,
          result: AuditResult.FAIL,
          errorCode: 'EDITAR_SOLO_PENDIENTES',
        }),
      );
    });

    it('should throw NotFound AND audit when reporte does not exist', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { descripcion: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ACTUALIZADO,
          result: AuditResult.FAIL,
          errorCode: 'REPORTE_NO_ENCONTRADO',
        }),
      );
    });
  });

  describe('cambiarEstado — flujo de seguimiento', () => {
    it.each([
      [EstadoReporteCampo.PENDIENTE, EstadoReporteCampo.VISTO],
      [EstadoReporteCampo.VISTO, EstadoReporteCampo.ATENDIDO],
      [EstadoReporteCampo.ATENDIDO, EstadoReporteCampo.RESUELTO],
      [EstadoReporteCampo.EN_REVISION, EstadoReporteCampo.RESUELTO],
    ])('debe permitir %s → %s y auditar ESTATUS_CAMBIADO', async (desde, hacia) => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: desde,
      });

      const result = await service.cambiarEstado(mockReporte.id, { estado: hacia }, 'user-1');

      expect(result.estado).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ESTATUS_CAMBIADO,
          entityType: 'reportes_campo',
          entityId: mockReporte.id,
          result: AuditResult.SUCCESS,
          previousValue: { estado: expect.any(String) },
          newValue: { estado: hacia === EstadoReporteCampo.RESUELTO ? 'Resuelto' : expect.any(String) },
        }),
      );
    });

    it('debe rechazar saltos no válidos (RESUELTO → cualquier cosa) Y auditar el fallo', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoReporteCampo.RESUELTO,
      });

      await expect(
        service.cambiarEstado(mockReporte.id, { estado: EstadoReporteCampo.VISTO }, 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ESTATUS_CAMBIADO,
          result: AuditResult.FAIL,
          errorCode: 'TRANSICION_NO_VALIDA',
        }),
      );
    });

    it('debe rechazar retroceder (ATENDIDO → VISTO) Y auditar el fallo', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoReporteCampo.ATENDIDO,
      });

      await expect(
        service.cambiarEstado(mockReporte.id, { estado: EstadoReporteCampo.VISTO }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete and log REPORTE_ELIMINADO', async () => {
      const result = await service.remove(mockReporte.id, 'user-1');
      expect(result.message).toContain('eliminado');
      expect(prisma.reportes_criba).toBeUndefined(); // sanity: tabla correcta
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ELIMINADO,
          entityType: 'reportes_campo',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFound AND audit when not found', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(NotFoundException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ELIMINADO,
          result: AuditResult.FAIL,
          errorCode: 'REPORTE_NO_ENCONTRADO',
        }),
      );
    });
  });

  describe('findStats', () => {
    it('should return counts per estado and criticosActivos', async () => {
      prisma.reportes_campo.count
        .mockResolvedValueOnce(3)  // pendientes
        .mockResolvedValueOnce(1)  // en revisión
        .mockResolvedValueOnce(2)  // atendidos
        .mockResolvedValueOnce(4)  // resueltos
        .mockResolvedValueOnce(2); // críticos activos

      const result = await service.findStats();

      expect(result).toEqual({
        pendientes: 3,
        enRevision: 1,
        atendidos: 2,
        resueltos: 4,
        criticosActivos: 2,
      });
    });
  });
});
