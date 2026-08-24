import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Turno, AuditAction, AuditResult } from '@prisma/client';
import { CribaService } from './criba.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CribaService', () => {
  let service: CribaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockTrabajador = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nombre: 'Juan Pérez',
    activo: true,
    eliminado_en: null,
  };

  const mockRegistro = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: null,
    fecha: new Date('2026-08-15'),
    turno: Turno.MATUTINO,
    operador_id: mockTrabajador.id,
    tipo_material: 'Criba fina',
    material_producido: 320,
    horas_trabajadas: 8,
    material_al_banco: 290,
    observaciones: null,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: 'user-1',
    actualizado_por: 'user-1',
    eliminado_en: null,
    trabajadores: { id: mockTrabajador.id, nombre: mockTrabajador.nombre },
  };

  beforeEach(async () => {
    prisma = {
      registros_criba: {
        findMany: jest.fn().mockResolvedValue([mockRegistro]),
        findFirst: jest.fn().mockResolvedValue(mockRegistro),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockRegistro),
        update: jest.fn().mockResolvedValue(mockRegistro),
        groupBy: jest.fn().mockResolvedValue([
          {
            tipo_material: 'Criba fina',
            _sum: { material_producido: 600, material_al_banco: 570, horas_trabajadas: 16 },
          },
          {
            tipo_material: 'Arena lavada',
            _sum: { material_producido: 400, material_al_banco: 300, horas_trabajadas: 8 },
          },
        ]),
      },
      trabajadores: {
        findFirst: jest.fn().mockResolvedValue(mockTrabajador),
        findMany: jest.fn().mockResolvedValue([mockTrabajador]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CribaService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(CribaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated registros', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(prisma.registros_criba.findMany).toHaveBeenCalled();
    });

    it('should pass search to where clause (material, observaciones, operador)', async () => {
      await service.findAll({ search: 'fina' });
      const callArgs = prisma.registros_criba.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('should pass turno, tipoMaterial and date range filters', async () => {
      await service.findAll({
        turno: Turno.MATUTINO,
        tipoMaterial: 'Arena lavada',
        fechaDesde: '2026-08-01',
        fechaHasta: '2026-08-31',
      });
      const callArgs = prisma.registros_criba.findMany.mock.calls[0][0];
      expect(callArgs.where.turno).toBe(Turno.MATUTINO);
      expect(callArgs.where.tipo_material).toBe('Arena lavada');
      expect(callArgs.where.fecha.gte).toBeDefined();
      expect(callArgs.where.fecha.lte).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a single serialized registro', async () => {
      const result = await service.findOne(mockRegistro.id);
      expect(result.turno).toBe('Matutino');
      expect(result.operador).toBe('Juan Pérez');
      expect(result.fecha).toBe('2026-08-15');
      expect(result.materialProducido).toBe(320);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.registros_criba.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      fecha: '2026-08-20',
      turno: Turno.VESPERTINO,
      operadorId: mockTrabajador.id,
      tipoMaterial: 'Criba gruesa',
      materialProducido: 250,
      horasTrabajadas: 8,
      materialAlBanco: 220,
    };

    it('should create a registro and log REGISTRO_CRIBA_CREADO', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result).toBeDefined();
      expect(prisma.registros_criba.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REGISTRO_CRIBA_CREADO,
          entityType: 'registros_criba',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw BadRequestException when alBanco > producido', async () => {
      await expect(
        service.create({ ...createDto, materialAlBanco: 300 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trabajador not found', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow creating without operadorId', async () => {
      const dtoSinOperador: Record<string, unknown> = { ...createDto };
      delete dtoSinOperador.operadorId;
      await service.create(dtoSinOperador as typeof createDto, 'user-1');
      const data = prisma.registros_criba.create.mock.calls[0][0].data;
      expect(data.operador_id).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a registro and log REGISTRO_CRIBA_ACTUALIZADO', async () => {
      const result = await service.update(
        mockRegistro.id,
        { materialAlBanco: 310 },
        'user-1',
      );
      expect(prisma.registros_criba.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REGISTRO_CRIBA_ACTUALIZADO,
          entityType: 'registros_criba',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should validate effective values after merge (dto + existing)', async () => {
      // producido existente=320; si DTO baja alBanco no falla, pero subirlo a 400 sí
      await expect(
        service.update(mockRegistro.id, { materialAlBanco: 400 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if registro not found', async () => {
      prisma.registros_criba.findFirst.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { materialAlBanco: 100 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a registro and log REGISTRO_CRIBA_ELIMINADO', async () => {
      const result = await service.remove(mockRegistro.id, 'user-1');
      expect(result.message).toContain('eliminado');
      expect(prisma.registros_criba.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eliminado_en: expect.any(Date), activo: false }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REGISTRO_CRIBA_ELIMINADO,
          entityType: 'registros_criba',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if registro not found', async () => {
      prisma.registros_criba.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findStats', () => {
    it('should compute totals, global eficiencia and per-material stats', async () => {
      const result = await service.findStats();

      expect(result.totalProducido).toBe(1000); // 600 + 400
      expect(result.totalAlBanco).toBe(870);     // 570 + 300
      expect(result.totalHoras).toBe(24);        // 16 + 8
      expect(result.eficiencia).toBe(87);        // round(870/1000*100)

      const fina = result.porMaterial.find((m) => m.tipo === 'Criba fina');
      const arena = result.porMaterial.find((m) => m.tipo === 'Arena lavada');
      expect(fina?.ef).toBe(95); // round(570/600*100)
      expect(arena?.ef).toBe(75); // round(300/400*100)
    });

    it('should return zeros when there are no registros', async () => {
      prisma.registros_criba.groupBy.mockResolvedValue([]);
      const result = await service.findStats();
      expect(result).toEqual({
        totalProducido: 0,
        totalAlBanco: 0,
        totalHoras: 0,
        eficiencia: 0,
        porMaterial: [],
      });
    });
  });

  describe('findCatalogos', () => {
    it('should return trabajadores catalog', async () => {
      const result = await service.findCatalogos();
      expect(result).toHaveProperty('trabajadores');
      expect(result.trabajadores).toHaveLength(1);
    });
  });
});
