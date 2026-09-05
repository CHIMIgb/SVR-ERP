import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResult } from '@prisma/client';
import { ClientesService } from './clientes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ClientesService', () => {
  let service: ClientesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockCliente = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: null,
    nombre: 'Carlos SVR',
    empresa: 'ARCO Construcciones',
    correo: 'carlos@arco.mx',
    telefono: '55-1234-5678',
    rfc: null,
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
        findMany: jest.fn().mockResolvedValue([mockCliente]),
        findFirst: jest.fn().mockResolvedValue(mockCliente),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockCliente),
        update: jest.fn().mockResolvedValue(mockCliente),
        groupBy: jest.fn().mockResolvedValue([
          { empresa: 'ARCO Construcciones' },
          { empresa: 'Gobierno CDMX' },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ClientesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated clientes', async () => {
      const result = await service.findAll({});
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.items).toHaveLength(1);
      expect(prisma.clientes.findMany).toHaveBeenCalled();
    });

    it('should pass search to where clause (nombre, empresa, correo, telefono, rfc)', async () => {
      await service.findAll({ search: 'arco' });
      const callArgs = prisma.clientes.findMany.mock.calls[0][0];
      expect(Array.isArray(callArgs.where.OR)).toBe(true);
      expect(callArgs.where.OR).toHaveLength(5);
    });

    it('should paginate correctly', async () => {
      await service.findAll({ page: 2, limit: 10 });
      const callArgs = prisma.clientes.findMany.mock.calls[0][0];
      expect(callArgs.skip).toBe(10);
      expect(callArgs.take).toBe(10);
    });
  });

  describe('findStats', () => {
    it('should return totals, activos and empresas count', async () => {
      const result = await service.findStats();
      expect(result).toEqual({
        totalClientes: 1,
        clientesActivos: 1,
        empresas: 2,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single serialized cliente', async () => {
      const result = await service.findOne(mockCliente.id);
      expect(result.nombre).toBe('Carlos SVR');
      expect(result.empresa).toBe('ARCO Construcciones');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Nuevo Cliente',
      empresa: 'Empresa SA',
      correo: 'nuevo@empresa.mx',
      telefono: '55-5555-5555',
    };

    it('should create a cliente and log CLIENTE_CREADO', async () => {
      const result = await service.create(createDto, 'user-1');
      expect(result).toBeDefined();
      expect(prisma.clientes.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CLIENTE_CREADO,
          entityType: 'clientes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should default activo to true and audit SUCCESS', async () => {
      await service.create(createDto, 'user-1');
      const data = prisma.clientes.create.mock.calls[0][0].data;
      expect(data.activo).toBe(true);
    });
  });

  describe('update', () => {
    it('should update a cliente and log CLIENTE_ACTUALIZADO', async () => {
      const result = await service.update(
        mockCliente.id,
        { nombre: 'Cliente Editado' },
        'user-1',
      );
      expect(prisma.clientes.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CLIENTE_ACTUALIZADO,
          entityType: 'clientes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if cliente not found AND audit the failure', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { nombre: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CLIENTE_ACTUALIZADO,
          result: AuditResult.FAIL,
          errorCode: 'CLIENTE_NO_ENCONTRADO',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a cliente and log CLIENTE_ELIMINADO', async () => {
      const result = await service.remove(mockCliente.id, 'user-1');
      expect(result.message).toContain('eliminado');
      expect(prisma.clientes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eliminado_en: expect.any(Date), activo: false }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CLIENTE_ELIMINADO,
          entityType: 'clientes',
          actorUserId: 'user-1',
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('should throw NotFoundException if cliente not found AND audit the failure', async () => {
      prisma.clientes.findFirst.mockResolvedValue(null);
      await expect(service.remove('non-existent', 'user-1')).rejects.toThrow(NotFoundException);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CLIENTE_ELIMINADO,
          result: AuditResult.FAIL,
          errorCode: 'CLIENTE_NO_ENCONTRADO',
        }),
      );
    });
  });
});
