import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  EstadoIncidente,
  Prioridad,
  TipoReporteCampo,
  CategoriaReporte,
  AuditAction,
  AuditResult,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReporteCampoDto } from './dto/create-reporte-campo.dto';
import { UpdateReporteCampoDto } from './dto/update-reporte-campo.dto';
import { QueryReportesCampoDto } from './dto/query-reportes-campo.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { AsignarReporteDto } from './dto/asignar-reporte.dto';
import { ActividadDto } from './dto/actividad.dto';
import { AdjuntoDto, MAX_BYTES_DECODIFICADOS_ADJUNTO } from './dto/adjunto.dto';

const REPORTE_INCLUDE = {
  subcategoria: { select: { id: true, nombre: true } },
  proyectos: { select: { id: true, nombre: true, calle: true, colonia: true, ciudad: true } },
  asignado_a: { select: { id: true, nombre: true, puesto: true } },
} as const;

const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

const TIPO_LABELS: Record<TipoReporteCampo, string> = {
  [TipoReporteCampo.ADMINISTRATIVO]: 'Administrativo',
  [TipoReporteCampo.MECANICO]: 'Mecanico',
  [TipoReporteCampo.OPERADOR]: 'Operador',
  [TipoReporteCampo.PIPERO]: 'Pipero',
  [TipoReporteCampo.CHECADOR]: 'Checador',
  [TipoReporteCampo.INCIDENTE]: 'Incidente',
  [TipoReporteCampo.INGENIERO]: 'Ingeniero',
  [TipoReporteCampo.TRABAJADOR]: 'Trabajador',
  [TipoReporteCampo.SOLDADOR]: 'Soldador',
  [TipoReporteCampo.DIESEL]: 'Diesel',
  [TipoReporteCampo.MANTENIMIENTO]: 'Mantenimiento',
  [TipoReporteCampo.RESIDENTE]: 'Residente',
};

const ESTADO_LABELS: Record<EstadoIncidente, string> = {
  [EstadoIncidente.NUEVO]: 'Nuevo',
  [EstadoIncidente.EN_CURSO]: 'En curso',
  [EstadoIncidente.CERRADO]: 'Cerrado',
};

const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  [Prioridad.BAJA]: 'Baja',
  [Prioridad.MEDIA]: 'Media',
  [Prioridad.ALTA]: 'Alta',
  [Prioridad.CRITICA]: 'Crítica',
};

/** Reintentos de folio ante carrera INC (patrón facturas). */
const MAX_INTENTOS_FOLIO = 5;

/** Días que un incidente Cerrado sigue visible antes de darse de baja del listado (no-admin). */
const AUTO_BAJA_DIAS = 2;

/** Categoría responsable ("torre que atiende") — sale de /nueva-info (PWA). */
const CATEGORIA_LABELS: Record<string, string> = {
  MECANICO: 'Mecanico',
  SOLDADOR: 'Soldador',
  DIESEL: 'Diesel',
  MANTENIMIENTO: 'Mantenimiento',
  ADMINISTRATIVO: 'Administrativo',
  RESIDENTE: 'Residente',
};

/** Flujo simplificado del incidente (mini-ServiceNow). */
const TRANSICIONES: Record<EstadoIncidente, EstadoIncidente[]> = {
  [EstadoIncidente.NUEVO]: [EstadoIncidente.EN_CURSO, EstadoIncidente.CERRADO],
  [EstadoIncidente.EN_CURSO]: [EstadoIncidente.CERRADO],
  [EstadoIncidente.CERRADO]: [],
};

/**
 * Adjuntos (imágenes): límites conservadores sin almacenamiento externo.
 */
const MAX_ADJUNTOS = 4;
const MAX_TAMANO_ADJUNTO = 2 * 1024 * 1024; // 2 MB por imagen
const MIMES_ADJUNTO = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Firma de cabecera requerida por mime (bytes reales decodificados) —
 * el contenido debe SER esa imagen, no un archivo renombrado.
 */
const ADJUNTO_FIRMAS: Record<string, (bytes: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length >= 4 && b[0] === 0x89 && b.slice(1, 4).toString('latin1') === 'PNG',
  'image/webp': (b) =>
    b.length >= 12 &&
    b.slice(0, 4).toString('latin1') === 'RIFF' &&
    b.slice(8, 12).toString('latin1') === 'WEBP',
  'image/gif': (b) => b.length >= 4 && b.slice(0, 4).toString('latin1') === 'GIF8',
};

@Injectable()
export class ReportesCampoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ────────────────────────────────────────────
  //  LISTAR (con búsqueda, filtros y paginación)
  //  Ámbito por usuario: admins (nivel 100) ven todos; el resto solo la torre
  //  de su rol/usuario (o suyos, si no tiene torre asignada — Trabajador).
  // ────────────────────────────────────────────
  async findAll(query: QueryReportesCampoDto, userId: string) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.reportes_campoWhereInput = {
      eliminado_en: null,
    };

    if (query.search) {
      where.OR = [
        { usuario: { contains: query.search, mode: 'insensitive' } },
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        { obra_texto: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.estado) where.estado = query.estado;
    if (query.tipo) where.tipo = query.tipo;
    if (query.prioridad) where.prioridad = query.prioridad;

    // Banner de críticos: INCIDENTE con prioridad Alta/Crítica sin cerrar
    if (query.criticos === 'true') {
      where.tipo = TipoReporteCampo.INCIDENTE;
      where.prioridad = { in: [Prioridad.ALTA, Prioridad.CRITICA] };
      where.estado = { not: EstadoIncidente.CERRADO };
    }

    // Ámbito por usuario (no-admin solo vede su torre / sus propios reportes)
    const [esAdmin] = await Promise.all([this.esUsuarioAdmin(userId)]);
    await this.aplicarAmbito(where, userId);

    // Baja automática (sin borrar de la BD): un incidente Cerrado sale del
    // listado a los 2 días — solo para no-admins; el Administrador sigue viéndolos.
    if (!esAdmin) {
      const limite = new Date(Date.now() - AUTO_BAJA_DIAS * 24 * 60 * 60 * 1000);
      where.AND = [
        ...((where.AND as Prisma.reportes_campoWhereInput[]) ?? []),
        {
          OR: [{ cerrado_en: null }, { cerrado_en: { gte: limite } }],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.reportes_campo.findMany({
        where,
        include: REPORTE_INCLUDE,
        orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reportes_campo.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serialize(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ────────────────────────────────────────────
  //  DETALLE (reporte + actividades + adjuntos)
  // ────────────────────────────────────────────
  async findOne(id: string, userId: string) {
    const reporte = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
      include: REPORTE_INCLUDE,
    });

    if (!reporte) {
      throw new NotFoundException(`Reporte de campo con id "${id}" no encontrado`);
    }

    // Acceso directo respeta el mismo ámbito que el listado.
    if (!(await this.enAmbito(reporte, userId))) {
      return this.fallir(
        AuditAction.REPORTE_ACCESO_DENEGADO,
        id,
        'REPORTE_ACCESO_DENEGADO',
        ForbiddenException,
        'No tienes acceso a este incidente',
      );
    }

    const [actividades, adjuntos, reportadoPor] = await Promise.all([
      this.prisma.reportes_actividades.findMany({
        where: { reporte_id: id },
        orderBy: { creado_en: 'asc' },
      }),
      this.prisma.reportes_adjuntos.findMany({
        where: { reporte_id: id },
        orderBy: { creado_en: 'asc' },
      }),
      this.datosDelReportador(reporte.usuario_id),
    ]);

    return {
      reporte: this.serialize(reporte),
      reportadoPor,
      actividades: actividades.map((a) => ({
        id: a.id,
        texto: a.texto,
        autorNombre: a.autor_nombre,
        creadoEn: a.creado_en.toISOString(),
      })),
      adjuntos: adjuntos.map((a) => this.serializeAdjunto(a)),
    };
  }

  /** ¿El usuario tiene el rol Residente (solo seguimiento en /reportes)? */
  private async esRolResidente(userId: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { users_roles_users_roles_user_idTousers: { select: { roles: { select: { nombre: true } } } } },
    });
    return (user?.users_roles_users_roles_user_idTousers ?? []).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ur: any) => ur.roles.nombre === 'Residente',
    );
  }

  /** ¿El usuario tiene rol de nivel 100 (Administrador)? Para editar ajenos y ver archivados. */
  private async esUsuarioAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { users_roles_users_roles_user_idTousers: { select: { roles: { select: { nivel: true } } } } },
    });
    const anos = user?.users_roles_users_roles_user_idTousers ?? [];
    return Math.max(0, ...anos.map((ur: { roles: { nivel: number } }) => ur.roles.nivel)) >= 100;
  }

  /**
   * Ámbito de visibilidad: nivel 100 (Administrador) ve todo. Los Residentes ven
   * los suyos + los de SUS trabajadores (jefe_user_id). El resto solo los de su
   * torre (user.torre ?? torre del rol) — y sin torre (Trabajador) solo los suyos.
   */
  private async aplicarAmbito(
    where: Prisma.reportes_campoWhereInput,
    userId: string,
  ): Promise<void> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        torre: true,
        users_roles_users_roles_user_idTousers: {
          select: { roles: { select: { nivel: true, torre: true, nombre: true } } },
        },
      },
    });
    const usuarioRoles = user?.users_roles_users_roles_user_idTousers ?? [];
    const nivelMaximo = Math.max(0, ...usuarioRoles.map((ur: { roles: { nivel: number } }) => ur.roles.nivel));
    if (nivelMaximo >= 100) return; // Administrador: acceso total

    if (usuarioRoles.some((ur: { roles: { nombre: string } }) => ur.roles.nombre === 'Residente')) {
      // Residente: los reportes de SUS trabajadores (a su cargo) + los suyos
      const subordinados = await this.prisma.users.findMany({
        where: { jefe_user_id: userId, eliminado_en: null },
        select: { id: true },
      });
      where.usuario_id = { in: [userId, ...subordinados.map((s: { id: string }) => s.id)] };
      return;
    }

    const torre = user?.torre ?? usuarioRoles.filter((ur: { roles: { torre: unknown } }) => ur.roles.torre != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => b.roles.nivel - a.roles.nivel)[0]?.roles.torre ?? null;
    if (torre) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.categoria = torre as any;
    } else {
      where.usuario_id = userId; // Trabajador sin torre: solo sus propios reportes
    }
  }

  /**
   * Datos del que levantó el incidente: nombre, teléfono (persona), rol y área.
   * personas.telefono ya existe en BD (los usuarios demo lo traen sembrado).
   */
  private async datosDelReportador(usuarioId: string | null) {
    if (!usuarioId) return null;
    const user = await this.prisma.users.findUnique({
      where: { id: usuarioId },
      select: {
        torre: true,
        personas_users_persona_idTopersonas: {
          select: { nombre: true, apellido_paterno: true, apellido_materno: true, telefono: true },
        },
        users_roles_users_roles_user_idTousers: {
          select: { es_principal: true, roles: { select: { nombre: true, nivel: true } } },
        },
      },
    });
    if (!user) return null;
    const persona = user.personas_users_persona_idTopersonas;
    const nombre = [persona.nombre, persona.apellido_paterno, persona.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim();
    const rolPrincipal = (user.users_roles_users_roles_user_idTousers ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => b.roles.nivel - a.roles.nivel)[0]?.roles.nombre ?? null;
    return {
      nombre: nombre || null,
      telefono: persona.telefono ?? null,
      rol: rolPrincipal,
      area: user.torre ?? null,
    };
  }

  /**
   * ACEPTAR — la torre toma el incidente: la columna RESPONSABLE se llena con el
   * nombre de quien lo acepta. Solo incidentes NUEVO sin responsable; con las
   * variables correctas (dos aceptos simultáneos → conflicto), auditado SUCCESS/FAIL.
   */
  async aceptar(id: string, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    if ((existente.estado as EstadoIncidente) !== EstadoIncidente.NUEVO) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'SOLO_NUEVOS_SE_ACEPTAN',
        BadRequestException,
        `Solo los incidentes Nuevos pueden aceptarse (estado actual: ${ESTADO_LABELS[existente.estado as EstadoIncidente]})`,
      );
    }

    // La aceptación es de la torre que atiende: mismo ámbito que el listado.
    if (!(await this.enAmbito(existente, userId))) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'REPORTE_ACCESO_DENEGADO',
        ForbiddenException,
        'No tienes acceso a este incidente',
      );
    }

    // Los Residentes solo dan seguimiento (ver los reportes de sus trabajadores):
    // la función de aceptar es de las torres que atienden (técnicos).
    if (await this.esRolResidente(userId)) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'RESIDENTE_SOLO_SEGUIMIENTO',
        ForbiddenException,
        'Los Residentes solo dan seguimiento: el incidente lo acepta la torre asignada',
      );
    }

    if (existente.asignado_a_id || existente.asignado_nombre) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'YA_ACEPTADO',
        ConflictException,
        'Alguien ya aceptó este incidente: recarga la lista',
      );
    }

    const reportadoPor = await this.datosDelReportador(userId);
    const nombre = reportadoPor?.nombre ?? userId;

    const actualizada = await this.prisma.reportes_campo.updateMany({
      where: {
        id,
        estado: EstadoIncidente.NUEVO,
        asignado_a_id: null,
        asignado_nombre: null,
        eliminado_en: null,
      },
      data: {
        asignado_nombre: nombre,
        asignado_en: new Date(),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });
    if (actualizada.count === 0) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'YA_ACEPTADO',
        ConflictException,
        'Alguien ya aceptó este incidente: recarga la lista',
      );
    }

    const reporte = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
      include: REPORTE_INCLUDE,
    });
    if (!reporte) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.REPORTE_ASIGNADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: { asignadoAId: null, asignadoNombre: null },
      newValue: { aceptadoPor: nombre, estado: ESTADO_LABELS[existente.estado as EstadoIncidente] },
    });

    return serialized;
  }

  /** Proyectos EN_PROCESO para el select "Ubicación — Proyecto" (datos maestros). */
  async proyectosEnProceso() {
    return this.prisma.proyectos.findMany({
      where: { estado: 'EN_PROCESO', activo: true, eliminado_en: null },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // ────────────────────────────────────────────
  //  CATÁLOGO de subcategorías (datos maestros — sin paginar)
  // ────────────────────────────────────────────
  async subcategorias() {
    const rows = await this.prisma.subcategorias_reporte.findMany({
      where: { activo: true },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
    return rows.map((s) => ({
      id: s.id,
      categoria: CATEGORIA_LABELS[s.categoria] ?? s.categoria,
      nombre: s.nombre,
    }));
  }

  // ────────────────────────────────────────────
  //  CREAR
  // ────────────────────────────────────────────
  async create(dto: CreateReporteCampoDto, userId: string) {
    // Torre destino del incidente: explícita (otra torre) o resuelta con el
    // puesto del que reporta ("misma área").
    let torre = dto.categoria ?? null;
    if (dto.mismaArea) {
      torre = await this.resolverTorreDelUsuario(userId);
    }
    if (!torre) {
      return this.fallir(
        AuditAction.REPORTE_CREADO,
        null,
        'CATEGORIA_REQUERIDA',
        BadRequestException,
        'Declara a qué área se envía el incidente (torre o misma área)',
      );
    }
    await this.validarSubcategoria(torre, dto.subcategoriaId, AuditAction.REPORTE_CREADO, null);
    if (dto.proyectoId) {
      await this.resolverProyecto(dto.proyectoId, AuditAction.REPORTE_CREADO, null);
    }
    await this.validarUbicacionGps(dto, AuditAction.REPORTE_CREADO, null);

    // "Reporta" sellado por el backend con la persona del TOKEN real (no del
    // front) — evita dueños/texto desalineados si hay sesiones mezcladas.
    const reportador = await this.datosDelReportador(userId);

    // Folio secuencial INC%04d con reintento anti-colisión (patrón facturas):
    // dos creates concurrentes pueden derivar el mismo codigo (count+1); al
    // chocar P2002 en el unique se reintenta con conteo fresco. En el último
    // intento cae el sufijo UUID.
    let reporte;
    for (let intento = 0; intento < MAX_INTENTOS_FOLIO; intento++) {
      const conteo = await this.prisma.reportes_campo.count({
        where: { codigo: { startsWith: 'INC' } },
      });
      const codigo =
        intento === MAX_INTENTOS_FOLIO - 1
          ? `INC-${randomUUID().slice(0, 6).toUpperCase()}`
          : `INC${String(conteo + 1).padStart(4, '0')}`;

      try {
        reporte = await this.prisma.reportes_campo.create({
          data: {
            id: randomUUID(),
            codigo,
            categoria: torre,
            subcategoria_id: dto.subcategoriaId ?? null,
            proyecto_id: dto.proyectoId ?? null,
            latitud: dto.latitud ?? null,
            longitud: dto.longitud ?? null,
            // El tipo (vocabulario interno) es espejo de la torre elegida.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tipo: torre as any,
            // "Reporta" = persona del usuario autenticado (fuente: servidor)
            usuario: reportador?.nombre ?? dto.usuario.trim(),
            usuario_id: userId,
            obra_texto: 'Sin obra asociada',
            fecha: this.fechaDelMomento(),
            hora: this.horaDelMomento(),
            descripcion: dto.descripcion.trim(),
            estado: EstadoIncidente.NUEVO,
            prioridad: dto.prioridad ?? null,
            creado_por: userId,
            actualizado_por: userId,
            actualizado_en: new Date(),
          },
          include: REPORTE_INCLUDE,
        });
        break;
      } catch (e) {
        // Patrón cobranza/proveedores (idioma-neutral): único unique
        // colisionable en este create es `codigo` (ver facturas.service).
        if (
          intento < MAX_INTENTOS_FOLIO - 1 &&
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue; // colisión de folio: reintentar con conteo fresco
        }
        throw e;
      }
    }
    if (!reporte) {
      // Inalcanzable: el último intento siempre lanza o asigna. Guard de tipos.
      throw new Error('No se pudo asignar folio de reporte');
    }

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.REPORTE_CREADO,
      entityType: 'reportes_campo',
      entityId: reporte.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ACTUALIZAR —permitido mientras NO esté Cerrado
  // ────────────────────────────────────────────
  async update(id: string, dto: UpdateReporteCampoDto, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_ACTUALIZADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    if ((existente.estado as EstadoIncidente) === EstadoIncidente.CERRADO) {
      return this.fallir(
        AuditAction.REPORTE_ACTUALIZADO,
        id,
        'CERRADO_NO_EDITABLE',
        BadRequestException,
        `Un incidente Cerrado no puede editarse`,
      );
    }

    // Solo un Administrador edita reportes ajenos; los empleados solo los suyos.
    if (existente.usuario_id !== userId && !(await this.esUsuarioAdmin(userId))) {
      return this.fallir(
        AuditAction.REPORTE_ACTUALIZADO,
        id,
        'EDITAR_SOLO_CREADOR_O_ADMIN',
        ForbiddenException,
        'Solo puedes editar los incidentes que tú levantaste (un Administrador edita cualquiera)',
      );
    }

    //torne destino al editar: explícita o re-resuelta con "misma área".
    let torreFinal = dto.categoria ?? (existente.categoria as CategoriaReporte | null);
    if (dto.mismaArea) {
      torreFinal = await this.resolverTorreDelUsuario(userId);
    }
    if (dto.subcategoriaId) {
      await this.validarSubcategoria(torreFinal, dto.subcategoriaId, AuditAction.REPORTE_ACTUALIZADO, id);
    }
    if (dto.proyectoId) {
      await this.resolverProyecto(dto.proyectoId, AuditAction.REPORTE_ACTUALIZADO, id);
    }
    await this.validarUbicacionGps(dto, AuditAction.REPORTE_ACTUALIZADO, id);

    const reporte = await this.prisma.reportes_campo.update({
      where: { id },
      data: {
        ...(torreFinal !== undefined && { categoria: torreFinal, tipo: torreFinal as never }),
        ...(dto.subcategoriaId !== undefined && { subcategoria_id: dto.subcategoriaId }),
        ...(dto.proyectoId !== undefined && { proyecto_id: dto.proyectoId }),
        ...(dto.latitud !== undefined && { latitud: dto.latitud }),
        ...(dto.longitud !== undefined && { longitud: dto.longitud }),
        ...(dto.usuario !== undefined && { usuario: dto.usuario.trim() }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion.trim() }),
        ...(dto.prioridad !== undefined && { prioridad: dto.prioridad }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
      include: REPORTE_INCLUDE,
    });

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.REPORTE_ACTUALIZADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  ASIGNAR RESPONSABLE (quién lo debe resolver)
  // ────────────────────────────────────────────
  /**
   * Define "quién le cae" al incidente: un trabajador activo (FK) y/o un nombre
   * libre. Con ambos vacíos se limpia la asignación. Audita REPORTE_ASIGNADO
   * como FALLIDO con error_code antes de lanzar en cada fallo.
   */
  async asignar(id: string, dto: AsignarReporteDto, userId: string) {
    const asignadoA = dto.asignadoA?.trim() || null;
    const asignadoNombre = dto.asignadoNombre?.trim() || null;

    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    // ASIGNAR/REASIGNAR es de Administrador — los demás roles toman el incidente
    // con "Aceptar" (RESPONSABLE = quien acepta).
    if (!(await this.esUsuarioAdmin(userId))) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'ASIGNAR_SOLO_ADMIN',
        ForbiddenException,
        'Solo un Administrador puede asignar o reasignar responsables',
      );
    }

    if (!asignadoA && !asignadoNombre) {
      // Ambos vacíos: se considera LIMPIEZA de asignación (permitido con datos).
      if (dto.asignadoA === undefined && dto.asignadoNombre === undefined) {
        return this.fallir(
          AuditAction.REPORTE_ASIGNADO,
          id,
          'ASIGNACION_VACIA',
          BadRequestException,
          'Envía asignadoA (trabajador), asignadoNombre, o ambos',
        );
      }
    }

    // Validar el trabajador referenciado (activo, no eliminado) — borde real.
    if (asignadoA) {
      const trabajador = await this.prisma.trabajadores.findFirst({
        where: { id: asignadoA, activo: true, eliminado_en: null },
        select: { id: true, nombre: true },
      });
      if (!trabajador) {
        return this.fallir(
          AuditAction.REPORTE_ASIGNADO,
          id,
          'TRABAJADOR_NO_ENCONTRADO',
          BadRequestException,
          `Trabajador con id "${asignadoA}" no encontrado o inactivo`,
        );
      }
    }

    if ((existente.estado as EstadoIncidente) === EstadoIncidente.CERRADO) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'REPORTE_CERRADO',
        BadRequestException,
        'No se puede reasignar un incidente Cerrado',
      );
    }

    // Guard anti-carrera: solo reasigna el incidente que sigue en el estado Y la
    // asignación leída (reasignaciones simultáneas → conflicto, no last-write)
    const actualizada = await this.prisma.reportes_campo.updateMany({
      where: {
        id,
        estado: (existente.estado as EstadoIncidente),
        asignado_a_id: existente.asignado_a_id,
        asignado_nombre: existente.asignado_nombre,
        eliminado_en: null,
      },
      data: {
        asignado_a_id: asignadoA,
        asignado_nombre: asignadoNombre,
        asignado_en: new Date(),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });
    if (actualizada.count === 0) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'CONFLICTO_CONCURRENCIA',
        ConflictException,
        'El incidente cambió simultáneamente: recarga e intenta de nuevo',
      );
    }

    const reporte = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
      include: REPORTE_INCLUDE,
    });
    if (!reporte) {
      return this.fallir(
        AuditAction.REPORTE_ASIGNADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.REPORTE_ASIGNADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: {
        asignadoAId: existente.asignado_a_id,
        asignadoNombre: existente.asignado_nombre,
      },
      newValue: {
        asignadoAId: asignadoA,
        asignadoNombre,
        estado: ESTADO_LABELS[existente.estado as EstadoIncidente],
      },
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  CAMBIAR ESTADO (Nuevo → En curso → Cerrado)
  // ────────────────────────────────────────────
  async cambiarEstado(id: string, dto: CambiarEstadoDto, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    const estadoActual = existente.estado as EstadoIncidente;
    const permitidos = TRANSICIONES[estadoActual] ?? [];

    // La transición la vive el dueño, el asignado o la torre que atiende.
    if (!(await this.enAmbito(existente, userId))) {
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'REPORTE_ACCESO_DENEGADO',
        ForbiddenException,
        'No tienes acceso a este incidente',
      );
    }

    if (!permitidos.includes(dto.estado)) {
      const permitidosLabel = permitidos.map((e) => ESTADO_LABELS[e]).join(', ') || 'ninguno (terminal)';
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'TRANSICION_NO_VALIDA',
        BadRequestException,
        `Transición no válida: de ${ESTADO_LABELS[estadoActual]} solo puede pasar a ${permitidosLabel}`,
      );
    }

    // CERRAR es de Administrador — los demás roles siguen el flujo hasta En curso.
    if (dto.estado === EstadoIncidente.CERRADO && !(await this.esUsuarioAdmin(userId))) {
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'CERRAR_SOLO_ADMIN',
        ForbiddenException,
        'Solo un Administrador puede cerrar incidentes',
      );
    }

    // Guard anti-carrera: solo cambia el incidente que SIGUE en el estado leído
    // (si otro cambio simultáneo lo movió, el updateMany no toca nada).
    const actualizada = await this.prisma.reportes_campo.updateMany({
      where: {
        id,
        estado: estadoActual,
        eliminado_en: null,
      },
      data: {
        estado: dto.estado,
        ...(dto.estado === EstadoIncidente.CERRADO && { cerrado_en: new Date() }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });
    if (actualizada.count === 0) {
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'CONFLICTO_CONCURRENCIA',
        ConflictException,
        'El incidente cambió simultáneamente: recarga e intenta de nuevo',
      );
    }

    const reporte = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
      include: REPORTE_INCLUDE,
    });
    if (!reporte) {
      return this.fallir(
        AuditAction.ESTATUS_CAMBIADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    const serialized = this.serialize(reporte);

    await this.auditService.log({
      action: AuditAction.ESTATUS_CAMBIADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: { estado: ESTADO_LABELS[estadoActual] },
      newValue: { estado: ESTADO_LABELS[dto.estado] },
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  COMENTAR (actividad del incidente)
  // ────────────────────────────────────────────
  async comentar(id: string, dto: ActividadDto, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_COMENTADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    if ((existente.estado as EstadoIncidente) === EstadoIncidente.CERRADO) {
      return this.fallir(
        AuditAction.REPORTE_COMENTADO,
        id,
        'INCIDENTE_CERRADO',
        BadRequestException,
        'Un incidente Cerrado no admite más actividades',
      );
    }

    // Señuelo de seguimiento: dueño, asignado, admin, la torre que atiende o el
    // residente de su equipo — mismo ámbito que el listado.
    if (!(await this.enAmbito(existente, userId))) {
      return this.fallir(
        AuditAction.REPORTE_COMENTADO,
        id,
        'REPORTE_ACCESO_DENEGADO',
        ForbiddenException,
        'No tienes acceso a este incidente',
      );
    }

    const nombreAutor = this.nombreActor(existente, userId);

    const actividad = await this.prisma.reportes_actividades.create({
      data: {
        id: randomUUID(),
        reporte_id: id,
        texto: dto.texto.trim(),
        autor_nombre: nombreAutor,
      },
    });

    await this.auditService.log({
      action: AuditAction.REPORTE_COMENTADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        actividadId: actividad.id,
        codigo: existente.codigo,
        texto: dto.texto.trim().slice(0, 120),
      },
    });

    return {
      id: actividad.id,
      texto: actividad.texto,
      autorNombre: actividad.autor_nombre,
      creadoEn: actividad.creado_en.toISOString(),
    };
  }

  // ────────────────────────────────────────────
  //  ADJUNTAR IMAGEN (base64 en BD)
  // ────────────────────────────────────────────
  async adjuntar(id: string, dto: AdjuntoDto, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    if ((existente.estado as EstadoIncidente) === EstadoIncidente.CERRADO) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'INCIDENTE_CERRADO',
        BadRequestException,
        'Un incidente Cerrado no admite más adjuntos',
      );
    }

    // Las imágenes son evidencia de la torre que atiende — el Residente solo
    // revisa el registro y comenta.
    if (await this.esRolResidente(userId)) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'RESIDENTE_SOLO_SEGUIMIENTO',
        ForbiddenException,
        'Los Residentes solo dan seguimiento: las imágenes las agrega la torre que atiende',
      );
    }

    // La imagen es evidencia del dueño, del asignado o de la torre que atiende.
    if (!(await this.enAmbito(existente, userId))) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'REPORTE_ACCESO_DENEGADO',
        ForbiddenException,
        'No tienes acceso a este incidente',
      );
    }

    if (!MIMES_ADJUNTO.includes(dto.mime)) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'MIME_NO_PERMITIDO',
        BadRequestException,
        `Formato no permitido (${dto.mime}). Usa JPG, PNG, WebP o GIF`,
      );
    }

    // El tamaño ya no lo declara el cliente (review PR #17): se DERIVA del
    // base64 recibido (≈ 3/4 de la longitud) — nada de 1.5 sobre columna Int.
    const bytesDecodificados = Math.floor((dto.datos.length * 3) / 4);
    if (bytesDecodificados > MAX_BYTES_DECODIFICADOS_ADJUNTO) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'ADJUNTO_MUY_GRANDE',
        BadRequestException,
        'La imagen excede el máximo de 2 MB',
      );
    }

    // La firma del contenido debe corresponder con el mime: nada de un PDF
    // mendigando pasar por PNG.
    const firmaReal = Buffer.from(dto.datos.slice(0, 16), 'base64');
    if (!ADJUNTO_FIRMAS[dto.mime]?.(firmaReal)) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'ADJUNTO_CORRUPTO',
        BadRequestException,
        'El contenido del archivo no corresponde al formato declarado',
      );
    }

    // Carrera cerrada (review PR #17): conteo + insert en UNA transacción con
    // lock advisory por incidente — dos adjuntos simultáneos no cruzan el tope.
    const adjunto = await this.prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      const total = await tx.reportes_adjuntos.count({ where: { reporte_id: id } });
      if (total >= MAX_ADJUNTOS) return null;
      return tx.reportes_adjuntos.create({
        data: {
          id: randomUUID(),
          reporte_id: id,
          nombre: dto.nombre.trim() || 'imagen',
          mime: dto.mime,
          tamano: bytesDecodificados,
          datos: dto.datos,
        },
      });
    });
    if (adjunto === null) {
      return this.fallir(
        AuditAction.REPORTE_ADJUNTO,
        id,
        'LIMITE_ADJUNTOS',
        BadRequestException,
        `El incidente ya tiene ${MAX_ADJUNTOS} imágenes`,
      );
    }

    await this.auditService.log({
      action: AuditAction.REPORTE_ADJUNTO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        adjuntoId: adjunto.id,
        codigo: existente.codigo,
        nombre: adjunto.nombre,
        tamano: adjunto.tamano,
      },
    });

    return this.serializeAdjunto(adjunto);
  }

  // ────────────────────────────────────────────
  //  ELIMINAR (soft delete)
  // ────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const existente = await this.prisma.reportes_campo.findFirst({
      where: { id, eliminado_en: null },
    });

    if (!existente) {
      return this.fallir(
        AuditAction.REPORTE_ELIMINADO,
        id,
        'REPORTE_NO_ENCONTRADO',
        NotFoundException,
        `Reporte de campo con id "${id}" no encontrado`,
      );
    }

    // Eliminar respeta el mismo ámbito que el listado (dueño/asignado/torre/admin/residente).
    if (!(await this.enAmbito(existente, userId))) {
      return this.fallir(
        AuditAction.REPORTE_ELIMINADO,
        id,
        'REPORTE_ACCESO_DENEGADO',
        ForbiddenException,
        'No tienes acceso a este incidente',
      );
    }

    await this.prisma.reportes_campo.update({
      where: { id },
      data: { eliminado_en: new Date(), activo: false },
    });

    await this.auditService.log({
      action: AuditAction.REPORTE_ELIMINADO,
      entityType: 'reportes_campo',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.serialize(existente as never),
    });

    return { message: 'Reporte eliminado exitosamente' };
  }

  // ────────────────────────────────────────────
  //  ESTADÍSTICAS (alimentan las tarjetas — con el mismo árbol del usuario)
  // ────────────────────────────────────────────
  async findStats(userId: string) {
    const baseWhere: Prisma.reportes_campoWhereInput = { eliminado_en: null };
    await this.aplicarAmbito(baseWhere, userId);

    const [nuevos, enCurso, cerrados, criticosActivos, porAreaRaw] = await Promise.all([
      this.prisma.reportes_campo.count({
        where: { ...baseWhere, estado: EstadoIncidente.NUEVO },
      }),
      this.prisma.reportes_campo.count({
        where: { ...baseWhere, estado: EstadoIncidente.EN_CURSO },
      }),
      this.prisma.reportes_campo.count({
        where: { ...baseWhere, estado: EstadoIncidente.CERRADO },
      }),
      this.prisma.reportes_campo.count({
        where: {
          ...baseWhere,
          tipo: TipoReporteCampo.INCIDENTE,
          prioridad: { in: [Prioridad.ALTA, Prioridad.CRITICA] },
          estado: { not: EstadoIncidente.CERRADO },
        },
      }),
      // Desglose por área (tipo de reporte): alimenta los chips de filtro.
      this.prisma.reportes_campo.groupBy({
        by: ['tipo'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    const porArea: Record<string, number> = {};
    for (const agregado of porAreaRaw) {
      const label = TIPO_LABELS[agregado.tipo as TipoReporteCampo] ?? agregado.tipo;
      porArea[label] = agregado._count;
    }

    return {
      nuevos,
      enCurso,
      cerrados,
      criticosActivos,
      porArea,
    };
  }

  // ════════════════════════════════════════════
  //  HELPERS PRIVADOS
  // ════════════════════════════════════════════

  /**
   * Ámbito de un ACCESO DIRECTO por id — las mismas reglas del listado
   * (aplicarAmbito), aplicadas por método: admin (nivel≥100) pasa; el dueño
   * del reporte pasa; el asignado pasa; el Residente solo si es reporte de
   * su equipo (su jefe_user_id); si no, la torre de quien consulta debe
   * coincidir con la categoría del reporte; sin torre, solo dueño.
   * Devuelve true si el acceso procede — false lo trata el caller con `fallir`.
   */
  private async enAmbito(
    reporte: { usuario_id: string | null; categoria: CategoriaReporte | null; asignado_a_id: string | null },
    userId: string,
  ): Promise<boolean> {
    if (reporte.usuario_id === userId || reporte.asignado_a_id === userId) return true;

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        torre: true,
        users_roles_users_roles_user_idTousers: {
          select: { roles: { select: { nivel: true, torre: true, nombre: true } } },
        },
      },
    });
    const usuarioRoles = user?.users_roles_users_roles_user_idTousers ?? [];
    if (Math.max(0, ...usuarioRoles.map((ur: { roles: { nivel: number } }) => ur.roles.nivel)) >= 100) {
      return true; // Administrador: acceso total
    }

    if (usuarioRoles.some((ur: { roles: { nombre: string } }) => ur.roles.nombre === 'Residente')) {
      // Residente: los reportes de SUS trabajadores (a su cargo); el propio ya
      // quedó cubierto por usuario_id arriba.
      const subordinados = await this.prisma.users.findMany({
        where: { jefe_user_id: userId, eliminado_en: null },
        select: { id: true },
      });
      return subordinados.some((s: { id: string }) => s.id === reporte.usuario_id);
    }

    const torre = user?.torre ?? usuarioRoles.filter((ur: { roles: { torre: unknown } }) => ur.roles.torre != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => b.roles.nivel - a.roles.nivel)[0]?.roles.torre ?? null;
    if (torre) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return reporte.categoria === (torre as any);
    }
    return false; // Trabajador sin torre: solo sus propios reportes
  }

  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType: 'reportes_campo',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  private async resolverMaquina(
    maquinaId: string,
    action: AuditAction,
    entityId: string | null,
  ): Promise<string> {
    const maquina = await this.prisma.maquinas.findFirst({
      where: { id: maquinaId, eliminado_en: null },
      select: { id: true },
    });
    if (!maquina) {
      return this.fallir(
        action,
        entityId,
        'MAQUINA_NO_ENCONTRADA',
        BadRequestException,
        `Máquina con id "${maquinaId}" no encontrada`,
      );
    }
    return maquina.id;
  }

  private async resolverObra(
    obraId: string,
    action: AuditAction,
    entityId: string | null,
  ): Promise<string> {
    const obra = await this.prisma.obras.findFirst({
      where: { id: obraId, eliminado_en: null },
      select: { id: true },
    });
    if (!obra) {
      return this.fallir(
        action,
        entityId,
        'OBRA_NO_ENCONTRADA',
        BadRequestException,
        `Obra con id "${obraId}" no encontrada`,
      );
    }
    return obra.id;
  }

  // (resolverMaquina/resolverObra eliminados — la ubicación es solo el área destino;
  //  obra_texto queda 'Sin obra asociada' en BD por el default del schema.)

  /**
   * Resuelve la torre ("misma área") del reportante:
   *   user.torre (sobrescribe) → torre del rol principal → ADMINISTRATIVO.
   */
  private async resolverTorreDelUsuario(userId: string): Promise<CategoriaReporte> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        torre: true,
        users_roles_users_roles_user_idTousers: {
          select: { es_principal: true, roles: { select: { torre: true } } },
        },
      },
    });
    const propia = user?.torre ?? null;
    if (propia) return propia;
    const usuarioRoles = user?.users_roles_users_roles_user_idTousers ?? [];
    const conTorre = usuarioRoles
      .filter((ur: { roles: { torre: unknown } }) => ur.roles.torre != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => Number(b.es_principal) - Number(a.es_principal))[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (conTorre?.roles.torre as any) ?? CategoriaReporte.ADMINISTRATIVO;
  }

  /** Fecha/hora automáticas al registrar (no las captura el usuario). */
  private fechaDelMomento(): Date {
    return new Date();
  }

  /** Hora con base 1970 local — misma convención que el serialize (hora.toTimeString). */
  private horaDelMomento(): Date {
    const d = new Date();
    return new Date(
      `1970-01-01T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`,
    );
  }

  /**
   * Ubicación GPS ("mi ubicación actual"): ambos o ninguno; y no se mezclan
   * proyecto + GPS en el mismo incidente.
   */
  private async validarUbicacionGps(
    dto: { latitud?: number; longitud?: number; proyectoId?: string },
    action: AuditAction,
    entityId: string | null,
  ): Promise<void> {
    const gpsParcial = (dto.latitud == null) !== (dto.longitud == null);
    if (gpsParcial || (dto.proyectoId && dto.latitud != null)) {
      await this.fallir(
        action,
        entityId,
        'UBICACION_INVALIDA',
        BadRequestException,
        'Ubica el incidente con proyecto o GPS (lat/long), un solo modo y completo',
      );
    }
  }

  /**
   * Valida que el proyecto exista y esté EN_PROCESO — reports solos ápuntan a
   * proyectos en curso (tabla proyectos; la tabla obras queda fuera del flujo).
   */
  private async resolverProyecto(
    proyectoId: string,
    action: AuditAction,
    entityId: string | null,
  ): Promise<string> {
    const proyecto = await this.prisma.proyectos.findFirst({
      where: { id: proyectoId, eliminado_en: null, estado: 'EN_PROCESO' },
      select: { id: true },
    });
    if (!proyecto) {
      return this.fallir(
        action,
        entityId,
        'PROYECTO_NO_EN_PROCESO',
        BadRequestException,
        `Proyecto con id "${proyectoId}" no encontrado o no está EN_PROCESO`,
      );
    }
    return proyecto.id;
  }

  /** Autor visible de la actividad: persona asignada, quien reporta o usuario autenticado. */
  private nombreActor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reporte: any,
    userId: string,
  ): string {
    const asignado = reporte.asignado_a?.nombre ?? reporte.asignado_nombre;
    return asignado ?? reporte.usuario ?? userId;
  }

  /**
   * Valida que la subcategoría exista, esté activa y pertenezca a la categoría
   * (torre) declarada — si no, audita FAIL y lanza.
   */
  private async validarSubcategoria(
    categoria: CategoriaReporte | null,
    subcategoriaId: string | undefined,
    action: AuditAction,
    entityId: string | null,
  ): Promise<void> {
    if (!subcategoriaId) return;

    const subcategoria = await this.prisma.subcategorias_reporte.findFirst({
      where: { id: subcategoriaId, activo: true },
      select: { categoria: true },
    });

    if (!subcategoria) {
      await this.fallir(
        action,
        entityId,
        'SUBCATEGORIA_NO_ENCONTRADA',
        BadRequestException,
        `Subcategoría con id "${subcategoriaId}" no encontrada`,
      );
    }

    if (categoria && subcategoria!.categoria !== categoria) {
      await this.fallir(
        action,
        entityId,
        'SUBCATEGORIA_INVALIDA',
        BadRequestException,
        `La subcategoría no pertenece a la categoría ${CATEGORIA_LABELS[categoria] ?? categoria}`,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeAdjunto(adjunto: any) {
    return {
      id: adjunto.id,
      nombre: adjunto.nombre,
      mime: adjunto.mime,
      tamano: adjunto.tamano,
      datos: adjunto.datos,
      creadoEn: adjunto.creado_en.toISOString(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialize(reporte: any) {
    return {
      id: reporte.id,
      codigo: reporte.codigo,
      tipo: TIPO_LABELS[reporte.tipo as TipoReporteCampo] ?? reporte.tipo,
      categoria:
        reporte.categoria != null
          ? (CATEGORIA_LABELS[reporte.categoria] ?? reporte.categoria)
          : null,
      subcategoriaId: reporte.subcategoria_id,
      subcategoria: reporte.subcategoria?.nombre ?? null,
      usuario: reporte.usuario,
      usuarioId: reporte.usuario_id,
      proyectoId: reporte.proyecto_id,
      proyecto: reporte.proyectos?.nombre ?? null,
      proyectoDireccion: reporte.proyectos
        ? (
            [reporte.proyectos.calle, reporte.proyectos.colonia, reporte.proyectos.ciudad]
              .filter(Boolean)
              .join(', ') || null
          )
        : null,
      latitud: reporte.latitud != null ? Number(reporte.latitud) : null,
      longitud: reporte.longitud != null ? Number(reporte.longitud) : null,
      fecha:
        reporte.fecha instanceof Date
          ? reporte.fecha.toISOString().split('T')[0]
          : String(reporte.fecha).split('T')[0],
      hora:
        reporte.hora instanceof Date
          ? reporte.hora.toTimeString().slice(0, 5)
          : String(reporte.hora).slice(0, 5),
      descripcion: reporte.descripcion,
      estado: ESTADO_LABELS[reporte.estado as EstadoIncidente] ?? reporte.estado,
      prioridad:
        reporte.prioridad != null
          ? PRIORIDAD_LABELS[reporte.prioridad as Prioridad]
          : null,
      asignadoAId: reporte.asignado_a?.id ?? null,
      asignadoANombre: reporte.asignado_a?.nombre ?? reporte.asignado_nombre ?? null,
      asignadoAPuesto: reporte.asignado_a?.puesto ?? null,
      asignadoEn: reporte.asignado_en?.toISOString?.() ?? reporte.asignado_en ?? null,
      cerradoEn: reporte.cerrado_en?.toISOString?.() ?? reporte.cerrado_en ?? null,
      detalles: reporte.detalles,
      activo: reporte.activo,
      creadoEn: reporte.creado_en?.toISOString?.() ?? reporte.creado_en,
      actualizadoEn: reporte.actualizado_en?.toISOString?.() ?? reporte.actualizado_en,
    };
  }
}
