import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BitacorasRentaService } from './bitacoras-renta.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('BitacorasRentaService', () => {
  let service: BitacorasRentaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockTrabajador = { id: 'trab-uuid-1', nombre: 'Juan Pérez' };
  const mockMaquina = { id: 'maquina-uuid-1', codigo: 'M001', nombre: 'Excavadora CAT 320' };
  const mockCliente = { id: 'cliente-uuid-1', nombre: 'Inmobiliaria ARCO' };

  const mockBitacora = {
    id: 'bit-uuid-1',
    folio: 'BIT-2026-001',
    trabajador_id: mockTrabajador.id,
    maquina_id: mockMaquina.id,
    fecha: new Date('2026-08-20'),
    cliente_id: mockCliente.id,
    obra_ubicacion: 'Fracc. Valle Sur',
    hora_inicio: new Date('1970-01-01T07:00:00'),
    hora_fin: new Date('1970-01-01T17:00:00'),
    horas_efectivas: 8,
    horas_extras: 2,
    horometro_inicial: 1245,
    horometro_final: 1255,
    actividad_realizada: 'Excavación de zanja',
    estado_cobro: 'LISTO_FACTURAR',
    tarifa_hora_renta: 1450,
    importe_total_renta: 14500,
    trabajadores: mockTrabajador,
    maquinas: mockMaquina,
    clientes: mockCliente,
    firmas_cliente: { firmado: true, nombre_residente: 'Ing. Roberto Garza', cargo_residente: 'Residente', fecha_firma: new Date() },
  };

  beforeEach(async () => {
    prisma = {
      bitacoras_renta_diaria: {
        findMany: jest.fn().mockResolvedValue([mockBitacora]),
        findFirst: jest.fn().mockResolvedValue(mockBitacora),
        findUniqueOrThrow: jest.fn().mockResolvedValue(mockBitacora),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(mockBitacora),
        update: jest.fn().mockResolvedValue(mockBitacora),
      },
      trabajadores: { findFirst: jest.fn().mockResolvedValue(mockTrabajador) },
      maquinas: { findFirst: jest.fn().mockResolvedValue(mockMaquina) },
      clientes: { findFirst: jest.fn().mockResolvedValue(mockCliente), create: jest.fn().mockResolvedValue(mockCliente) },
      firmas_cliente: { create: jest.fn(), upsert: jest.fn() },
      $transaction: jest.fn().mockImplementation((fn) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BitacorasRentaService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(BitacorasRentaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const createDto = (overrides: Record<string, unknown> = {}) => ({
    trabajadorId: mockTrabajador.id,
    maquinaId: 'M001',
    fecha: '2026-08-20',
    cliente: 'Inmobiliaria ARCO',
    obraUbicacion: 'Fracc. Valle Sur',
    horaInicio: '07:00',
    horaFin: '17:00',
    horasEfectivas: 8,
    horasExtras: 2,
    horometroInicial: 1245,
    horometroFinal: 1255,
    actividadRealizada: 'Excavación de zanja',
    tarifaHoraRenta: 1450,
    ...overrides,
  });

  describe('findAll', () => {
    it('should return paginated bitacoras', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.items[0].folio).toBe('BIT-2026-001');
    });
  });

  describe('create', () => {
    it('should store horaInicio/horaFin as the exact clock time regardless of server timezone', async () => {
      await service.create(createDto({ horaInicio: '07:00', horaFin: '17:00' }), 'user-1');
      const createData = prisma.bitacoras_renta_diaria.create.mock.calls[0][0].data;
      expect(createData.hora_inicio.toISOString()).toBe('1970-01-01T07:00:00.000Z');
      expect(createData.hora_fin.toISOString()).toBe('1970-01-01T17:00:00.000Z');
    });

    it('should create a bitacora with server-computed importe', async () => {
      const result = await service.create(createDto(), 'user-1');
      expect(result.trabajadorNombre).toBe('Juan Pérez');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BITACORA_RENTA_CREADA', result: 'SUCCESS', actorUserId: 'user-1' }),
      );
    });

    it('should reject when horometroFinal < horometroInicial', async () => {
      await expect(
        service.create(createDto({ horometroInicial: 2000, horometroFinal: 1000 }), 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'HOROMETRO_INVALIDO' }));
    });

    it('should reject when the trabajador does not exist', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto(), 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should reject when the machine does not exist', async () => {
      prisma.maquinas.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto(), 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should auto-create the cliente when it does not exist', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await service.create(createDto({ cliente: 'Cliente Nuevo SA' }), 'user-1');
      expect(prisma.clientes.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete and audit', async () => {
      const result = await service.remove('bit-uuid-1', 'user-1');
      expect(result.message).toContain('eliminada');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BITACORA_RENTA_ELIMINADA', result: 'SUCCESS' }));
    });

    it('should 404 when the bitacora does not exist', async () => {
      prisma.bitacoras_renta_diaria.findFirst.mockResolvedValue(null);
      await expect(service.remove('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
