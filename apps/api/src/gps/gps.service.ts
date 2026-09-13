import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGeocercaDto } from './dto/create-geocerca.dto';
import { UpdateGeocercaDto } from './dto/update-geocerca.dto';
import { QueryGeocercasDto } from './dto/query-geocercas.dto';
import { QueryHistorialDto } from './dto/query-historial.dto';

const ENTITY_GEOCERCA = 'geocercas';
const ENTITY_RASTREO = 'rastreo_gps';
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

/** Un ping más viejo que esto deja a la máquina como "sin señal". */
const MINUTOS_SIN_SENAL = 15;
/** Debajo de esta velocidad se considera detenida, no en movimiento. */
const VELOCIDAD_MINIMA_MOVIMIENTO = 2;

export type EstadoGpsMaquina = 'moving' | 'idle' | 'offline' | 'alert';

@Injectable()
export class GpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityType: string,
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType,
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  /** Distancia en metros entre dos coordenadas GPS (fórmula de Haversine). */
  private distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // radio de la Tierra en metros
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // ────────────────────────────────────────────
  //  GEOCERCAS — CRUD
  // ────────────────────────────────────────────

  async findAllGeocercas(query: QueryGeocercasDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.geocercasWhereInput = { eliminado_en: null };
    if (query.tipo) where.tipo = query.tipo;
    if (query.activa !== undefined) where.activa = query.activa === 'true';
    if (query.search) {
      where.nombre = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.geocercas.findMany({
        where,
        include: { geocerca_maquinas: { select: { dentro: true } } },
        orderBy: [{ activa: 'desc' }, { nombre: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.geocercas.count({ where }),
    ]);

    return {
      items: items.map((g) => this.toGeocercaResponse(g)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findOneGeocerca(id: string) {
    const geocerca = await this.prisma.geocercas.findFirst({
      where: { id, eliminado_en: null },
      include: { geocerca_maquinas: { select: { dentro: true } } },
    });
    if (!geocerca) throw new NotFoundException(`Geocerca con id "${id}" no encontrada`);
    return this.toGeocercaResponse(geocerca);
  }

  async createGeocerca(dto: CreateGeocercaDto, userId: string) {
    const duplicada = await this.prisma.geocercas.findFirst({
      where: { nombre: dto.nombre.trim(), eliminado_en: null },
      select: { id: true },
    });
    if (duplicada) {
      return this.fallir(
        AuditAction.GEOCERCA_CREADA,
        ENTITY_GEOCERCA,
        null,
        'GEOCERCA_DUPLICADA',
        BadRequestException,
        `Ya existe una geocerca activa llamada "${dto.nombre.trim()}"`,
      );
    }

    const id = randomUUID();
    const now = new Date();

    await this.prisma.geocercas.create({
      data: {
        id,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
        color: dto.color ?? '#3b82f6',
        centro_lat: dto.centroLat,
        centro_lng: dto.centroLng,
        radio_metros: dto.radioMetros,
        activa: dto.activa ?? true,
        creado_por: userId,
        actualizado_por: userId,
        actualizado_en: now,
      },
    });

    const creada = await this.prisma.geocercas.findUniqueOrThrow({
      where: { id },
      include: { geocerca_maquinas: { select: { dentro: true } } },
    });
    const serialized = this.toGeocercaResponse(creada);

    await this.auditService.log({
      action: AuditAction.GEOCERCA_CREADA,
      entityType: ENTITY_GEOCERCA,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  async updateGeocerca(id: string, dto: UpdateGeocercaDto, userId: string) {
    const existente = await this.prisma.geocercas.findFirst({
      where: { id, eliminado_en: null },
      include: { geocerca_maquinas: { select: { dentro: true } } },
    });
    if (!existente) {
      return this.fallir(
        AuditAction.GEOCERCA_ACTUALIZADA,
        ENTITY_GEOCERCA,
        id,
        'GEOCERCA_NO_ENCONTRADA',
        NotFoundException,
        `Geocerca con id "${id}" no encontrada`,
      );
    }

    if (dto.nombre && dto.nombre.trim() !== existente.nombre) {
      const duplicada = await this.prisma.geocercas.findFirst({
        where: { nombre: dto.nombre.trim(), eliminado_en: null, id: { not: id } },
        select: { id: true },
      });
      if (duplicada) {
        return this.fallir(
          AuditAction.GEOCERCA_ACTUALIZADA,
          ENTITY_GEOCERCA,
          id,
          'GEOCERCA_DUPLICADA',
          BadRequestException,
          `Ya existe una geocerca activa llamada "${dto.nombre.trim()}"`,
        );
      }
    }

    await this.prisma.geocercas.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.centroLat !== undefined && { centro_lat: dto.centroLat }),
        ...(dto.centroLng !== undefined && { centro_lng: dto.centroLng }),
        ...(dto.radioMetros !== undefined && { radio_metros: dto.radioMetros }),
        ...(dto.activa !== undefined && { activa: dto.activa }),
        actualizado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const actualizada = await this.prisma.geocercas.findUniqueOrThrow({
      where: { id },
      include: { geocerca_maquinas: { select: { dentro: true } } },
    });
    const serialized = this.toGeocercaResponse(actualizada);

    await this.auditService.log({
      action: AuditAction.GEOCERCA_ACTUALIZADA,
      entityType: ENTITY_GEOCERCA,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: this.toGeocercaResponse(existente),
      newValue: serialized,
    });

    return serialized;
  }

  async removeGeocerca(id: string, userId: string) {
    const existente = await this.prisma.geocercas.findFirst({
      where: { id, eliminado_en: null },
      include: { geocerca_maquinas: { select: { dentro: true } } },
    });
    if (!existente) {
      return this.fallir(
        AuditAction.GEOCERCA_ELIMINADA,
        ENTITY_GEOCERCA,
        id,
        'GEOCERCA_NO_ENCONTRADA',
        NotFoundException,
        `Geocerca con id "${id}" no encontrada`,
      );
    }

    const previo = this.toGeocercaResponse(existente);

    // El estado de cruce (geocerca_maquinas) se borra junto con la geocerca:
    // sin geocerca no hay dentro/fuera que rastrear, y dejarlo huérfano haría
    // que una geocerca recreada con el mismo nombre heredara cruces viejos.
    await this.prisma.$transaction(async (tx) => {
      await tx.geocerca_maquinas.deleteMany({ where: { geocerca_id: id } });
      await tx.geocercas.update({
        where: { id },
        data: { eliminado_en: new Date(), activa: false, actualizado_por: userId, actualizado_en: new Date() },
      });
    });

    await this.auditService.log({
      action: AuditAction.GEOCERCA_ELIMINADA,
      entityType: ENTITY_GEOCERCA,
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      previousValue: previo,
    });

    return { message: 'Geocerca eliminada exitosamente' };
  }

  // ────────────────────────────────────────────
  //  RASTREO EN VIVO
  // ────────────────────────────────────────────

  /**
   * Última posición conocida de cada máquina activa, con el estado derivado
   * del propio ping (no de un campo aparte que se pueda desincronizar) y las
   * geocercas en las que está dentro ahora mismo.
   */
  async findMaquinasEnVivo() {
    const maquinas = await this.prisma.maquinas.findMany({
      where: { eliminado_en: null, activo: true },
      include: {
        tipos_maquina: { select: { nombre: true } },
        trabajadores: { select: { nombre: true } },
      },
      orderBy: { codigo: 'asc' },
    });

    if (maquinas.length === 0) return [];

    const ids = maquinas.map((m) => m.id);

    // Un solo query para el último ping de cada máquina (DISTINCT ON), en vez
    // de N queries — el historial crece rápido y esta vista se refresca sola.
    const ultimos = await this.prisma.$queryRaw<
      Array<{
        maquina_id: string;
        fecha_hora: Date;
        lat: Prisma.Decimal;
        lng: Prisma.Decimal;
        velocidad_kmh: Prisma.Decimal | null;
        heading: Prisma.Decimal | null;
        temperatura_motor: Prisma.Decimal | null;
        horometro: Prisma.Decimal | null;
        ignition: boolean | null;
      }>
    >`
      SELECT DISTINCT ON (maquina_id)
        maquina_id, fecha_hora, lat, lng, velocidad_kmh, heading,
        temperatura_motor, horometro, ignition
      FROM rastreo_gps
      WHERE maquina_id IN (${Prisma.join(ids)}) AND activo = true
      ORDER BY maquina_id, fecha_hora DESC
    `;
    const pingPorMaquina = new Map(ultimos.map((p) => [p.maquina_id, p]));

    const cruces = await this.prisma.geocerca_maquinas.findMany({
      where: { maquina_id: { in: ids }, dentro: true, geocercas: { eliminado_en: null, activa: true } },
      include: { geocercas: { select: { nombre: true, color: true } } },
    });
    const geocercasPorMaquina = new Map<string, Array<{ nombre: string; color: string }>>();
    for (const c of cruces) {
      const lista = geocercasPorMaquina.get(c.maquina_id) ?? [];
      lista.push({ nombre: c.geocercas.nombre, color: c.geocercas.color });
      geocercasPorMaquina.set(c.maquina_id, lista);
    }

    const ahora = Date.now();

    return maquinas.map((m) => {
      const ping = pingPorMaquina.get(m.id);
      const minutosDesdePing = ping ? (ahora - ping.fecha_hora.getTime()) / 60000 : Infinity;
      const sinSenal = minutosDesdePing > MINUTOS_SIN_SENAL;
      const velocidad = ping?.velocidad_kmh != null ? Number(ping.velocidad_kmh) : 0;

      let status: EstadoGpsMaquina;
      if (sinSenal) {
        status = 'offline';
      } else if (m.estado === 'MANTENIMIENTO' || m.alerta_consumo_anormal) {
        status = 'alert';
      } else if (velocidad >= VELOCIDAD_MINIMA_MOVIMIENTO) {
        status = 'moving';
      } else {
        status = 'idle';
      }

      const dentroDe = geocercasPorMaquina.get(m.id) ?? [];

      return {
        id: m.codigo ?? m.id,
        maquinaId: m.id,
        name: m.nombre,
        type: m.tipos_maquina.nombre,
        status,
        // Sin ping todavía se cae a la última posición conocida de la máquina.
        lat: ping ? Number(ping.lat) : Number(m.lat),
        lng: ping ? Number(ping.lng) : Number(m.lng),
        speed: sinSenal ? 0 : Math.round(velocidad),
        heading: ping?.heading != null ? Number(ping.heading) : 0,
        fuel: Math.round(Number(m.combustible)),
        temperature: ping?.temperatura_motor != null ? Math.round(Number(ping.temperatura_motor)) : 0,
        hours: Math.round(Number(ping?.horometro ?? m.horometro)),
        lastUpdate: ping ? this.formatoRelativo(minutosDesdePing) : 'Sin registro',
        ultimaFechaHora: ping ? ping.fecha_hora.toISOString() : null,
        operator: m.trabajadores?.nombre ?? undefined,
        geocercas: dentroDe,
      };
    });
  }

  /** Recorrido del día de una máquina: puntos para la ruta + eventos para la línea de tiempo. */
  async findHistorialMaquina(maquinaCodigo: string, query: QueryHistorialDto) {
    // La vista manda el código legible ("M001"), pero también se acepta el
    // UUID. Comparar contra `id` sólo si de verdad es un UUID: Postgres
    // revienta al castear texto libre a uuid, no devuelve "sin resultados".
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(maquinaCodigo);
    const maquina = await this.prisma.maquinas.findFirst({
      where: {
        OR: esUuid ? [{ codigo: maquinaCodigo }, { id: maquinaCodigo }] : [{ codigo: maquinaCodigo }],
        eliminado_en: null,
      },
      select: { id: true, codigo: true, nombre: true },
    });
    if (!maquina) throw new NotFoundException(`Máquina "${maquinaCodigo}" no encontrada`);

    const fecha = query.fecha ? new Date(`${query.fecha}T00:00:00.000Z`) : new Date();
    const inicio = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), 0, 0, 0));
    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 1);

    const puntos = await this.prisma.rastreo_gps.findMany({
      where: { maquina_id: maquina.id, activo: true, fecha_hora: { gte: inicio, lt: fin } },
      orderBy: { fecha_hora: 'desc' },
      take: Math.min(query.limit || 100, 500),
    });

    const cruces = await this.prisma.geocerca_maquinas.findMany({
      where: {
        maquina_id: maquina.id,
        geocercas: { eliminado_en: null },
        OR: [
          { ultima_entrada: { gte: inicio, lt: fin } },
          { ultima_salida: { gte: inicio, lt: fin } },
        ],
      },
      include: { geocercas: { select: { nombre: true } } },
    });

    const eventos: Array<{ time: string; text: string; speed?: number }> = [];
    for (const c of cruces) {
      if (c.ultima_entrada && c.ultima_entrada >= inicio && c.ultima_entrada < fin) {
        eventos.push({ time: this.horaLocal(c.ultima_entrada), text: `Entró a ${c.geocercas.nombre}` });
      }
      if (c.ultima_salida && c.ultima_salida >= inicio && c.ultima_salida < fin) {
        eventos.push({ time: this.horaLocal(c.ultima_salida), text: `Salió de ${c.geocercas.nombre}` });
      }
    }
    eventos.sort((a, b) => b.time.localeCompare(a.time));

    return {
      maquinaId: maquina.codigo ?? maquina.id,
      maquinaNombre: maquina.nombre,
      fecha: inicio.toISOString().split('T')[0],
      puntos: puntos.map((p) => ({
        lat: Number(p.lat),
        lng: Number(p.lng),
        time: this.horaLocal(p.fecha_hora),
        speed: p.velocidad_kmh != null ? Math.round(Number(p.velocidad_kmh)) : 0,
      })),
      eventos,
    };
  }

  // ────────────────────────────────────────────
  //  SIMULACIÓN DE MOVIMIENTO
  // ────────────────────────────────────────────

  /**
   * Genera el siguiente ping de cada máquina activa y evalúa los cruces de
   * geocerca reales (Haversine contra centro/radio).
   *
   * Esto sustituye temporalmente el feed del proveedor externo de GPS, que
   * todavía no está disponible. Cuando llegue ese acceso, el proveedor
   * insertará en `rastreo_gps` y sólo hay que llamar a `procesarGeocercas()`
   * con las posiciones recibidas — la lógica de cruces ya queda hecha aquí.
   */
  async simularMovimiento(userId: string) {
    const maquinas = await this.prisma.maquinas.findMany({
      where: { eliminado_en: null, activo: true },
      select: { id: true, codigo: true, lat: true, lng: true, horometro: true, estado: true },
    });
    if (maquinas.length === 0) {
      return this.fallir(
        AuditAction.GPS_POSICIONES_SIMULADAS,
        ENTITY_RASTREO,
        null,
        'SIN_MAQUINAS',
        BadRequestException,
        'No hay máquinas activas para simular movimiento',
      );
    }

    const ids = maquinas.map((m) => m.id);
    const ultimos = await this.prisma.$queryRaw<
      Array<{ maquina_id: string; lat: Prisma.Decimal; lng: Prisma.Decimal; heading: Prisma.Decimal | null; horometro: Prisma.Decimal | null }>
    >`
      SELECT DISTINCT ON (maquina_id) maquina_id, lat, lng, heading, horometro
      FROM rastreo_gps
      WHERE maquina_id IN (${Prisma.join(ids)}) AND activo = true
      ORDER BY maquina_id, fecha_hora DESC
    `;
    const ultimoPorMaquina = new Map(ultimos.map((p) => [p.maquina_id, p]));

    const ahora = new Date();
    const nuevasPosiciones: Array<{ maquinaId: string; lat: number; lng: number }> = [];
    const filas: Prisma.rastreo_gpsCreateManyInput[] = [];

    for (const m of maquinas) {
      const previo = ultimoPorMaquina.get(m.id);
      const latPrevia = previo ? Number(previo.lat) : Number(m.lat);
      const lngPrevia = previo ? Number(previo.lng) : Number(m.lng);
      const headingPrevio = previo?.heading != null ? Number(previo.heading) : Math.random() * 360;

      // Una máquina en mantenimiento o apagada no se mueve; el resto avanza
      // en la dirección que traía, con una desviación suave.
      const enMovimiento = m.estado !== 'MANTENIMIENTO' && m.estado !== 'APAGADA';
      const velocidad = enMovimiento ? Math.round(5 + Math.random() * 35) : 0;
      const heading = (headingPrevio + (Math.random() * 40 - 20) + 360) % 360;

      // Metros recorridos en el intervalo simulado (~1 min) → grados.
      const metros = (velocidad * 1000) / 60;
      const rad = (heading * Math.PI) / 180;
      const dLat = (metros * Math.cos(rad)) / 111320;
      const dLng = (metros * Math.sin(rad)) / (111320 * Math.cos((latPrevia * Math.PI) / 180));

      const lat = Number((latPrevia + dLat).toFixed(6));
      const lng = Number((lngPrevia + dLng).toFixed(6));
      const horometro = Number(previo?.horometro ?? m.horometro) + (enMovimiento ? 0.02 : 0);

      filas.push({
        id: randomUUID(),
        maquina_id: m.id,
        fecha_hora: ahora,
        lat,
        lng,
        velocidad_kmh: velocidad,
        heading: Number(heading.toFixed(2)),
        precision_metros: Number((3 + Math.random() * 5).toFixed(2)),
        ignition: enMovimiento,
        horometro: Number(horometro.toFixed(2)),
        temperatura_motor: enMovimiento ? Number((70 + Math.random() * 25).toFixed(2)) : Number((20 + Math.random() * 10).toFixed(2)),
        proveedor_gps: 'SIMULADO',
        creado_por: userId,
      });

      nuevasPosiciones.push({ maquinaId: m.id, lat, lng });
    }

    await this.prisma.rastreo_gps.createMany({ data: filas });

    // La posición "de cabecera" de la máquina se mantiene al día para las
    // vistas que no consultan el historial (Flota, Combustible).
    await this.prisma.$transaction(
      nuevasPosiciones.map((p) =>
        this.prisma.maquinas.update({
          where: { id: p.maquinaId },
          data: { lat: p.lat, lng: p.lng, actualizado_en: ahora },
        }),
      ),
    );

    const cruces = await this.procesarGeocercas(nuevasPosiciones, userId, ahora);

    await this.auditService.log({
      action: AuditAction.GPS_POSICIONES_SIMULADAS,
      entityType: ENTITY_RASTREO,
      entityId: ENTITY_PLACEHOLDER,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        maquinas: filas.length,
        entradas: cruces.entradas.length,
        salidas: cruces.salidas.length,
        fechaHora: ahora.toISOString(),
      },
    });

    return {
      maquinasActualizadas: filas.length,
      entradas: cruces.entradas,
      salidas: cruces.salidas,
      fechaHora: ahora.toISOString(),
    };
  }

  /**
   * Evalúa cada posición contra las geocercas activas y registra los cambios
   * de estado (entró / salió). Sólo audita los cruces reales, no cada ping.
   */
  private async procesarGeocercas(
    posiciones: Array<{ maquinaId: string; lat: number; lng: number }>,
    userId: string,
    ahora: Date,
  ) {
    const geocercas = await this.prisma.geocercas.findMany({
      where: { eliminado_en: null, activa: true },
      select: { id: true, nombre: true, centro_lat: true, centro_lng: true, radio_metros: true },
    });

    const entradas: Array<{ maquinaId: string; geocerca: string }> = [];
    const salidas: Array<{ maquinaId: string; geocerca: string }> = [];
    if (geocercas.length === 0) return { entradas, salidas };

    const maquinaIds = posiciones.map((p) => p.maquinaId);
    const estadosPrevios = await this.prisma.geocerca_maquinas.findMany({
      where: { maquina_id: { in: maquinaIds }, geocerca_id: { in: geocercas.map((g) => g.id) } },
    });
    const clave = (geocercaId: string, maquinaId: string) => `${geocercaId}:${maquinaId}`;
    const previoPorClave = new Map(estadosPrevios.map((e) => [clave(e.geocerca_id, e.maquina_id), e]));

    for (const pos of posiciones) {
      for (const g of geocercas) {
        const distancia = this.distanciaMetros(
          pos.lat,
          pos.lng,
          Number(g.centro_lat),
          Number(g.centro_lng),
        );
        const dentro = distancia <= Number(g.radio_metros);
        const previo = previoPorClave.get(clave(g.id, pos.maquinaId));

        if (!previo) {
          // Primer registro del par: sólo se guarda si está dentro (entrar por
          // primera vez es un evento; "siempre estuvo fuera" no lo es).
          if (dentro) {
            await this.prisma.geocerca_maquinas.create({
              data: {
                id: randomUUID(),
                geocerca_id: g.id,
                maquina_id: pos.maquinaId,
                dentro: true,
                ultima_entrada: ahora,
              },
            });
            entradas.push({ maquinaId: pos.maquinaId, geocerca: g.nombre });
          }
          continue;
        }

        if (dentro === previo.dentro) continue; // sin cambio, no hay evento

        await this.prisma.geocerca_maquinas.update({
          where: { id: previo.id },
          data: dentro ? { dentro: true, ultima_entrada: ahora } : { dentro: false, ultima_salida: ahora },
        });
        (dentro ? entradas : salidas).push({ maquinaId: pos.maquinaId, geocerca: g.nombre });
      }
    }

    for (const e of entradas) {
      await this.auditService.log({
        action: AuditAction.GEOCERCA_ENTRADA_DETECTADA,
        entityType: ENTITY_GEOCERCA,
        entityId: e.maquinaId,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        newValue: { geocerca: e.geocerca, fechaHora: ahora.toISOString() },
      });
    }
    for (const s of salidas) {
      await this.auditService.log({
        action: AuditAction.GEOCERCA_SALIDA_DETECTADA,
        entityType: ENTITY_GEOCERCA,
        entityId: s.maquinaId,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        actorType: 'USER',
        actorRole: 'autenticado',
        newValue: { geocerca: s.geocerca, fechaHora: ahora.toISOString() },
      });
    }

    return { entradas, salidas };
  }

  // ────────────────────────────────────────────
  //  Helpers de presentación
  // ────────────────────────────────────────────

  private horaLocal(fecha: Date): string {
    return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private formatoRelativo(minutos: number): string {
    if (minutos < 1) return 'Hace unos segundos';
    if (minutos < 60) return `Hace ${Math.floor(minutos)} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    return `Hace ${Math.floor(horas / 24)} d`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toGeocercaResponse(g: any) {
    return {
      id: g.id,
      nombre: g.nombre,
      tipo: g.tipo,
      color: g.color,
      centroLat: Number(g.centro_lat),
      centroLng: Number(g.centro_lng),
      radioMetros: Number(g.radio_metros),
      activa: g.activa,
      maquinasDentro: Array.isArray(g.geocerca_maquinas)
        ? g.geocerca_maquinas.filter((m: { dentro: boolean }) => m.dentro).length
        : 0,
      creadoEn: g.creado_en instanceof Date ? g.creado_en.toISOString() : g.creado_en,
    };
  }
}
