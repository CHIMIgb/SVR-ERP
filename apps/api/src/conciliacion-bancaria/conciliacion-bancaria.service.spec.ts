import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { TipoTransaccion, AuditAction, AuditResult, Prisma } from '@prisma/client';
import { ConciliacionBancariaService } from './conciliacion-bancaria.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ConciliacionBancariaService', () => {
  let service: ConciliacionBancariaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
  const BANCO_ID = '550e8400-e29b-41d4-a716-446655440002';
  const CUENTA_ID = '550e8400-e29b-41d4-a716-446655440003';
  const MOVIMIENTO_ID = '550e8400-e29b-41d4-a716-446655440004';
  const TRX_ID = '550e8400-e29b-41d4-a716-446655440005';

  const mockMovimiento = {
    id: MOVIMIENTO_ID,
    cuenta_id: CUENTA_ID,
    fecha: new Date('2026-09-01'),
    descripcion: 'Depósito cliente',
    deposito: 5000,
    retiro: null,
    conciliado: false,
    transaccion_id: null,
    conciliado_en: null,
    conciliado_por: null,
    creado_en: new Date(),
    actualizado_en: new Date(),
    creado_por: null,
  };

  const mockTransaccion = {
    id: TRX_ID,
    codigo: 'TRX-001',
    tipo: TipoTransaccion.INGRESO,
    categoria: 'Anticipo de Cliente',
    monto: 5000,
    fecha: new Date('2026-09-01'),
    descripcion: 'Anticipo',
    activo: true,
    eliminado_en: null,
  };

  const errorP2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: 'x',
  });

  beforeEach(async () => {
    prisma = {
      bancos: {
        findMany: jest.fn().mockResolvedValue([{ id: BANCO_ID, nombre: 'BBVA', activo: true }]),
        findFirst: jest.fn().mockResolvedValue({ id: BANCO_ID }),
        create: jest.fn().mockResolvedValue({ id: BANCO_ID, nombre: 'BBVA', activo: true }),
      },
      cuentas_bancarias: {
        findMany: jest.fn().mockResolvedValue([
          { id: CUENTA_ID, banco_id: BANCO_ID, numero: '0123456789', nombre: null, saldo_inicial: 0, activo: true },
        ]),
        findFirst: jest.fn().mockResolvedValue({ id: CUENTA_ID }),
        create: jest.fn().mockResolvedValue({ id: CUENTA_ID, banco_id: BANCO_ID, numero: '0123456789', nombre: null, saldo_inicial: 0, activo: true }),
      },
      movimientos_bancarios: {
        findMany: jest.fn().mockResolvedValue([mockMovimiento]),
        findUnique: jest.fn().mockResolvedValue(mockMovimiento),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockMovimiento),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ ...mockMovimiento, conciliado: false }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      transacciones: {
        findFirst: jest.fn().mockResolvedValue(mockTransaccion),
        findMany: jest.fn().mockResolvedValue([mockTransaccion]),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConciliacionBancariaService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ConciliacionBancariaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listarBancos', () => {
    it('should return active bancos serialized', async () => {
      const result = await service.listarBancos();
      expect(result).toEqual([{ id: BANCO_ID, nombre: 'BBVA', activo: true }]);
      expect(prisma.bancos.findMany).toHaveBeenCalledWith({ where: { activo: true }, orderBy: { nombre: 'asc' } });
    });
  });

  describe('crearBanco', () => {
    it('should create banco and audit BANCO_CREADO', async () => {
      await service.crearBanco({ nombre: 'BBVA' }, USER_ID);
      expect(prisma.bancos.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BANCO_CREADO, result: AuditResult.SUCCESS, actorUserId: USER_ID }),
      );
    });

    it('should fail with BANCO_DUPLICADO on P2002', async () => {
      prisma.bancos.create.mockRejectedValue(errorP2002);
      await expect(service.crearBanco({ nombre: 'BBVA' }, USER_ID)).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'BANCO_DUPLICADO', result: AuditResult.FAIL }),
      );
    });
  });

  describe('listarCuentas', () => {
    it('should throw 404 if banco does not exist', async () => {
      prisma.bancos.findFirst.mockResolvedValue(null);
      await expect(service.listarCuentas(BANCO_ID)).rejects.toThrow(NotFoundException);
    });

    it('should return cuentas of the banco', async () => {
      const result = await service.listarCuentas(BANCO_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ bancoId: BANCO_ID, numero: '0123456789' });
    });
  });

  describe('crearCuenta', () => {
    it('should create cuenta and audit CUENTA_BANCARIA_CREADA', async () => {
      await service.crearCuenta(BANCO_ID, { numero: '0123456789' }, USER_ID);
      expect(prisma.cuentas_bancarias.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CUENTA_BANCARIA_CREADA, result: AuditResult.SUCCESS }),
      );
    });

    it('should fail with CUENTA_DUPLICADA on P2002', async () => {
      prisma.cuentas_bancarias.create.mockRejectedValue(errorP2002);
      await expect(service.crearCuenta(BANCO_ID, { numero: '0123456789' }, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CUENTA_DUPLICADA', result: AuditResult.FAIL }),
      );
    });
  });

  describe('listarMovimientos', () => {
    it('should return paginated movimientos with filtros', async () => {
      const result = await service.listarMovimientos(CUENTA_ID, {
        desde: '2026-08-01',
        hasta: '2026-09-30',
        soloNoConciliados: true,
      });
      expect(result).toHaveProperty('items');
      expect(result.pagination.total).toBe(1);
      const callArgs = prisma.movimientos_bancarios.findMany.mock.calls[0][0];
      expect(callArgs.where.cuenta_id).toBe(CUENTA_ID);
      expect(callArgs.where.conciliado).toBe(false);
      expect(callArgs.where.fecha).toBeDefined();
    });
  });

  describe('listarCandidatas', () => {
    it('should return transacciones INGRESO around ±3 días with monto similar', async () => {
      const result = await service.listarCandidatas(MOVIMIENTO_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: TRX_ID, monto: 5000 });
      const callArgs = prisma.transacciones.findMany.mock.calls[0][0];
      expect(callArgs.where.tipo).toBe(TipoTransaccion.INGRESO);
      expect(callArgs.where.fecha).toBeDefined();
    });

    it('should filter EGRESO para un retiro', async () => {
      prisma.movimientos_bancarios.findUnique.mockResolvedValue({
        ...mockMovimiento,
        deposito: null,
        retiro: 3000,
        descripcion: 'Pago proveedor',
      });
      await service.listarCandidatas(MOVIMIENTO_ID);
      const callArgs = prisma.transacciones.findMany.mock.calls[0][0];
      expect(callArgs.where.tipo).toBe(TipoTransaccion.EGRESO);
    });

    it('debe excluir transacciones ya enlazadas a otro movimiento (Blocker #5)', async () => {
      prisma.movimientos_bancarios.findMany.mockResolvedValueOnce([{ transaccion_id: TRX_ID }]);
      const result = await service.listarCandidatas(MOVIMIENTO_ID);
      expect(result).toHaveLength(0);
    });

    it('debe incluir la transacción si ningún movimiento la tiene enlazada', async () => {
      // findMany por defecto devuelve [mockMovimiento] con transaccion_id: null.
      const result = await service.listarCandidatas(MOVIMIENTO_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: TRX_ID });
    });
  });

  describe('crearMovimiento', () => {
    it('should create movimiento and audit MOVIMIENTO_BANCARIO_CREADO', async () => {
      await service.crearMovimiento(CUENTA_ID, { fecha: '2026-09-01', descripcion: 'Depósito', deposito: 5000 }, USER_ID);
      expect(prisma.movimientos_bancarios.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.MOVIMIENTO_BANCARIO_CREADO, result: AuditResult.SUCCESS }),
      );
    });

    it('should fail with MONTO_AMBOS when both deposito and retiro', async () => {
      await expect(
        service.crearMovimiento(CUENTA_ID, { fecha: '2026-09-01', descripcion: 'X', deposito: 1, retiro: 2 }, USER_ID),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'MONTO_AMBOS', result: AuditResult.FAIL }),
      );
    });

    it('should fail with MONTO_FALTANTE when neither', async () => {
      await expect(
        service.crearMovimiento(CUENTA_ID, { fecha: '2026-09-01', descripcion: 'X' }, USER_ID),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'MONTO_FALTANTE', result: AuditResult.FAIL }),
      );
    });
  });

  describe('cargarLote', () => {
    it('should parse CSV, insertar con skipDuplicates y auditar', async () => {
      const csv = 'fecha,descripcion,deposito,retiro\n2026-09-01,Depósito A,1000,\n2026-09-02,Retiro B,,500\n2026-09-02,Retiro B,,500\n';
      prisma.movimientos_bancarios.createMany.mockResolvedValue({ count: 2 });
      const result = await service.cargarLote(CUENTA_ID, { csv }, USER_ID);
      expect(result).toEqual({ totalMovimientos: 3, insertados: 2, duplicados: 1, descartadas: [] });
      expect(prisma.movimientos_bancarios.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.MOVIMIENTO_BANCARIO_LOTE_CARGADO, result: AuditResult.SUCCESS }),
      );
    });

    it('should ignore BOM, header opcional y lineas inválidas', async () => {
      const csv = '\uFEFF2026-09-01;Depósito;1000;\nlinea-invalida\n2026-09-02;Retiro;;300\n';
      const result = await service.cargarLote(CUENTA_ID, { csv }, USER_ID);
      expect(result.totalMovimientos).toBe(2);
    });

    it('should fail with CSV_SIN_MOVIMIENTOS_VALIDOS on empty CSV', async () => {
      await expect(service.cargarLote(CUENTA_ID, { csv: 'basura\nsin,datos\n' }, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'CSV_SIN_MOVIMIENTOS_VALIDOS', result: AuditResult.FAIL }),
      );
    });

    it('debe parsear un monto con separador de miles sin corromper (Blocker #4)', async () => {
      const csv = '2026-09-01,Pago proveedor,1,234.56\n';
      prisma.movimientos_bancarios.createMany.mockResolvedValue({ count: 1 });
      const result = await service.cargarLote(CUENTA_ID, { csv }, USER_ID);
      expect(result).toEqual({ totalMovimientos: 1, insertados: 1, duplicados: 0, descartadas: [] });
      const data = prisma.movimientos_bancarios.createMany.mock.calls[prisma.movimientos_bancarios.createMany.mock.calls.length - 1][0].data;
      expect(data[0]).toMatchObject({ descripcion: 'Pago proveedor', deposito: 1234.56, retiro: null });
    });

    it('debe respetar comillas en descripciones y montos (RFC 4180)', async () => {
      const csv =
        '2026-09-01,"Pago, proveedor","1,234.56",\n2026-09-02,"Factura ""X""",,500.25\n';
      prisma.movimientos_bancarios.createMany.mockResolvedValue({ count: 2 });
      const result = await service.cargarLote(CUENTA_ID, { csv }, USER_ID);
      expect(result.totalMovimientos).toBe(2);
      const data = prisma.movimientos_bancarios.createMany.mock.calls[prisma.movimientos_bancarios.createMany.mock.calls.length - 1][0].data;
      expect(data[0]).toMatchObject({ descripcion: 'Pago, proveedor', deposito: 1234.56, retiro: null });
      expect(data[1]).toMatchObject({ descripcion: 'Factura "X"', retiro: 500.25 });
    });

    it('debe descartar y REPORTAR filas con ambos montos o sin montos (paridad con crearMovimiento)', async () => {
      const csv =
        '2026-09-01,Ambos,1000,500\n2026-09-02,Sin monto,,\n2026-09-03,Válido,,300\n';
      prisma.movimientos_bancarios.createMany.mockResolvedValue({ count: 1 });
      const result = await service.cargarLote(CUENTA_ID, { csv }, USER_ID);
      expect(result).toEqual({
        totalMovimientos: 1,
        insertados: 1,
        duplicados: 0,
        descartadas: [
          { linea: 1, motivo: 'MONTO_INVALIDO' },
          { linea: 2, motivo: 'MONTO_INVALIDO' },
        ],
      });
      const data = prisma.movimientos_bancarios.createMany.mock.calls[
        prisma.movimientos_bancarios.createMany.mock.calls.length - 1
      ][0].data;
      expect(data[0]).toMatchObject({ descripcion: 'Válido', retiro: 300 });
    });

    it('debe aceptar fechas latinas DD/MM/YYYY y DD-MM-YYYY y reportar fechas inválidas', async () => {
      const csv =
        '15/01/2026,Depósito latino,1000,\n20-01-2026,Retiro guiones,,500\n31/02/2026,Fecha imposible,100,\nbasura,sin fecha par,,300\n';
      prisma.movimientos_bancarios.createMany.mockResolvedValue({ count: 2 });
      const result = await service.cargarLote(CUENTA_ID, { csv }, USER_ID);
      expect(result).toEqual({
        totalMovimientos: 2,
        insertados: 2,
        duplicados: 0,
        descartadas: [
          { linea: 3, motivo: 'FECHA_INVALIDA' },
          { linea: 4, motivo: 'FECHA_INVALIDA' },
        ],
      });
      const data = prisma.movimientos_bancarios.createMany.mock.calls[
        prisma.movimientos_bancarios.createMany.mock.calls.length - 1
      ][0].data;
      expect(data[0]).toMatchObject({
        descripcion: 'Depósito latino',
        fecha: new Date('2026-01-15T00:00:00'),
      });
      expect(data[1]).toMatchObject({
        descripcion: 'Retiro guiones',
        fecha: new Date('2026-01-20T00:00:00'),
      });
    });

    it('debe mantener el layout de 4 columnas sin unir montos legítimos', async () => {
      const csv = '2026-09-01,Depósito A,1000,\n2026-09-02,Retiro B,,500\n';
      prisma.movimientos_bancarios.createMany.mockResolvedValue({ count: 2 });
      const result = await service.cargarLote(CUENTA_ID, { csv }, USER_ID);
      expect(result).toEqual({ totalMovimientos: 2, insertados: 2, duplicados: 0, descartadas: [] });
      const data = prisma.movimientos_bancarios.createMany.mock.calls[prisma.movimientos_bancarios.createMany.mock.calls.length - 1][0].data;
      expect(data[0]).toMatchObject({ descripcion: 'Depósito A', deposito: 1000, retiro: null });
      expect(data[1]).toMatchObject({ descripcion: 'Retiro B', deposito: null, retiro: 500 });
    });
  });

  describe('conciliar', () => {
    it('should conciliar movimiento and audit MOVIMIENTO_CONCILIADO', async () => {
      const result = await service.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID);
      expect(result).toEqual({ conciliado: true, movimientoId: MOVIMIENTO_ID, transaccionId: TRX_ID, monto: 5000 });
      expect(prisma.movimientos_bancarios.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: MOVIMIENTO_ID, conciliado: false, transaccion_id: null } }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.MOVIMIENTO_CONCILIADO, result: AuditResult.SUCCESS }),
      );
    });

    it('should fail with MOVIMIENTO_YA_CONCILIADO if ya conciliado', async () => {
      prisma.movimientos_bancarios.findUnique.mockResolvedValue({ ...mockMovimiento, conciliado: true });
      await expect(service.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'MOVIMIENTO_YA_CONCILIADO', result: AuditResult.FAIL }),
      );
    });

    it('should fail with MONTO_NO_COINCIDE if montos differ', async () => {
      prisma.transacciones.findFirst.mockResolvedValue({ ...mockTransaccion, monto: 9999 });
      await expect(service.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'MONTO_NO_COINCIDE', result: AuditResult.FAIL }),
      );
    });

    it('should fail with TIPO_CRUZADO if tipo no coincide', async () => {
      prisma.transacciones.findFirst.mockResolvedValue({ ...mockTransaccion, tipo: TipoTransaccion.EGRESO });
      await expect(service.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'TIPO_CRUZADO', result: AuditResult.FAIL }),
      );
    });

    it('should fail with TRANSACCION_NO_ENCONTRADA if trx missing', async () => {
      prisma.transacciones.findFirst.mockResolvedValue(null);
      await expect(service.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'TRANSACCION_NO_ENCONTRADA', result: AuditResult.FAIL }),
      );
    });

    it('should catch doble clic race with MOVIMIENTO_YA_CONCILIADO', async () => {
      prisma.movimientos_bancarios.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'MOVIMIENTO_YA_CONCILIADO', result: AuditResult.FAIL }),
      );
    });

    it('debe mapear P2002 del índice transaccion_id a TRANSACCION_YA_CONCILIADA (Blocker #5)', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'x',
        meta: {
          driverAdapterError: {
            cause: {
              kind: 'UniqueConstraintViolation',
              originalMessage: 'Unique constraint violated: «movimientos_bancarios_transaccion_id_key»',
            },
          },
        },
      });
      prisma.movimientos_bancarios.updateMany.mockRejectedValue(p2002);
      await expect(service.conciliar(MOVIMIENTO_ID, { transaccionId: TRX_ID }, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'TRANSACCION_YA_CONCILIADA', result: AuditResult.FAIL }),
      );
    });
  });

  describe('desconciliar', () => {
    it('should desconciliar and audit MOVIMIENTO_DESCONCILIADO', async () => {
      prisma.movimientos_bancarios.findUnique.mockResolvedValue({
        ...mockMovimiento,
        conciliado: true,
        transaccion_id: TRX_ID,
      });
      const result = await service.desconciliar(MOVIMIENTO_ID, USER_ID);
      expect(result).toEqual({ conciliado: false, movimientoId: MOVIMIENTO_ID });
      expect(prisma.movimientos_bancarios.update).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.MOVIMIENTO_DESCONCILIADO, result: AuditResult.SUCCESS }),
      );
    });

    it('should fail with MOVIMIENTO_NO_CONCILIADO if no conciliado', async () => {
      await expect(service.desconciliar(MOVIMIENTO_ID, USER_ID)).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ errorCode: 'MOVIMIENTO_NO_CONCILIADO', result: AuditResult.FAIL }),
      );
    });

    it('should throw 404 if movimiento missing', async () => {
      prisma.movimientos_bancarios.findUnique.mockResolvedValue(null);
      await expect(service.desconciliar(MOVIMIENTO_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});