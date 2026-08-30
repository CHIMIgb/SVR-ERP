import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrabajadoresService } from './trabajadores.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('TrabajadoresService', () => {
  let service: TrabajadoresService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockCategoria = { id: 'cat-uuid-1', nombre: 'Operador' };

  const mockTrabajador = {
    id: 'trab-uuid-1',
    nombre: 'Juan Pérez',
    puesto: 'Operador de Excavadora',
    categoria_puesto_id: mockCategoria.id,
    estado: 'ACTIVO',
    telefono: '55 1234 5678',
    entrada: new Date('1970-01-01T07:00:00'),
    avatar: 'JP',
    sueldo_fiscal: 2500,
    sueldo_efectivo: 3500,
    metodo_pago: 'MIXTO',
    estado_renta: 'EN_OBRA_PROPIA',
    cliente_renta_actual_id: null,
    fecha_contratacion: new Date('2023-01-15'),
    vacaciones_dias: 6,
    horas_extra_semana: null,
    tarifa_hora_extra: null,
    descuentos_semana: null,
    concepto_descuento: null,
    activo: true,
    categorias_puesto: { nombre: 'Operador' },
    licencias_trabajador: null,
    contactos_emergencia: null,
    clientes: null,
    trabajadores_proyectos: [],
  };

  beforeEach(async () => {
    prisma = {
      trabajadores: {
        findMany: jest.fn().mockResolvedValue([mockTrabajador]),
        findFirst: jest.fn().mockResolvedValue(mockTrabajador),
        findUniqueOrThrow: jest.fn().mockResolvedValue(mockTrabajador),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockTrabajador),
        update: jest.fn().mockResolvedValue(mockTrabajador),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      categorias_puesto: {
        findUnique: jest.fn().mockResolvedValue(mockCategoria),
        create: jest.fn().mockResolvedValue(mockCategoria),
      },
      maquinas: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      proyectos: { findFirst: jest.fn().mockResolvedValue(null) },
      licencias_trabajador: { create: jest.fn(), upsert: jest.fn() },
      contactos_emergencia: { create: jest.fn(), upsert: jest.fn() },
      $transaction: jest.fn().mockImplementation((fn) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrabajadoresService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(TrabajadoresService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    nombre: 'Juan Pérez',
    puesto: 'Operador de Excavadora',
    categoriaPuesto: 'Operador' as const,
    telefono: '55 1234 5678',
    entrada: '07:00',
    sueldoFiscal: 2500,
    sueldoEfectivo: 3500,
    metodoPago: 'Mixto' as const,
    ...overrides,
  });

  describe('findAll', () => {
    it('should return paginated trabajadores', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items[0].nombre).toBe('Juan Pérez');
      expect(result.items[0].categoriaPuesto).toBe('Operador');
    });
  });

  describe('create', () => {
    it('should store entrada as the exact clock time regardless of server timezone', async () => {
      await service.create(createDto({ entrada: '07:00' }), 'user-1');
      const createData = prisma.trabajadores.create.mock.calls[0][0].data;
      expect(createData.entrada.toISOString()).toBe('1970-01-01T07:00:00.000Z');
    });

    it('should create a trabajador, auto-creating the categoria if missing', async () => {
      prisma.categorias_puesto.findUnique.mockResolvedValue(null);
      const result = await service.create(createDto(), 'user-1');
      expect(result.nombre).toBe('Juan Pérez');
      expect(prisma.categorias_puesto.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TRABAJADOR_CREADO', result: 'SUCCESS', actorUserId: 'user-1' }),
      );
    });

    it('should reject when the assigned machine does not exist', async () => {
      await expect(service.create(createDto({ maquinaId: 'M999' }), 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'MAQUINA_NO_ENCONTRADA' }));
    });
  });

  describe('update', () => {
    it('should update and audit with previous/new value', async () => {
      prisma.trabajadores.findUniqueOrThrow.mockResolvedValue({ ...mockTrabajador, puesto: 'Operador Senior' });
      const result = await service.update('trab-uuid-1', { puesto: 'Operador Senior' }, 'user-1');
      expect(result.puesto).toBe('Operador Senior');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRABAJADOR_ACTUALIZADO', result: 'SUCCESS' }));
    });

    it('should 404 when the trabajador does not exist', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue(null);
      await expect(service.update('missing', { puesto: 'X' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete, release any assigned machine, and audit', async () => {
      const result = await service.remove('trab-uuid-1', 'user-1');
      expect(result.message).toContain('eliminado');
      expect(prisma.maquinas.updateMany).toHaveBeenCalledWith({ where: { operador_id: 'trab-uuid-1' }, data: { operador_id: null } });
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRABAJADOR_ELIMINADO', result: 'SUCCESS' }));
    });
  });

  describe('liquidar', () => {
    it('should compute severance for Renuncia (finiquito only, no indemnizacion)', async () => {
      const result = await service.liquidar(
        'trab-uuid-1',
        { tipoTerminacion: 'Renuncia', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 },
        'user-1',
      );
      expect(result.subtotalIndemnizaciones).toBe(0);
      expect(result.granTotalNeto).toBeGreaterThan(0);
      expect(prisma.trabajadores.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ estado: 'INACTIVO' }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRABAJADOR_LIQUIDADO', result: 'SUCCESS' }));
    });

    it('should include indemnizacion for Despido', async () => {
      const result = await service.liquidar(
        'trab-uuid-1',
        { tipoTerminacion: 'Despido', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 },
        'user-1',
      );
      expect(result.montoIndemnizacion90Dias).toBeGreaterThan(0);
      expect(result.montoIndemnizacion20DiasPorAno).toBeGreaterThan(0);
    });

    it('should 404 when the trabajador does not exist', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue(null);
      await expect(
        service.liquidar('missing', { tipoTerminacion: 'Renuncia', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
