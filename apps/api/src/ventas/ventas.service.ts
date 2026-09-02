import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  Prisma,
  AuditAction,
  AuditResult,
  MetodoPago,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVentaDto, toMetodoPago } from './dto/create-venta.dto';
import {
  CreateCierreDto,
  CreateAperturaDto,
  CreateRetiroDto,
  RechazarCierreDto,
  QueryCierresDto,
} from './dto/create-retiro-cierre.dto';

/** Placeholder para auditoría de fallos donde aún no hay entidad. */
const ENTITY_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
const CASH_BILLS = [1000, 500, 200, 100, 50, 20];

function hoyIso(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Fecha/hora de inicio del turno actual (misma fecha que `fechaIso`) según el
 * horario de apertura configurado. Los scopes del día (ventas, retiros, cierre)
 * usan este límite inferior para mostrar/contabilizar SOLO lo del turno.
 */
async function getTurnoInicio(prisma: PrismaService, fechaIso: string): Promise<Date> {
  const [h, m] = (await getAperturaHora(prisma)).split(':').map((n) => n.padStart(2, '0'));
  // Sin 'Z' => usa hora local del proceso (configurada en main.ts: TZ=America/Mexico_City)
  return new Date(`${fechaIso}T${h}:${m}:00.000`);
}

/** Parsea "HH:mm" a {h, m}. */
function parseHM(s: string): { h: number; m: number } {
  const [h, m] = s.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

/** Cache simple en memoria para configuración (TTL 30s) */
const configCache = new Map<string, { valor: string; expira: number }>();
const CACHE_TTL_MS = 30_000;

/** Fuerza la invalidación del cache de configuración (útil tras cambios externos o en tests). */
export function clearConfigCache(): void {
  configCache.clear();
}

async function getConfigFromDb(prisma: PrismaService, clave: string, fallback: string): Promise<string> {
  const now = Date.now();
  const cached = configCache.get(clave);
  if (cached && cached.expira > now) return cached.valor;

  try {
    const row = await prisma.configuracion_sistema.findUnique({ where: { clave } });
    const valor = row?.valor ?? fallback;
    configCache.set(clave, { valor, expira: now + CACHE_TTL_MS });
    return valor;
  } catch {
    return fallback;
  }
}

async function getAperturaHora(prisma: PrismaService): Promise<string> {
  return getConfigFromDb(prisma, 'turno_apertura', '07:00');
}
async function getCierreHora(prisma: PrismaService): Promise<string> {
  return getConfigFromDb(prisma, 'turno_cierre', '20:00');
}
/**
 * Verifica si la hora actual está dentro del HORARIO DE VENTAS (POS).
 * Ventana de ventas: APERTURA_HORA <= now <= CIERRE_HORA (mismo día).
 * 
 * DISEÑO: Solo se permite vender en el turno "diurno" (apertura < cierre).
 * Tras CIERRE_HORA empieza el turno de "CIERRE DE CAJA" (no ventas).
 * Los turnos nocturnos (apertura > cierre) NO tienen ventana de ventas;
 * solo permiten cerrar caja vía `puedeCerrarCaja()`.
 */
async function estaEnHorarioAtencion(prisma: PrismaService): Promise<boolean> {
  const now = new Date();
  const [aH, aM] = (await getAperturaHora(prisma)).split(':').map(Number);
  const [cH, cM] = (await getCierreHora(prisma)).split(':').map(Number);
  const apertura = new Date(); apertura.setHours(aH, aM, 0, 0);
  const cierre = new Date(); cierre.setHours(cH, cM, 0, 0);
  // Si es turno nocturno (apertura > cierre), no hay ventana de ventas
  if (apertura > cierre) return false;
  return now >= apertura && now <= cierre;
}

/**
 * Regla general de cuándo se puede cerrar la caja, según el tipo de turno.
 * - Turno DIURNO (cierre > apertura): p. ej. 07:00-20:00. El turno va de apertura a
 *   cierre el mismo día. Se puede cerrar tras el cierre y hasta la apertura del
 *   día siguiente (la ventana cruza la medianoche): now >= cierre || now < apertura.
 * - Turno NOCTURNO (apertura > cierre): p. ej. 23:00-00:00. El turno va de apertura
 *   (día D) a cierre (día D+1). Se puede cerrar tras el cierre y hasta la próxima
 *   apertura: now >= cierre && now < apertura.
 * - Turno continuo (apertura === cierre): siempre se puede cerrar.
 */
export function permiteCerrarCaja(nowMin: number, aperturaMin: number, cierreMin: number): boolean {
  if (cierreMin > aperturaMin) {
    return nowMin >= cierreMin || nowMin < aperturaMin;
  }
  if (cierreMin < aperturaMin) {
    return nowMin >= cierreMin && nowMin < aperturaMin;
  }
  return true;
}

/**
 * Determina si ahora se puede cerrar la caja (lee la config del turno desde la BD).
 */
async function puedeCerrarCaja(prisma: PrismaService): Promise<boolean> {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const { h: cH, m: cM } = parseHM(await getCierreHora(prisma));
  const { h: aH, m: aM } = parseHM(await getAperturaHora(prisma));
  return permiteCerrarCaja(nowMin, aH * 60 + aM, cH * 60 + cM);
}

async function getHorarioMensaje(prisma: PrismaService): Promise<string> {
  const [aH, aM] = (await getAperturaHora(prisma)).split(':').map(Number);
  const [cH, cM] = (await getCierreHora(prisma)).split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `El turno es de ${pad(aH)}:${pad(aM)} a ${pad(cH)}:${pad(cM)} hrs.`;
}

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fallir<A extends new (message: string) => any>(
    action: AuditAction,
    entityId: string | null,
    errorCode: string,
    Excepcion: A,
    message: string,
  ): Promise<never> {
    await this.auditService.log({
      action,
      entityType: 'ventas',
      entityId: entityId || ENTITY_PLACEHOLDER,
      result: AuditResult.FAIL,
      severity: 'WARNING',
      errorCode,
    });
    throw new Excepcion(message);
  }

  // ────────────────────────────────────────────
  //  CATÁLOGO de materiales para el POS
  // ────────────────────────────────────────────
  async findCatalogos() {
    // Catálogo unificado con /inventario: se lee de articulos_inventario.
    // El shape externo se conserva ({ id, sku, nombre, categoria, unidadBase,
    // stock, precios }) para no tocar el frontend; sku = codigo del artículo,
    // categoria = nombre de la categoría, unidadBase = unidad de medida base.
    // Solo se incluyen artículos con precios de venta por medida configurados
    // (articulos_precio), para no exponer en el POS artículos sin precio/medida.
    const articulos = await this.prisma.articulos_inventario.findMany({
      where: {
        activo: true,
        eliminado_en: null,
        // Solo artículos con precios de venta por medida configurados.
        articulos_precio: { some: {} },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        stock: true,
        categorias_inventario: { select: { nombre: true } },
        unidades_medida: { select: { nombre: true } },
        articulos_precio: {
          select: { medida: true, precio: true },
          orderBy: { medida: 'asc' },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return {
      materiales: articulos.map((a) => ({
        id: a.id,
        sku: a.codigo,
        nombre: a.nombre,
        categoria: a.categorias_inventario.nombre,
        unidadBase: a.unidades_medida.nombre,
        stock: Number(a.stock),
        precios: a.articulos_precio.map((p) => ({
          medida: p.medida,
          precio: Number(p.precio),
        })),
      })),
    };
  }

  // ────────────────────────────────────────────
  //  VENTAS DEL DÍA (historial + método)
  // ────────────────────────────────────────────
  async findHoy() {
    const inicio = await getTurnoInicio(this.prisma, hoyIso());
    const inicioDate = inicio;
    const finDate = new Date(`${hoyIso()}T23:59:59.999Z`);

    const ventas = await this.prisma.ventas.findMany({
      where: {
        eliminado_en: null,
        creado_en: { gte: inicioDate, lte: finDate },
      },
      include: {
        items: true,
        pagos: true,
      },
      orderBy: { ticket: 'desc' },
    });

    return {
      ventas: ventas.map((v) => this.serializeVenta(v)),
      stats: {
        count: ventas.length,
        total: Math.round(
          ventas.reduce((s, v) => s + Number(v.total), 0) * 100,
        ) / 100,
        efectivo: this.sumByMetodo(ventas, MetodoPago.EFECTIVO),
        tarjeta: this.sumByMetodo(ventas, MetodoPago.TARJETA),
        transferencia: this.sumByMetodo(ventas, MetodoPago.TRANSFERENCIA),
      },
    };
  }

  private sumByMetodo(
    ventas: Array<{ pagos: { metodo: MetodoPago; monto: Prisma.Decimal }[] }>,
    metodo: MetodoPago,
  ): number {
    const total = ventas.reduce((s, v) => {
      const m = v.pagos
        .filter((p) => p.metodo === metodo)
        .reduce((x, p) => x + Number(p.monto), 0);
      return s + m;
    }, 0);
    return Math.round(total * 100) / 100;
  }

  // ────────────────────────────────────────────
  //  CREAR VENTA (transacción atómica + stock)
  // ────────────────────────────────────────────
  async create(dto: CreateVentaDto, userId: string) {
    // Idempotencia: si ya existe una venta con la misma key, retornarla sin duplicar stock
    if (dto.idempotenciaKey) {
      const existente = await this.prisma.ventas.findUnique({
        where: { idempotencia_key: dto.idempotenciaKey },
        include: { items: true, pagos: true },
      });
      if (existente) {
        return this.serializeVenta(existente);
      }
    }

    // Validar horario de atención (POS)
    if (!(await estaEnHorarioAtencion(this.prisma))) {
      return this.fallir(
        AuditAction.VENTA_CREADA,
        null,
        'FUERA_DE_HORARIO',
        BadRequestException,
        `Fuera de horario de atención. ${await getHorarioMensaje(this.prisma)}`,
      );
    }

    // 1. Resolver artículos de inventario y validar medida+stock
    const articulos = await this.prisma.articulos_inventario.findMany({
      where: { id: { in: dto.items.map((i) => i.materialId) } },
      include: { articulos_precio: true },
    });

    const byId = new Map(articulos.map((m) => [m.id, m]));

    // 2. Validar medidas/stock de las líneas y precio unitario
    for (const item of dto.items) {
      const art = byId.get(item.materialId);
      if (!art || art.eliminado_en || !art.activo) {
        return this.fallir(
          AuditAction.VENTA_CREADA,
          null,
          'MATERIAL_NO_ENCONTRADO',
          BadRequestException,
          `Material no disponible`,
        );
      }
      const precio = art.articulos_precio.find((p) => p.medida === item.medida);
      if (!precio) {
        return this.fallir(
          AuditAction.VENTA_CREADA,
          null,
          'MEDIDA_NO_DISPONIBLE',
          BadRequestException,
          `La medida "${item.medida}" no está disponible para ${art.nombre}`,
        );
      }
      // Validar precio unitario contra catálogo (tolerancia 0.01 MXN)
      const precioCatalogo = Number(precio.precio);
      if (Math.abs(precioCatalogo - item.precioUnitario) > 0.01) {
        return this.fallir(
          AuditAction.VENTA_CREADA,
          null,
          'PRECIO_NO_COINCIDE_CATALOGO',
          BadRequestException,
          `El precio unitario (${item.precioUnitario}) no coincide con el catálogo (${precioCatalogo}) para ${art.nombre} [${item.medida}]`,
        );
      }
      if (Number(art.stock) < item.cantidad) {
        return this.fallir(
          AuditAction.VENTA_CREADA,
          null,
          'STOCK_INSUFICIENTE',
          BadRequestException,
          `Stock insuficiente para ${art.nombre} (disponible: ${art.stock})`,
        );
      }
    }

    // 3. Validar descuento: >10% requiere rol Administrador
    const DESCUENTO_MAXIMO_SIN_AUTORIZACION = 10;
    if ((dto.descuentoPct ?? 0) > DESCUENTO_MAXIMO_SIN_AUTORIZACION && !(await this.esAdmin(userId))) {
      return this.fallir(
        AuditAction.VENTA_CREADA,
        null,
        'DESCUENTO_NO_AUTORIZADO',
        ForbiddenException,
        `Los descuentos mayores al ${DESCUENTO_MAXIMO_SIN_AUTORIZACION}% requieren autorización de Administrador`,
      );
    }

    // 4. Validar pagos (sólo métodos soportados; sin mixto/terminal/QR)
    const metodosSoportados: string[] = ['efectivo', 'tarjeta', 'transferencia'];
    for (const pago of dto.pagos) {
      if (!metodosSoportados.includes(pago.metodo)) {
        return this.fallir(
          AuditAction.VENTA_CREADA,
          null,
          'METODO_PAGO_NO_SOPORTADO',
          BadRequestException,
          `El método de pago "${pago.metodo}" no está soportado`,
        );
      }
    }

    const totalLineas = dto.items.reduce(
      (s, i) => s + i.precioUnitario * i.cantidad,
      0,
    );
    const descuentoTotal = dto.descuentoTotal ?? 0;
    const totalEsperado = Math.round((totalLineas - descuentoTotal) * 100) / 100;
    const totalCobrado = dto.pagos.reduce((s, p) => s + p.monto, 0);

    if (Math.abs(totalCobrado - totalEsperado) > 0.01) {
      return this.fallir(
        AuditAction.VENTA_CREADA,
        null,
        'TOTAL_PAGOS_NO_CUADRA',
        BadRequestException,
        `El total cobrado (${totalCobrado}) no coincide con el total de la venta (${totalEsperado})`,
      );
    }

    const metodo = toMetodoPago(dto.metodo);

    // IVA 16% sobre el total cobrado (consistente con calculateTaxBreakdown del front)
    const iva = Math.round(totalCobrado * 0.16 * 100) / 100;
    const base = Math.round((totalCobrado - iva) * 100) / 100;

    // 4. Ticket secuencial del día + guardar (transacción)
    const venta = await this.prisma.$transaction(async (tx) => {
      const hoy = hoyIso();
      const maxTicket = await tx.ventas.aggregate({
        where: {
          creado_en: {
            gte: new Date(`${hoy}T00:00:00.000Z`),
            lte: new Date(`${hoy}T23:59:59.999Z`),
          },
        },
        _max: { ticket: true },
      });
      const ticket = (maxTicket._max.ticket ?? 0) + 1;

      const created = await tx.ventas.create({
        data: {
          id: randomUUID(),
          folio: `S${Date.now()}${String(Math.floor(1000 + Math.random() * 9000))}`,
          ticket,
          terminal: dto.terminal ?? 'TER-01',
          caja: dto.caja ?? 'CAJA-PV',
          cliente: dto.cliente?.trim() || 'Público en general',
          cajero: dto.cajero.trim(),
          subtotal: base,
          iva,
          ieps: 0,
          total: totalCobrado,
          metodo,
          efectivo_recibido: dto.efectivoRecibido ?? null,
          cambio: dto.cambio ?? null,
          descuento_pct: dto.descuentoPct ?? null,
          descuento_total: descuentoTotal,
          autorizado_por: dto.autorizadoPor?.trim() || null,
          items_count: dto.items.length,
          idempotencia_key: dto.idempotenciaKey ?? null,
          creado_por: userId,
          actualizado_en: new Date(),
          items: {
            create: dto.items.map((i) => {
              const mat = byId.get(i.materialId)!;
              const desc = (i.descuentoPct ?? 0) / 100;
              const subtotalLinea =
                Math.round(i.precioUnitario * i.cantidad * (1 - desc) * 100) / 100;
              return {
                id: randomUUID(),
                articulo_id: mat.id,
                nombre: mat.nombre,
                cantidad: i.cantidad,
                medida: i.medida,
                precio_unitario: i.precioUnitario,
                subtotal: subtotalLinea,
                descuento_pct: i.descuentoPct ?? null,
              };
            }),
          },
          pagos: {
            create: dto.pagos.map((p) => ({
              id: randomUUID(),
              metodo: toMetodoPago(p.metodo),
              monto: p.monto,
            })),
          },
        },
        include: { items: true, pagos: true },
      });

      // 5. Descontar stock del artículo de inventario (atómico; mismo stock
      //    que descuenta /inventario)
      for (const item of dto.items) {
        await tx.articulos_inventario.update({
          where: { id: item.materialId },
          data: { stock: { decrement: item.cantidad } },
        });
      }

      return created;
    });

    const serialized = this.serializeVenta(venta);

    await this.auditService.log({
      action: AuditAction.VENTA_CREADA,
      entityType: 'ventas',
      entityId: venta.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: serialized,
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  RETIROS DE CAJA
  // ────────────────────────────────────────────
  async findRetiros() {
    const fecha = new Date(hoyIso());
    const turnoInicio = await getTurnoInicio(this.prisma, hoyIso());
    const retiros = await this.prisma.retiros_caja.findMany({
      where: { eliminado_en: null, fecha, creado_en: { gte: turnoInicio } },
      orderBy: { creado_en: 'desc' },
    });
    return {
      items: retiros.map((r) => ({
        id: r.id,
        concepto: r.concepto,
        monto: Number(r.monto),
        fecha: r.fecha.toISOString().split('T')[0],
        hora: r.hora,
        autorizadoPor: r.autorizado_por,
      })),
    };
  }

  async createRetiro(dto: CreateRetiroDto, userId: string, cajero: string) {
    if (dto.monto <= 0) {
      return this.fallir(
        AuditAction.RETIRO_REGISTRADO,
        null,
        'RETIRO_MONTO_INVALIDO',
        BadRequestException,
        'El monto del retiro debe ser mayor a 0',
      );
    }
    if (!dto.concepto.trim()) {
      return this.fallir(
        AuditAction.RETIRO_REGISTRADO,
        null,
        'RETIRO_CONCEPTO_VACIO',
        BadRequestException,
        'El concepto del retiro es obligatorio',
      );
    }

    const ahora = new Date();
    const retiro = await this.prisma.retiros_caja.create({
      data: {
        id: randomUUID(),
        concepto: dto.concepto.trim(),
        monto: dto.monto,
        autorizado_por: dto.autorizadoPor.trim() || 'Sin especificar',
        cajero: cajero.trim(),
        fecha: ahora,
        hora: ahora.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        creado_por: userId,
        actualizado_en: ahora,
      },
    });

    const serialized = {
      id: retiro.id,
      concepto: retiro.concepto,
      monto: Number(retiro.monto),
      fecha: retiro.fecha.toISOString().split('T')[0],
      hora: retiro.hora,
      autorizadoPor: retiro.autorizado_por,
    };

    await this.auditService.log({
      action: AuditAction.RETIRO_REGISTRADO,
      entityType: 'retiros_caja',
      entityId: retiro.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  CIERRE DE CAJA
  // ────────────────────────────────────────────
  async findCierreHoy() {
    const fecha = new Date(hoyIso());
    const cierre = await this.prisma.cierres_caja.findUnique({
      where: { fecha },
    });

    return {
      existe: !!cierre,
      registro: cierre ? this.serializeCierre(cierre) : null,
      config: this.findConfig(),
      apertura: await this.findAperturaHoy(),
    };
  }

  // ────────────────────────────────────────────
  //  LISTAR CIERRES (con filtros y paginación)
  // ────────────────────────────────────────────
  async findAllCierres(query: QueryCierresDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const where: Prisma.cierres_cajaWhereInput = {};

    if (query.search) {
      where.OR = [
        { cajero: { contains: query.search, mode: 'insensitive' } },
        { notas: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.estado) {
      where.estado = query.estado;
    }

    if (query.fechaDesde || query.fechaHasta) {
      where.fecha = {};
      if (query.fechaDesde) where.fecha.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.fecha.lte = new Date(query.fechaHasta);
    }

    const [items, total, aprobados, rechazados, pendientes] = await Promise.all([
      this.prisma.cierres_caja.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { creado_en: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cierres_caja.count({ where }),
      this.prisma.cierres_caja.count({ where: { ...where, estado: 'APROBADO' } }),
      this.prisma.cierres_caja.count({ where: { ...where, estado: 'RECHAZADO' } }),
      this.prisma.cierres_caja.count({ where: { ...where, estado: 'PENDIENTE' } }),
    ]);

    return {
      items: items.map((c) => this.serializeCierre(c)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        total,
        aprobados,
        rechazados,
        pendientes,
      },
    };
  }

  /** Configuración del turno (apertura/cierre 24h). */
  async findConfig() {
    return {
      apertura: await getAperturaHora(this.prisma),
      cierre: await getCierreHora(this.prisma),
      formato: '24h',
    };
  }

  /** Actualiza configuración de turno (solo Admin). */
  async updateConfig(dto: { apertura?: string; cierre?: string }, userId: string) {
    const ahora = new Date();
    const updates: Array<{ clave: string; valor: string }> = [];

    if (dto.apertura) updates.push({ clave: 'turno_apertura', valor: dto.apertura });
    if (dto.cierre) updates.push({ clave: 'turno_cierre', valor: dto.cierre });

    if (updates.length === 0) {
      return this.fallir(
        AuditAction.CONFIG_TURNO_ACTUALIZADA,
        null,
        'CONFIG_SIN_CAMBIOS',
        BadRequestException,
        'Debe proporcionar al menos apertura o cierre para actualizar',
      );
    }

    for (const u of updates) {
      await this.prisma.configuracion_sistema.upsert({
        where: { clave: u.clave },
        update: { valor: u.valor, actualizado_en: ahora, actualizado_por: userId },
        create: { clave: u.clave, valor: u.valor, descripcion: 'Configuración de turno', tipo: 'string', categoria: 'turno', creado_por: userId, actualizado_por: userId },
      });
      // Invalidar cache
      configCache.delete(u.clave);
    }

    const config = await this.findConfig();

    await this.auditService.log({
      action: AuditAction.CONFIG_TURNO_ACTUALIZADA,
      entityType: 'configuracion_sistema',
      entityId: ENTITY_PLACEHOLDER,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: config,
    });

    return config;
  }

  // ────────────────────────────────────────────
  //  APERTURA DEL TURNO (fondo inicial)
  // ────────────────────────────────────────────
  async findAperturaHoy() {
    const fecha = new Date(hoyIso());
    const apertura = await this.prisma.aperturas_caja.findUnique({
      where: { fecha },
    });

    return {
      existe: !!apertura,
      registro: apertura ? this.serializeApertura(apertura) : null,
    };
  }

  async createApertura(dto: CreateAperturaDto, userId: string, cajero: string) {
    const fondoInicial = dto.fondoInicial ?? 0;
    if (fondoInicial < 0) {
      return this.fallir(
        AuditAction.APERTURA_CAJA_REGISTRADA,
        null,
        'FONDO_INICIAL_INVALIDO',
        BadRequestException,
        'El fondo inicial no puede ser negativo',
      );
    }

    const fecha = new Date(hoyIso());
    const existente = await this.prisma.aperturas_caja.findUnique({
      where: { fecha },
    });
    if (existente) {
      return this.fallir(
        AuditAction.APERTURA_CAJA_REGISTRADA,
        null,
        'APERTURA_DUPLICADA',
        BadRequestException,
        'Ya existe una apertura de turno registrada para hoy',
      );
    }

    const ahora = new Date();
    const apertura = await this.prisma.aperturas_caja.create({
      data: {
        id: randomUUID(),
        fecha,
        cajero: cajero.trim(),
        fondo_inicial: fondoInicial,
        abierta_en: ahora,
        creado_por: userId,
        actualizado_en: ahora,
      },
    });

    const serialized = this.serializeApertura(apertura);

    await this.auditService.log({
      action: AuditAction.APERTURA_CAJA_REGISTRADA,
      entityType: 'aperturas_caja',
      entityId: apertura.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        fecha: serialized.fecha,
        fondoInicial: serialized.fondoInicial,
      },
    });

    return serialized;
  }

  async createCierre(dto: CreateCierreDto, userId: string, cajero: string) {
    const fecha = new Date(hoyIso());

    // Validar que se pueda cerrar la caja (después de la hora de cierre, antes de la apertura)
    if (!(await puedeCerrarCaja(this.prisma))) {
      return this.fallir(
        AuditAction.CIERRE_CAJA_REGISTRADO,
        null,
        'FUERA_DE_VENTANA_CIERRE',
        BadRequestException,
        `No se puede cerrar la caja ahora. El cierre se habilita después de las ${await getCierreHora(this.prisma)} y hasta antes de las ${await getAperturaHora(this.prisma)} (siguiente turno).`,
      );
    }

    // No permitir cierre duplicado del día
    const existente = await this.prisma.cierres_caja.findUnique({
      where: { fecha },
    });
    if (existente) {
      return this.fallir(
        AuditAction.CIERRE_CAJA_REGISTRADO,
        null,
        'CIERRE_DUPLICADO',
        BadRequestException,
        'Ya existe un cierre registrado para hoy',
      );
    }

    // Ventas y retiros del turno (límite inferior = hora de apertura)
    const inicio = await getTurnoInicio(this.prisma, hoyIso());
    const fin = new Date(`${hoyIso()}T23:59:59.999Z`);
    const [ventas, retiros] = await Promise.all([
      this.prisma.ventas.findMany({
        where: { eliminado_en: null, creado_en: { gte: inicio, lte: fin } },
        include: { pagos: true },
      }),
      this.prisma.retiros_caja.findMany({
        where: { eliminado_en: null, fecha, creado_en: { gte: inicio } },
      }),
    ]);

    const ventasEfectivo = this.sumByMetodo(
      ventas as Array<{ pagos: { metodo: MetodoPago; monto: Prisma.Decimal }[] }>,
      MetodoPago.EFECTIVO,
    );
    const totalVentas =
      Math.round(ventas.reduce((s, v) => s + Number(v.total), 0) * 100) / 100;
    const totalRetiros =
      Math.round(retiros.reduce((s, r) => s + Number(r.monto), 0) * 100) / 100;

    const aperturaHoy = await this.prisma.aperturas_caja.findUnique({
      where: { fecha },
    });
    const efectivoInicial =
      dto.efectivoInicial ??
      (aperturaHoy ? Number(aperturaHoy.fondo_inicial) : 0);
    const esperado = Math.round(
      (efectivoInicial + ventasEfectivo - totalRetiros) * 100,
    ) / 100;

    // Contado = suma de denominaciones
    const denominaciones: Record<string, number> = dto.denominaciones ?? {};
    const contado =
      Math.round(
        Object.entries(denominaciones).reduce(
          (s, [den, cant]) => s + Number(den) * (cant || 0),
          0,
        ) * 100,
      ) / 100;
    const diferencia = Math.round((contado - esperado) * 100) / 100;
    const fondoSiguiente = dto.fondoSiguiente ?? 0;

    const cierre = await this.prisma.cierres_caja.create({
      data: {
        id: randomUUID(),
        fecha,
        cajero: cajero.trim(),
        ventas_count: ventas.length,
        total_ventas: totalVentas,
        efectivo_inicial: efectivoInicial,
        ventas_efectivo: ventasEfectivo,
        total_retiros: totalRetiros,
        esperado,
        contado,
        diferencia,
        fondo_siguiente: fondoSiguiente,
        notas: dto.notas?.trim() || null,
        denominaciones: denominaciones,
        creado_por: userId,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serializeCierre(cierre);

    await this.auditService.log({
      action: AuditAction.CIERRE_CAJA_REGISTRADO,
      entityType: 'cierres_caja',
      entityId: cierre.id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: {
        fecha: serialized.fecha,
        totalVentas: serialized.totalVentas,
        diferencia: serialized.diferencia,
      },
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  APROBACIÓN DEL CIERRE (solo Administrador)
  // ────────────────────────────────────────────
  private async esAdmin(userId: string): Promise<boolean> {
    const vinculacion = await this.prisma.users_roles.findFirst({
      where: {
        user_id: userId,
        activo: true,
        roles: { nombre: 'Administrador', activo: true },
      },
    });
    return !!vinculacion;
  }

  async aprobarCierre(id: string, userId: string) {
    if (!(await this.esAdmin(userId))) {
      return this.fallir(
        AuditAction.CIERRE_CAJA_APROBADO,
        id,
        'SOLO_ADMIN',
        ForbiddenException,
        'Solo el Administrador puede aprobar cierres de caja',
      );
    }

    const cierre = await this.prisma.cierres_caja.findUnique({ where: { id } });
    if (!cierre) {
      return this.fallir(
        AuditAction.CIERRE_CAJA_APROBADO,
        id,
        'CIERRE_NO_ENCONTRADO',
        NotFoundException,
        'No se encontró el cierre de caja',
      );
    }
    if (cierre.estado !== 'PENDIENTE') {
      return this.fallir(
        AuditAction.CIERRE_CAJA_APROBADO,
        id,
        'CIERRE_YA_RESUELTO',
        BadRequestException,
        `El cierre ya fue ${cierre.estado === 'APROBADO' ? 'aprobado' : 'rechazado'}`,
      );
    }

    const actualizado = await this.prisma.cierres_caja.update({
      where: { id },
      data: { estado: 'APROBADO', aprobador_id: userId, actualizado_en: new Date() },
    });

    const serialized = this.serializeCierre(actualizado);
    await this.auditService.log({
      action: AuditAction.CIERRE_CAJA_APROBADO,
      entityType: 'cierres_caja',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { fecha: serialized.fecha, estado: serialized.estado },
    });

    return serialized;
  }

  async rechazarCierre(id: string, dto: RechazarCierreDto, userId: string) {
    if (!(await this.esAdmin(userId))) {
      return this.fallir(
        AuditAction.CIERRE_CAJA_RECHAZADO,
        id,
        'SOLO_ADMIN',
        ForbiddenException,
        'Solo el Administrador puede rechazar cierres de caja',
      );
    }

    const cierre = await this.prisma.cierres_caja.findUnique({ where: { id } });
    if (!cierre) {
      return this.fallir(
        AuditAction.CIERRE_CAJA_RECHAZADO,
        id,
        'CIERRE_NO_ENCONTRADO',
        NotFoundException,
        'No se encontró el cierre de caja',
      );
    }
    if (cierre.estado !== 'PENDIENTE') {
      return this.fallir(
        AuditAction.CIERRE_CAJA_RECHAZADO,
        id,
        'CIERRE_YA_RESUELTO',
        BadRequestException,
        `El cierre ya fue ${cierre.estado === 'APROBADO' ? 'aprobado' : 'rechazado'}`,
      );
    }

    const motivo = dto.motivo.trim();
    const actualizado = await this.prisma.cierres_caja.update({
      where: { id },
      data: {
        estado: 'RECHAZADO',
        aprobador_id: userId,
        motivo_rechazo: motivo,
        actualizado_en: new Date(),
      },
    });

    const serialized = this.serializeCierre(actualizado);
    await this.auditService.log({
      action: AuditAction.CIERRE_CAJA_RECHAZADO,
      entityType: 'cierres_caja',
      entityId: id,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      actorType: 'USER',
      actorRole: 'autenticado',
      newValue: { fecha: serialized.fecha, estado: serialized.estado, motivo },
    });

    return serialized;
  }

  // ────────────────────────────────────────────
  //  SERIALIZE
  // ────────────────────────────────────────────
  private serializeVenta(v: {
    id: string;
    folio: string;
    ticket: number;
    terminal: string;
    caja: string;
    cliente: string;
    cajero: string;
    subtotal: Prisma.Decimal;
    iva: Prisma.Decimal;
    ieps: Prisma.Decimal;
    total: Prisma.Decimal;
    metodo: MetodoPago;
    efectivo_recibido: Prisma.Decimal | null;
    cambio: Prisma.Decimal | null;
    descuento_pct: Prisma.Decimal | null;
    descuento_total: Prisma.Decimal | null;
    autorizado_por: string | null;
    items_count: number;
    creado_en: Date;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagos: any[];
  }) {
    return {
      id: v.id,
      folio: v.folio,
      ticket: `T-${String(v.ticket).padStart(5, '0')}`,
      ticketNumber: v.ticket,
      terminal: v.terminal,
      registerNumber: v.caja,
      customer: v.cliente,
      cashier: v.cajero,
      subtotal: Number(v.subtotal),
      iva: Number(v.iva),
      ieps: Number(v.ieps),
      total: Number(v.total),
      method: v.metodo.toLowerCase(),
      cashReceived: v.efectivo_recibido ? Number(v.efectivo_recibido) : undefined,
      change: v.cambio ? Number(v.cambio) : undefined,
      discountPct: v.descuento_pct ? Number(v.descuento_pct) : undefined,
      discountTotal: v.descuento_total ? Number(v.descuento_total) : undefined,
      authorizedBy: v.autorizado_por ?? undefined,
      itemsSold: v.items.reduce((s, i) => s + Number(i.cantidad), 0),
      createdAt: v.creado_en.toISOString(),
      items: v.items.map((i) => ({
        id: i.id,
        materialId: i.articulo_id,
        name: i.nombre,
        quantity: Number(i.cantidad),
        unit: i.medida,
        price: Number(i.precio_unitario),
        subtotal: Number(i.subtotal),
        discountPct: i.descuento_pct ? Number(i.descuento_pct) : undefined,
      })),
      payments: v.pagos.map((p) => ({
        method: p.metodo.toLowerCase(),
        amount: Number(p.monto),
      })),
    };
  }

  private serializeApertura(a: {
    id: string;
    fecha: Date;
    cajero: string;
    fondo_inicial: Prisma.Decimal;
    abierta_en: Date;
    creado_por: string | null;
  }) {
    return {
      id: a.id,
      fecha: a.fecha.toISOString().split('T')[0],
      cajero: a.cajero,
      fondoInicial: Number(a.fondo_inicial),
      abiertaEn: a.abierta_en.toISOString(),
      creadoPor: a.creado_por ?? undefined,
    };
  }

  private serializeCierre(c: {
    id: string;
    fecha: Date;
    cajero: string;
    ventas_count: number;
    total_ventas: Prisma.Decimal;
    efectivo_inicial: Prisma.Decimal;
    ventas_efectivo: Prisma.Decimal;
    total_retiros: Prisma.Decimal;
    esperado: Prisma.Decimal;
    contado: Prisma.Decimal;
    diferencia: Prisma.Decimal;
    fondo_siguiente: Prisma.Decimal;
    notas: string | null;
    denominaciones: Prisma.JsonValue;
    estado: string;
    aprobador_id: string | null;
    motivo_rechazo: string | null;
  }) {
    return {
      id: c.id,
      fecha: c.fecha.toISOString().split('T')[0],
      cajero: c.cajero,
      ventasCount: c.ventas_count,
      totalVentas: Number(c.total_ventas),
      efectivoInicial: Number(c.efectivo_inicial),
      ventasEfectivo: Number(c.ventas_efectivo),
      totalRetiros: Number(c.total_retiros),
      esperado: Number(c.esperado),
      contado: Number(c.contado),
      diferencia: Number(c.diferencia),
      fondoSiguiente: Number(c.fondo_siguiente),
      notas: c.notas ?? undefined,
      denominaciones: (c.denominaciones as Record<string, number>) ?? {},
      estado: c.estado,
      aprobadorId: c.aprobador_id ?? undefined,
      motivoRechazo: c.motivo_rechazo ?? undefined,
    };
  }
}
