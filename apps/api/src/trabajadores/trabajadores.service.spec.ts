import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        // liquidar() da de baja con updateMany condicional: 1 = ganó la carrera.
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      categorias_puesto: {
        findUnique: jest.fn().mockResolvedValue(mockCategoria),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(mockCategoria),
      },
      maquinas: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: 'maq-1', codigo: 'M001', nombre: 'Excavadora', operador_id: 'trab-uuid-1' }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      proyectos: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
      trabajadores_proyectos: {
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      licencias_trabajador: { create: jest.fn(), upsert: jest.fn() },
      contactos_emergencia: { create: jest.fn(), upsert: jest.fn() },
      roles: {
        findUnique: jest.fn().mockResolvedValue({ id: 'rol-uuid-1', nombre: 'Trabajador', activo: true, eliminado_en: null }),
        // El rol mock pasa el filtro asignable (sin permisos de sistema).
        findFirst: jest.fn().mockResolvedValue({ id: 'rol-uuid-1', nombre: 'Trabajador' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      personas: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
      users_roles: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      users: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
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
    fechaContratacion: '2024-03-01',
    rolId: 'rol-uuid-1',
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

    it('incluye el vínculo con la cuenta de acceso (usuarioId/numeroEmpleado) para "Reiniciar PIN" (PR #18 #6)', async () => {
      prisma.personas.findMany.mockResolvedValue([
        {
          nombre: 'Juan Pérez',
          telefono: '55 1234 5678',
          users_users_persona_idTopersonas: {
            id: 'user-vinculado',
            numero_empleado: 'TRA-142',
            activo: true,
            eliminado_en: null,
            jefe_user_id: null,
            users_roles_users_roles_user_idTousers: [{ roles: { id: 'rol-uuid-1', nombre: 'Trabajador' } }],
          },
        },
      ]);
      const result = await service.findAll({});
      expect(result.items[0].usuarioId).toBe('user-vinculado');
      expect(result.items[0].numeroEmpleado).toBe('TRA-142');
      expect(result.items[0].rolAccesoId).toBe('rol-uuid-1');
    });

    it('sin persona vinculada: la fila viene sin usuarioId (trabajador sin acceso a la app)', async () => {
      const result = await service.findAll({});
      expect(result.items[0].usuarioId).toBeUndefined();
    });
  });

  describe('método de pago coherente con los sueldos (decisión de Oscar)', () => {
    it('create: "Solo efectivo" with a transfer salary is 400 (audited) and nothing is saved', async () => {
      await expect(service.create(createDto({ metodoPago: 'Efectivo', sueldoFiscal: 2500 }), 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.trabajadores.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'METODO_PAGO_INCOHERENTE' }));
    });

    it('create: "Solo transferencia" with a cash salary is 400', async () => {
      await expect(service.create(createDto({ metodoPago: 'Tarjeta', sueldoEfectivo: 3500 }), 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.trabajadores.create).not.toHaveBeenCalled();
    });

    it('create: "Solo efectivo" with transfer salary 0 is valid', async () => {
      await service.create(createDto({ metodoPago: 'Efectivo', sueldoFiscal: 0, sueldoEfectivo: 6000 }), 'user-1');
      expect(prisma.trabajadores.create).toHaveBeenCalled();
    });

    it('update: checks the resulting combination (changing only the method of a Mixto worker with both salaries is 400)', async () => {
      await expect(service.update('trab-uuid-1', { metodoPago: 'Efectivo' }, 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.trabajadores.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'METODO_PAGO_INCOHERENTE' }));
    });

    it('update: switching to "Solo efectivo" together with transfer salary 0 is valid', async () => {
      await service.update('trab-uuid-1', { metodoPago: 'Efectivo', sueldoFiscal: 0 }, 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRABAJADOR_ACTUALIZADO', result: 'SUCCESS' }));
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

    it('should assign the proyecto when it exists', async () => {
      prisma.proyectos.findFirst.mockResolvedValue({ id: 'proy-1' });
      await service.create(createDto({ proyecto: '  Torre Norte  ' }), 'user-1');
      expect(prisma.proyectos.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { nombre: 'Torre Norte', eliminado_en: null, activo: true } }),
      );
      expect(prisma.trabajadores_proyectos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ proyecto_id: 'proy-1', creado_por: 'user-1' }),
      });
    });

    it('should reject (and not create) when the proyecto does not exist, instead of ignoring it', async () => {
      prisma.proyectos.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto({ proyecto: 'No existe' }), 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.trabajadores.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'PROYECTO_NO_ENCONTRADO' }));
    });
  });

  describe('identidad PWA del alta (P14, spec §6.6)', () => {
    it('crea persona + user con numero_empleado consecutivo, PIN temporal de 24 h y el rol elegido', async () => {
      prisma.users.findMany.mockResolvedValue([{ numero_empleado: 'TRA-141' }]); // el sufijo más alto → el siguiente es TRA-142
      prisma.users.findFirst.mockResolvedValue({ id: 'res-user-1' }); // encargado Residente válido
      const result = await service.create(createDto({ encargadoId: 'res-user-1' }), 'user-1');

      const usersData = prisma.users.create.mock.calls[0][0].data;
      expect(usersData.numero_empleado).toBe('TRA-142');
      expect(usersData.jefe_user_id).toBe('res-user-1');
      expect(usersData.pin_hash).toMatch(/^\$2[aby]\$/); // bcrypt, nunca el PIN en claro
      const venceEn = usersData.pin_temporal_hasta.getTime() - Date.now();
      expect(venceEn).toBeGreaterThan(23.9 * 60 * 60 * 1000);
      expect(venceEn).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      expect(prisma.personas.create).toHaveBeenCalled();
      expect(prisma.users_roles.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ rol_id: 'rol-uuid-1', es_principal: true }),
      });
      // el PIN en claro se entrega UNA vez en la respuesta y NUNCA va a la auditoría
      expect(result.identidad?.numeroEmpleado).toBe('TRA-142');
      expect(result.identidad?.pinTemporal).toMatch(/^[A-Z2-9]{8}$/);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          newValue: expect.not.objectContaining({ pinTemporal: expect.anything() }),
        }),
      );
    });

    it('rechaza un rol inexistente o inactivo (ROL_INVALIDO) sin crear nada', async () => {
      prisma.roles.findUnique.mockResolvedValue(null);
      await expect(service.create(createDto(), 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.trabajadores.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'ROL_INVALIDO' }));
    });

    it('rol no asignable (ej. Administrador): 403 y audita ROL_NO_ASIGNABLE', async () => {
      prisma.roles.findUnique.mockResolvedValue({ id: 'rol-admin', nombre: 'Administrador', activo: true, eliminado_en: null });
      prisma.roles.findFirst.mockResolvedValue(null); // el filtro asignable no lo incluye
      await expect(service.create(createDto({ rolId: 'rol-admin' }), 'user-1')).rejects.toThrow(ForbiddenException);
      expect(prisma.trabajadores.create).not.toHaveBeenCalled();
      expect(prisma.users.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'FAIL', errorCode: 'ROL_NO_ASIGNABLE', severity: 'WARNING' }),
      );
    });

    it('rechaza un encargado que no es Residente activo (ENCARGADO_INVALIDO)', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.create(createDto({ encargadoId: 'no-residente' }), 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.trabajadores.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'ENCARGADO_INVALIDO' }));
    });

    it('ante P2002 del unique reevalúa el consecutivo y reintenta (carrera de dos altas)', async () => {
      const P2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      });
      prisma.users.create
        .mockRejectedValueOnce(P2002)
        .mockResolvedValueOnce({});
      prisma.users.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ numero_empleado: 'TRA-001' }]);

      const result = await service.create(createDto(), 'user-1');
      expect(result.identidad?.numeroEmpleado).toBe('TRA-002');
      expect(prisma.users.create).toHaveBeenCalledTimes(2);
    });

    it('salta los huecos de numeración: toma el sufijo más alto, no un conteo (PR #18 #9)', async () => {
      // Seed demo: TEC-007..010 ya existen pero el conteo daría 4 → TEC-005 colisiona.
      prisma.users.findMany.mockResolvedValue([
        { numero_empleado: 'TEC-007' },
        { numero_empleado: 'TEC-008' },
        { numero_empleado: 'TEC-009' },
        { numero_empleado: 'TEC-010' },
      ]);
      prisma.roles.findUnique.mockResolvedValue({ id: 'rol-t', nombre: 'Tecnico', activo: true, eliminado_en: null });

      const result = await service.create(createDto(), 'user-1');
      expect(result.identidad?.numeroEmpleado).toBe('TEC-011');
    });

    it('tolera anchos mezclados del sufijo (TRA-142 y TRA-0142) y no-numericos', async () => {
      prisma.users.findMany.mockResolvedValue([
        { numero_empleado: 'TRA-142' },
        { numero_empleado: 'TRA-0142' },
        { numero_empleado: 'TRA-XX' }, // ruido: se ignora
      ]);

      const result = await service.create(createDto(), 'user-1');
      expect(result.identidad?.numeroEmpleado).toBe('TRA-143');
    });

    it('SIN rolId: el rol sale del PUESTO (categorias_puesto.rol_id — decisión del SVR)', async () => {
      const dto = createDto();
      delete (dto as { rolId?: string }).rolId;
      prisma.categorias_puesto.findUnique.mockResolvedValue({
        id: 'cat-uuid-1',
        nombre: 'Mecanico',
        torre: 'MECANICO',
        rol_id: 'rol-puesto',
      });
      prisma.roles.findFirst.mockResolvedValue({ id: 'rol-puesto', nombre: 'Tecnico' }); // asignable

      const result = await service.create(dto, 'user-1');
      // el rol validado fue el DEL PUESTO, no un override
      expect(prisma.roles.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'rol-puesto' }) }),
      );
      expect(result.identidad?.numeroEmpleado).toMatch(/^TEC-\d+$/);
      expect(prisma.users_roles.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ rol_id: 'rol-puesto', es_principal: true }),
      });
    });

    it('puesto "Otro" (sin rol): SIN cuenta — ni persona, ni user, ni numero; la respuesta va sin identidad', async () => {
      const dto = createDto();
      delete (dto as { rolId?: string }).rolId;
      prisma.categorias_puesto.findUnique.mockResolvedValue({
        id: 'cat-otro',
        nombre: 'Otro',
        torre: null,
        rol_id: null,
      });

      const result = await service.create(dto, 'user-1');
      expect(result.identidad).toBeUndefined();
      expect(prisma.personas.create).not.toHaveBeenCalled();
      expect(prisma.users.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TRABAJADOR_CREADO',
          result: 'SUCCESS',
          newValue: expect.objectContaining({ acceso: 'sin_cuenta' }),
        }),
      );
    });

    it('sin rol: el encargado del alta se ignora (el jefe vive en la cuenta)', async () => {
      const dto = createDto();
      delete (dto as { rolId?: string }).rolId;
      delete (dto as { encargadoId?: string }).encargadoId;
      const dtoConEncargado = { ...dto, encargadoId: 'res-user-1' };
      prisma.categorias_puesto.findUnique.mockResolvedValue({
        id: 'cat-otro',
        nombre: 'Otro',
        torre: null,
        rol_id: null,
      });

      await service.create(dtoConEncargado as typeof dto, 'user-1');
      // la validación del encargado (users.findFirst por rol Residente) no corre
      expect(prisma.users.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('catalogos', () => {
    it('should return machines with their current operator and active projects', async () => {
      prisma.maquinas.findMany.mockResolvedValue([
        { codigo: 'M001', nombre: 'Excavadora CAT', operador_id: 'trab-uuid-1', trabajadores: { nombre: 'Juan Pérez' } },
        { codigo: 'M002', nombre: 'Volteo', operador_id: null, trabajadores: null },
      ]);
      prisma.proyectos.findMany.mockResolvedValue([{ id: 'proy-1', nombre: 'Torre Norte' }]);

      const result = await service.catalogos();

      expect(result.maquinas).toEqual([
        { codigo: 'M001', nombre: 'Excavadora CAT', operadorId: 'trab-uuid-1', operadorNombre: 'Juan Pérez' },
        { codigo: 'M002', nombre: 'Volteo', operadorId: null, operadorNombre: null },
      ]);
      expect(result.proyectos).toEqual([{ id: 'proy-1', nombre: 'Torre Norte' }]);
      expect(prisma.proyectos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eliminado_en: null, activo: true } }),
      );
      // Roles asignables: sin Administrador ni roles con permisos de sistema (PR #18 #2).
      expect(prisma.roles.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            activo: true,
            eliminado_en: null,
            role_permissions: { none: { permissions: { modulo: 'sistema' } } },
          }),
        }),
      );
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

    it('should not touch project assignments when proyecto is not sent', async () => {
      await service.update('trab-uuid-1', { puesto: 'Operador Senior' }, 'user-1');
      expect(prisma.trabajadores_proyectos.updateMany).not.toHaveBeenCalled();
      expect(prisma.trabajadores_proyectos.create).not.toHaveBeenCalled();
    });

    it('should replace the assignment with the new proyecto (it used to be ignored)', async () => {
      prisma.proyectos.findFirst.mockResolvedValue({ id: 'proy-2' });
      await service.update('trab-uuid-1', { proyecto: 'Puente Sur' }, 'user-1');
      expect(prisma.trabajadores_proyectos.updateMany).toHaveBeenCalledWith({
        where: { trabajador_id: 'trab-uuid-1', eliminado_en: null, proyecto_id: { not: 'proy-2' } },
        data: expect.objectContaining({ activo: false, actualizado_por: 'user-1' }),
      });
      expect(prisma.trabajadores_proyectos.create).toHaveBeenCalledWith({
        data: { trabajador_id: 'trab-uuid-1', proyecto_id: 'proy-2', creado_por: 'user-1' },
      });
    });

    it('should reactivate a previously removed assignment instead of creating a duplicate', async () => {
      prisma.proyectos.findFirst.mockResolvedValue({ id: 'proy-2' });
      prisma.trabajadores_proyectos.findUnique.mockResolvedValue({ eliminado_en: new Date('2026-01-01') });
      await service.update('trab-uuid-1', { proyecto: 'Puente Sur' }, 'user-1');
      expect(prisma.trabajadores_proyectos.create).not.toHaveBeenCalled();
      expect(prisma.trabajadores_proyectos.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eliminado_en: null, activo: true }) }),
      );
    });

    it('should leave an assignment that is already active as is', async () => {
      prisma.proyectos.findFirst.mockResolvedValue({ id: 'proy-2' });
      prisma.trabajadores_proyectos.findUnique.mockResolvedValue({ eliminado_en: null });
      await service.update('trab-uuid-1', { proyecto: 'Puente Sur' }, 'user-1');
      expect(prisma.trabajadores_proyectos.create).not.toHaveBeenCalled();
      expect(prisma.trabajadores_proyectos.update).not.toHaveBeenCalled();
    });

    it('should remove every assignment when proyecto is empty', async () => {
      await service.update('trab-uuid-1', { proyecto: '' }, 'user-1');
      expect(prisma.trabajadores_proyectos.updateMany).toHaveBeenCalledWith({
        where: { trabajador_id: 'trab-uuid-1', eliminado_en: null },
        data: expect.objectContaining({ activo: false }),
      });
      expect(prisma.trabajadores_proyectos.create).not.toHaveBeenCalled();
    });

    it('should 404 and audit when the proyecto does not exist', async () => {
      prisma.proyectos.findFirst.mockResolvedValue(null);
      await expect(service.update('trab-uuid-1', { proyecto: 'No existe' }, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.trabajadores.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'PROYECTO_NO_ENCONTRADO' }));
    });
  });

  describe('acceso a la app desde la edición (PR #18 #8)', () => {
    const vinculo = (over: Record<string, unknown> = {}) => ({
      usuarioId: 'user-vinculado',
      numeroEmpleado: 'TRA-142',
      rolId: 'rol-uuid-1',
      rolNombre: 'Trabajador',
      encargadoUserId: null,
      ...over,
    });

    it('cuenta existente: cambia el rol principal y audita ROL_ASIGNADO con anterior/nuevo', async () => {
      prisma.personas.findMany.mockResolvedValue([
        {
          nombre: mockTrabajador.nombre,
          telefono: mockTrabajador.telefono,
          users_users_persona_idTopersonas: {
            id: 'user-vinculado',
            numero_empleado: 'TRA-142',
            activo: true,
            eliminado_en: null,
            jefe_user_id: null,
            users_roles_users_roles_user_idTousers: [{ roles: { id: 'rol-uuid-1', nombre: 'Trabajador' } }],
          },
        },
      ]);
      prisma.roles.findFirst.mockResolvedValue({ id: 'rol-nuevo', nombre: 'Cobrador' }); // rol asignable
      prisma.users_roles.findFirst.mockResolvedValue({ id: 'ur-principal', rol_id: 'rol-uuid-1' }); // fila principal actual

      await service.update('trab-uuid-1', { acceso: { rolId: 'rol-nuevo' } }, 'user-1');

      expect(prisma.users_roles.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { rol_id: 'rol-nuevo', asignado_por: 'user-1' } }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ROL_ASIGNADO',
          entityId: 'user-vinculado',
          previousValue: { rolId: 'rol-uuid-1' },
          newValue: { rolId: 'rol-nuevo', rolNombre: 'Cobrador' },
        }),
      );
    });

    it('cuenta existente: cambia el jefe y solo toca jefe si el campo viene (PR #18 #8)', async () => {
      prisma.personas.findMany.mockResolvedValue([
        {
          nombre: mockTrabajador.nombre,
          telefono: mockTrabajador.telefono,
          users_users_persona_idTopersonas: {
            id: 'user-vinculado',
            numero_empleado: 'TRA-142',
            activo: true,
            eliminado_en: null,
            jefe_user_id: null,
            users_roles_users_roles_user_idTousers: [],
          },
        },
      ]);
      prisma.users_roles.findFirst.mockResolvedValue(null); // sin fila principal → la crea
      prisma.users.findFirst.mockResolvedValue({ id: 'res-user-1' }); // encargado Residente válido

      await service.update('trab-uuid-1', { acceso: { rolId: 'rol-uuid-1', encargadoId: 'res-user-1' } }, 'user-1');
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-vinculado' },
          data: expect.objectContaining({ jefe_user_id: 'res-user-1' }),
        }),
      );

      // sin encargado en el DTO: no toca el jefe
      prisma.users.update.mockClear();
      await service.update('trab-uuid-1', { acceso: { rolId: 'rol-uuid-1' } }, 'user-1');
      expect(prisma.users.update).not.toHaveBeenCalled();
    });

    it('sin cuenta: crea la identidad (persona + user + temporal) y la devuelve en la respuesta', async () => {
      // sin persona vinculada → no hay cuenta
      const result = await service.update('trab-uuid-1', { acceso: { rolId: 'rol-uuid-1' } }, 'user-1');
      expect(result.identidad).toBeDefined();
      expect(result.identidad?.numeroEmpleado).toMatch(/^TRA-\d+$/);
      expect(result.identidad?.pinTemporal).toMatch(/^[A-Z2-9]{8}$/);
      expect(prisma.personas.create).toHaveBeenCalled();
      expect(prisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numero_empleado: expect.any(String),
            pin_hash: expect.stringMatching(/^\$2[aby]\$/),
          }),
        }),
      );
      // el temporal en claro NUNCA va a la auditoría (§8.9)
      expect(JSON.stringify(mockAudit.log.mock.calls)).not.toContain(result.identidad!.pinTemporal);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USUARIO_CREADO', result: 'SUCCESS' }),
      );
    });

    it('rol no asignable (ej. Administrador): 403/400 ACCESO_ROL_INVALIDO auditado, sin crear nada', async () => {
      prisma.roles.findFirst.mockResolvedValue(null); // el filtro asignable no lo incluye
      await expect(
        service.update('trab-uuid-1', { acceso: { rolId: 'rol-admin' } }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'FAIL', errorCode: 'ACCESO_ROL_INVALIDO' }),
      );
      expect(prisma.personas.create).not.toHaveBeenCalled();
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('encargado que no es Residente: ENCARGADO_INVALIDO auditado', async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(
        service.update('trab-uuid-1', { acceso: { rolId: 'rol-uuid-1', encargadoId: 'no-residente' } }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'FAIL', errorCode: 'ENCARGADO_INVALIDO' }),
      );
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
      expect(prisma.trabajadores.updateMany).toHaveBeenCalledWith({
        where: { id: 'trab-uuid-1', eliminado_en: null, estado: { not: 'INACTIVO' } },
        data: expect.objectContaining({ estado: 'INACTIVO' }),
      });
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

    it('should 400 and audit when there is no fecha de contratacion (no invented seniority)', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, fecha_contratacion: null });
      await expect(
        service.liquidar('trab-uuid-1', { tipoTerminacion: 'Despido', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.trabajadores.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'SIN_FECHA_CONTRATACION' }));
    });

    it('should 409 and audit when the trabajador was already dado de baja (no second finiquito)', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, estado: 'INACTIVO' });
      await expect(
        service.liquidar('trab-uuid-1', { tipoTerminacion: 'Renuncia', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.trabajadores.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TRABAJADOR_LIQUIDADO', result: 'FAIL', errorCode: 'TRABAJADOR_YA_INACTIVO' }),
      );
    });

    it('should 409 when another request gave the baja first (conditional update matched nothing)', async () => {
      prisma.trabajadores.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.liquidar('trab-uuid-1', { tipoTerminacion: 'Renuncia', diasTrabajadosPeriodo: 6, diasVacacionesPendientes: 8 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
      // La máquina solo se libera si esta petición ganó la baja.
      expect(prisma.maquinas.updateMany).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'TRABAJADOR_YA_INACTIVO' }));
      expect(mockAudit.log).not.toHaveBeenCalledWith(expect.objectContaining({ result: 'SUCCESS' }));
    });
  });

  describe('reglas de baja y asignación', () => {
    it('create: rejects a future fecha de ingreso', async () => {
      await expect(service.create(createDto({ fechaContratacion: '2999-01-01' }), 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.trabajadores.create).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAIL', errorCode: 'FECHA_INGRESO_FUTURA' }));
    });

    it('create: records the operator that lost the machine', async () => {
      prisma.maquinas.findFirst.mockResolvedValue({ id: 'maq-1', codigo: 'M001', operador_id: 'otro-operador' });
      await service.create(createDto({ maquinaId: 'M001' }), 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'SUCCESS',
          metadata: { maquinaReasignada: 'M001', operadorDesplazadoId: 'otro-operador' },
        }),
      );
    });

    it('update: estado Inactivo only through liquidar', async () => {
      await expect(service.update('trab-uuid-1', { estado: 'Inactivo' }, 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.trabajadores.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'BAJA_SOLO_CON_LIQUIDACION' }));
    });

    it('update: a dado de baja cannot be reactivated nor get a machine or project', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, estado: 'INACTIVO' });
      for (const dto of [{ estado: 'Activo' as const }, { maquinaId: 'M001' }, { proyecto: 'Torre Norte' }]) {
        await expect(service.update('trab-uuid-1', dto, 'user-1')).rejects.toThrow(ConflictException);
      }
      expect(prisma.trabajadores.update).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'TRABAJADOR_DADO_DE_BAJA' }));
    });

    it('update: a dado de baja can still get its data corrected', async () => {
      prisma.trabajadores.findFirst.mockResolvedValue({ ...mockTrabajador, estado: 'INACTIVO' });
      await service.update('trab-uuid-1', { telefono: ' 55 9999 0000 ' }, 'user-1');
      expect(prisma.trabajadores.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ telefono: '55 9999 0000' }) }),
      );
    });

    it('update: rejects a future fecha de ingreso', async () => {
      await expect(service.update('trab-uuid-1', { fechaContratacion: '2999-01-01' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'FECHA_INGRESO_FUTURA' }));
    });

    it('update: records the operator that lost the machine', async () => {
      prisma.maquinas.findFirst
        .mockResolvedValueOnce(null) // máquina anterior del trabajador
        .mockResolvedValueOnce({ id: 'maq-1', codigo: 'M001', operador_id: 'otro-operador' });
      await service.update('trab-uuid-1', { maquinaId: 'M001' }, 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { maquinaReasignada: 'M001', operadorDesplazadoId: 'otro-operador' } }),
      );
    });
  });
});
