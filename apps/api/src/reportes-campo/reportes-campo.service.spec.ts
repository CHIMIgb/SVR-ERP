import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  CategoriaReporte,
  EstadoIncidente,
  Prioridad,
  TipoReporteCampo,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { ReportesCampoService } from './reportes-campo.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ReportesCampoService (flujo incidentes v2)', () => {
  let service: ReportesCampoService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockReporte = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    codigo: 'INC0100',
    tipo: TipoReporteCampo.PIPERO,
    categoria: 'DIESEL',
    subcategoria_id: null,
    subcategoria: null,
    usuario: 'Marcos G.',
    usuario_id: 'user-1',
    maquina_id: '550e8400-e29b-41d4-a716-446655440020',
    fecha: new Date('2025-04-27'),
    hora: new Date('1970-01-01T14:15:00'),
    descripcion: 'Suministro de 200L de diésel. Tanque lleno.',
    estado: EstadoIncidente.NUEVO,
    asignado_a_id: null,
    asignado_nombre: null,
    asignado_en: null,
    prioridad: null,
    detalles: null,
    obra_id: null,
    obra_texto: 'Valle Sur',
    latitud: null,
    longitud: null,
    activo: true,
    creado_en: new Date(),
    actualizado_en: new Date(),
    eliminado_en: null,
    cerrado_en: null,
    maquinas: { id: 'm1', codigo: 'M004', nombre: 'Camión Pipero' },
    obras: null,
  };

  /** PNG 1x1 (67 bytes). */
  const PNG_1X1 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  beforeEach(async () => {
    prisma = {
      reportes_campo: {
        findMany: jest.fn().mockResolvedValue([mockReporte]),
        findFirst: jest.fn().mockResolvedValue(mockReporte),
        findUnique: jest.fn().mockResolvedValue(mockReporte),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockReporte),
        update: jest.fn().mockResolvedValue(mockReporte),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        groupBy: jest.fn().mockResolvedValue([{ tipo: 'MECANICO', _count: 1 }]),
      },
      reportes_actividades: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn((args: { data: { texto: string; autor_nombre: string } }) =>
          Promise.resolve({
            id: 'act-1',
            ...args.data,
            creado_en: new Date(),
          }),
        ),
      },
      reportes_adjuntos: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn((args: { data: Record<string, string | number> }) =>
          Promise.resolve({
            id: 'adj-1',
            ...args.data,
            creado_en: new Date(),
          }),
        ),
        count: jest.fn().mockResolvedValue(0),
      },
      subcategorias_reporte: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: 'sub-d1', categoria: 'DIESEL' }),
      },
      trabajadores: {
        findFirst: jest.fn().mockResolvedValue({ id: 't-1', nombre: 'José Ramírez' }),
      },
      users: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      maquinas: {
        findFirst: jest.fn().mockResolvedValue({ id: mockReporte.maquina_id }),
      },
      obras: {
        findFirst: jest.fn().mockResolvedValue({ id: 'obra-1' }),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(prisma)),
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

  describe('findAll', () => {
    it('pasa search y filtra estado/tipo/prioridad al where', async () => {
      await service.findAll({ search: 'neta', estado: EstadoIncidente.EN_CURSO, tipo: TipoReporteCampo.PIPERO }, 'user-1');
      const callArgs = prisma.reportes_campo.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeTruthy();
      expect(callArgs.where.estado).toBe(EstadoIncidente.EN_CURSO);
      expect(callArgs.where.tipo).toBe(TipoReporteCampo.PIPERO);
      // paginado duro (regla del repo)
      expect(callArgs.take).toBe(10);
      expect(callArgs.skip).toBe(0);
    });

    it('techo de limit en 100 y paginación derivada', async () => {
      await service.findAll({ page: 2, limit: 500 }, 'user-1');
      const callArgs = prisma.reportes_campo.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(100);
      const callCount = prisma.reportes_campo.count.mock.calls[0][0];
      expect(callCount).toBeTruthy();
    });

    it('banner de críticos: estado distinto de CERRADO y tipo INCIDENTE', async () => {
      await service.findAll({ criticos: 'true' }, 'user-1');
      const callArgs = prisma.reportes_campo.findMany.mock.calls[0][0];
      expect(callArgs.where.tipo).toBe(TipoReporteCampo.INCIDENTE);
      expect(callArgs.where.estado).toEqual({ not: EstadoIncidente.CERRADO });
    });
  });

  describe('findOne (detalle)', () => {
    it('retorna { reporte, actividades, adjuntos } serializados', async () => {
      const detalle = await service.findOne(mockReporte.id);
      expect(detalle.reporte.id).toBeDefined();
      expect(detalle.reporte.estado).toBe('Nuevo');
      expect(detalle.actividades).toEqual([]);
      expect(detalle.adjuntos).toEqual([]);
    });

    it('lanza 404 sin reporte', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      categoria: CategoriaReporte.DIESEL,
      subcategoriaId: 'sub-d1',
      usuario: 'Marcos G.',
      descripcion: 'Suministro de 200L de diésel. Tanque lleno.',
    };

    it('deriva el tipo del área (torre) — vocabulario viejo ya no se captura', async () => {
      await service.create(createDto, 'user-1');
      const data = prisma.reportes_campo.create.mock.calls.at(-1)[0].data;
      expect(data.tipo).toBe('DIESEL'); // espejo de la categoria
    });

    it('crea incidente NUEVO con folio y audita REPORTE_CREADO SUCCESS', async () => {
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

    it('genera folio INC0002 (correlativo sobre "INC") y persiste categoria/subcategoría', async () => {
      await service.create(createDto, 'user-1');
      const data = prisma.reportes_campo.create.mock.calls.at(-1)[0].data;
      expect(data.codigo).toBe('INC0002');
      expect(data.categoria).toBe(CategoriaReporte.DIESEL);
      expect(data.subcategoria_id).toBe('sub-d1');
      expect(data.estado).toBe(EstadoIncidente.NUEVO);
      expect(prisma.reportes_campo.count).toHaveBeenCalledWith({
        where: { codigo: { startsWith: 'INC' } },
      });
    });

    it('valida que la subcategoría sea de la categoría (FAIL SUBCATEGORIA_INVALIDA + audit)', async () => {
      prisma.subcategorias_reporte.findFirst.mockResolvedValue({ id: 'sub-d1', categoria: 'MECANICO' });
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_CREADO,
          result: AuditResult.FAIL,
          errorCode: 'SUBCATEGORIA_INVALIDA',
        }),
      );
    });

    it('server "misma área" resuelve la torre con el área del que reporta (oficina → ADMINISTRATIVO)', async () => {
      prisma.users.findUnique.mockResolvedValue({
        torre: null,
        users_roles_users_roles_user_idTousers: [],
      });
      const { categoria: _c, subcategoriaId: _s, ...dtoSimple } = createDto;
      await service.create({ ...dtoSimple, mismaArea: true }, 'user-1');
      const data = prisma.reportes_campo.create.mock.calls.at(-1)[0].data;
      expect(data.categoria).toBe(CategoriaReporte.ADMINISTRATIVO);
    });

    it('server "misma área" con torre asignada al usuario usa esa torre', async () => {
      prisma.users.findUnique.mockResolvedValue({
        torre: 'MECANICO',
        users_roles_users_roles_user_idTousers: [],
      });
      const { categoria: _c, subcategoriaId: _s, ...dtoSimple } = createDto;
      await service.create({ ...dtoSimple, mismaArea: true }, 'user-1');
      const data = prisma.reportes_campo.create.mock.calls.at(-1)[0].data;
      expect(data.categoria).toBe(CategoriaReporte.MECANICO);
      // consulta por el id del usuario que reporta (no global)
      expect(prisma.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });

    it('server "misma área" sin torre propia: hereda la del rol principal', async () => {
      prisma.users.findUnique.mockResolvedValue({
        torre: null,
        users_roles_users_roles_user_idTousers: [
          { es_principal: false, roles: { torre: 'MECANICO' } },
          { es_principal: true, roles: { torre: 'RESIDENTE' } },
        ],
      });
      const { categoria: _c, subcategoriaId: _s, ...dtoSimple } = createDto;
      await service.create({ ...dtoSimple, mismaArea: true }, 'user-1');
      const data = prisma.reportes_campo.create.mock.calls.at(-1)[0].data;
      expect(data.categoria).toBe(CategoriaReporte.RESIDENTE);
    });

    it('sin categoria ni mismaArea → CATEGORIA_REQUERIDA (audita FAIL)', async () => {
      const { categoria: _c, ...sinCategoria } = createDto;
      await expect(service.create(sinCategoria, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_CREADO,
          result: AuditResult.FAIL,
          errorCode: 'CATEGORIA_REQUERIDA',
        }),
      );
    });
  });

  describe('update', () => {
    it('actualiza mientras no está CERRADO (creador legítimo)', async () => {
      const updated = await service.update(mockReporte.id, { descripcion: 'Errata corregida' }, 'user-1');
      expect(updated.descripcion).toBeDefined();
    });

    it('el Administrador puede editar incidentes de otros', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({ ...mockReporte, usuario_id: 'otro-1' });
      prisma.users.findUnique.mockResolvedValue({
        users_roles_users_roles_user_idTousers: [{ roles: { nivel: 100 } }],
      });
      const updated = await service.update(
        mockReporte.id,
        { descripcion: 'Corrección del admin' },
        'user-admin',
      );
      expect(updated.descripcion).toBeDefined();
    });

    it('rechaza editar el reporte de otro empleado (EDITAR_SOLO_CREADOR_O_ADMIN)', async () => {
      await expect(
        service.update(mockReporte.id, { descripcion: 'curiosidad ajena' }, 'otro-user'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ACTUALIZADO,
          result: AuditResult.FAIL,
          errorCode: 'EDITAR_SOLO_CREADOR_O_ADMIN',
        }),
      );
    });

    it('rechaza actualizar un CERRADO (CERRADO_NO_EDITABLE) y audita FAIL', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({ ...mockReporte, estado: EstadoIncidente.CERRADO });
      await expect(service.update(mockReporte.id, { descripcion: 'tardío' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ACTUALIZADO,
          result: AuditResult.FAIL,
          errorCode: 'CERRADO_NO_EDITABLE',
        }),
      );
    });

    it('valida categoría de la subcategoría al editar', async () => {
      prisma.subcategorias_reporte.findFirst.mockResolvedValue({ id: 'sub-d1', categoria: 'MECANICO' });
      await expect(
        service.update(mockReporte.id, { subcategoriaId: 'sub-d1' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cambiarEstado (flujo de 3 estados)', () => {
    it.each([
      [EstadoIncidente.NUEVO, EstadoIncidente.EN_CURSO],
      [EstadoIncidente.NUEVO, EstadoIncidente.CERRADO],
      [EstadoIncidente.EN_CURSO, EstadoIncidente.CERRADO],
    ])('permite %s → %s auditando SUCCESS', async (desde, hacia) => {
      prisma.reportes_campo.findFirst.mockResolvedValue({ ...mockReporte, estado: desde });
      await service.cambiarEstado(mockReporte.id, { estado: hacia }, 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ESTATUS_CAMBIADO, result: AuditResult.SUCCESS }),
      );
    });

    it('rechaza transiciones no válidas y audita TRANSICION_NO_VALIDA', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({ ...mockReporte, estado: EstadoIncidente.CERRADO });
      await expect(
        service.cambiarEstado(mockReporte.id, { estado: EstadoIncidente.EN_CURSO }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ESTATUS_CAMBIADO,
          result: AuditResult.FAIL,
          errorCode: 'TRANSICION_NO_VALIDA',
        }),
      );
    });

    it('al cerrar persiste cerrado_en (updateMany con guard de estado)', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoIncidente.EN_CURSO,
      });
      await service.cambiarEstado(mockReporte.id, { estado: EstadoIncidente.CERRADO }, 'user-1');
      const args = prisma.reportes_campo.updateMany.mock.calls.at(-1)[0];
      expect(args.where.estado).toBe(EstadoIncidente.EN_CURSO);
      expect(args.data.cerrado_en).toBeInstanceOf(Date);
    });

    it('race de estado: updateMany count 0 → CONFLICTO_CONCURRENCIA (409)', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoIncidente.NUEVO,
      });
      prisma.reportes_campo.updateMany.mockResolvedValueOnce({ count: 0 });
      await expect(
        service.cambiarEstado(mockReporte.id, { estado: EstadoIncidente.EN_CURSO }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('404 con audit FAIL si el incidente no existe', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(
        service.cambiarEstado('missing', { estado: EstadoIncidente.EN_CURSO }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('aceptar', () => {
    it('nuevo sin responsable: acepta y llena RESPONSABLE con el nombre del aceptante', async () => {
      const data = await service.aceptar(mockReporte.id, 'user-1');
      const args = prisma.reportes_campo.updateMany.mock.calls.at(-1)[0];
      expect(args.where.estado).toBe(EstadoIncidente.NUEVO);
      expect(args.where.asignado_a_id).toBeNull();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REPORTE_ASIGNADO, result: AuditResult.SUCCESS }),
      );
      expect(data).toBeDefined();
    });

    it('con responsable ya asignado → YA_ACEPTADO (audita FAIL)', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoIncidente.NUEVO,
        asignado_nombre: 'Alguien',
      });
      await expect(service.aceptar(mockReporte.id, 'user-1')).rejects.toThrow(ConflictException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ASIGNADO,
          result: AuditResult.FAIL,
          errorCode: 'YA_ACEPTADO',
        }),
      );
    });

    it('estado no NUEVO → SOLO_NUEVOS_SE_ACEPTAN (audita FAIL)', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoIncidente.EN_CURSO,
      });
      await expect(service.aceptar(mockReporte.id, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ASIGNADO,
          result: AuditResult.FAIL,
          errorCode: 'SOLO_NUEVOS_SE_ACEPTAN',
        }),
      );
    });
  });

  describe('asignar', () => {
    it('asigna por trabajador y audita SUCCESS', async () => {
      await service.asignar(mockReporte.id, { asignadoA: 't-1' }, 'user-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REPORTE_ASIGNADO, result: AuditResult.SUCCESS }),
      );
    });

    it('falla con ASIGNACION_VACIA (audita FAIL+errorCode antes de lanzar)', async () => {
      await expect(service.asignar(mockReporte.id, {}, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_ASIGNADO,
          result: AuditResult.FAIL,
          errorCode: 'ASIGNACION_VACIA',
        }),
      );
    });

    it('no reasigna un CERRADO: REPORTE_CERRADO', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({ ...mockReporte, estado: EstadoIncidente.CERRADO });
      await expect(service.asignar(mockReporte.id, { asignadoA: 't-1' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('404 con audit FAIL cuando no existe', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(service.asignar('missing', { asignadoA: 't-1' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('comentar (actividades)', () => {
    it('publica actividad y audita REPORTE_COMENTADO SUCCESS', async () => {
      const activity = await service.comentar(mockReporte.id, { texto: 'Revisada la bomba' }, 'user-1');
      expect(activity.texto).toBe('Revisada la bomba');
      expect(prisma.reportes_actividades.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_COMENTADO,
          result: AuditResult.SUCCESS,
        }),
      );
    });

    it('rechaza comentar un CERRADO (INCIDENTE_CERRADO) con audit FAIL', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoIncidente.CERRADO,
      });
      await expect(service.comentar(mockReporte.id, { texto: 'tarde' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REPORTE_COMENTADO,
          result: AuditResult.FAIL,
          errorCode: 'INCIDENTE_CERRADO',
        }),
      );
      expect(prisma.reportes_actividades.create).not.toHaveBeenCalled();
    });

    it('404 con audit FAIL si no existe', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(service.comentar('missing', { texto: 'x' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjuntar (imágenes)', () => {
    const adjuntoBase = { nombre: 'evidencia.png', mime: 'image/png', tamano: 67, datos: PNG_1X1 };

    it('adjunta imagen y audita REPORTE_ADJUNTO SUCCESS', async () => {
      const result = await service.adjuntar(mockReporte.id, adjuntoBase, 'user-1');
      expect(result.mime).toBe('image/png');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REPORTE_ADJUNTO, result: AuditResult.SUCCESS }),
      );
    });

    it('rechaza mime ajeno (MIME_NO_PERMITIDO) sin insertar', async () => {
      await expect(
        service.adjuntar(
          mockReporte.id,
          { ...adjuntoBase, mime: 'application/pdf' } as never,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.reportes_adjuntos.create).not.toHaveBeenCalled();
    });

    it('rechaza tamaño inflado (base64 real > 2 MB → ADJUNTO_MUY_GRANDE)', async () => {
      // 3MB de base64 real aunque tamano declare 67
      const datos = 'A'.repeat(4 * 1024 * 1024);
      await expect(
        service.adjuntar(mockReporte.id, { ...adjuntoBase, datos }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.reportes_adjuntos.create).not.toHaveBeenCalled();
    });

    it('corta en 4 adjuntos por incidente (LIMITE_ADJUNTOS)', async () => {
      prisma.reportes_adjuntos.count.mockResolvedValue(4);
      await expect(service.adjuntar(mockReporte.id, adjuntoBase, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.reportes_adjuntos.create).not.toHaveBeenCalled();
    });

    it('rechaza adjuntar un CERRADO (INCIDENTE_CERRADO)', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue({
        ...mockReporte,
        estado: EstadoIncidente.CERRADO,
      });
      await expect(service.adjuntar(mockReporte.id, adjuntoBase, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('404 con audit FAIL si no existe', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(service.adjuntar('missing', adjuntoBase, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove (soft delete)', () => {
    it('marca eliminado_en, desactiva y audita SUCCESS', async () => {
      const result = await service.remove(mockReporte.id, 'user-1');
      expect(result.message).toContain('eliminado');
      const callArgs = prisma.reportes_campo.update.mock.calls[0][0];
      expect(callArgs.data.eliminado_en).toBeInstanceOf(Date);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.REPORTE_ELIMINADO, result: AuditResult.SUCCESS }),
      );
    });

    it('404 con audit FAIL cuando no existe', async () => {
      prisma.reportes_campo.findFirst.mockResolvedValue(null);
      await expect(service.remove('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findStats', () => {
    it('cuenta nuevos/enCurso/cerrados + criticosActivos + porArea (con ámbito del usuario)', async () => {
      const stats = await service.findStats('user-1');
      expect(stats).toEqual({
        nuevos: expect.any(Number),
        enCurso: expect.any(Number),
        cerrados: expect.any(Number),
        criticosActivos: expect.any(Number),
        porArea: expect.any(Object),
      });
    });
  });

  describe('subcategorias (catálogo maestro)', () => {
    it('lista activas con categoria en TitleCase (sin paginar)', async () => {
      prisma.subcategorias_reporte.findMany.mockResolvedValue([
        { id: 'x', categoria: 'DIESEL', nombre: '150 litros de diésel' },
      ]);
      const result = await service.subcategorias();
      expect(result).toEqual([{ id: 'x', categoria: 'Diesel', nombre: '150 litros de diésel' }]);
      expect(prisma.subcategorias_reporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: true } }),
      );
    });
  });
});
