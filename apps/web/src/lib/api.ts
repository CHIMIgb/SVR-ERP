import {
  STORAGE_KEYS,
  type ApiResponse,
  type AuthResponse,
  type LoginCredentials,
  type RegisterCredentials,
  type RefreshCredentials,
  type UserAuth,
  type Maquina,
  type DespachoMaquina,
  type ChecklistPreoperacional,
} from '@svr-erp/shared';

import type { POSSale, Product, CartItem, TaxBreakdown } from '@/lib/pos';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  /** Devolver la Response cruda (sin parsear JSON) — para descargas/blob. */
  raw?: boolean;
}


/**
 * Mensaje de error para toasts, regla compartida del ERP:
 * 1) si el backend mando details[] (422 de class-validator), se unen con "·" —
 *    el usuario ve QUE campo fallo, no un generico;
 * 2) si no, el message del contrato (p. ej. "CODIGO_DUPLICADO: ...");
 * 3) si el error ni siquiera trae contrato, el fallback de la vista.
 */
export function mensajeErrorApi(
  error?: { message?: string; details?: unknown[] } | null,
  fallback = 'Error al procesar la solicitud.',
): string {
  const detalles = error?.details
    ?.map((d) => (typeof d === 'string' ? d : JSON.stringify(d)))
    .filter(Boolean);
  if (detalles?.length) return detalles.join(' · ');
  return error?.message || fallback;
}
// ── Access token: almacenado EN MEMORIA (no localStorage) para mitigar XSS ──
// Solo el refresh token persiste en localStorage (necesario para Capacitor/offline)
let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

// Exponer setter para AuthProvider después de login/refresh
export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

function setRefreshToken(refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
}

export function clearTokens(): void {
  inMemoryAccessToken = null;
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/**
 * Persiste ambos tokens después de login/refresh.
 * El access token va a memoria; el refresh a localStorage.
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  inMemoryAccessToken = accessToken;
  setRefreshToken(refreshToken);
}

function notifySubscribers(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

type EstadoRefresh = 'ok' | 'invalid' | 'red';

/** Si la API no responde en 8s la tratamos como sin conexión (no sesión muerta). */
const REFRESH_TIMEOUT_MS = 8000;

let refreshEnCurso: Promise<EstadoRefresh> | null = null;

async function ejecutarRefresh(): Promise<EstadoRefresh> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return 'invalid';

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), REFRESH_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken } satisfies RefreshCredentials),
      signal: control.signal,
    });

    if (!response.ok) {
      // Token rechazado por el servidor (vencido/revocado): sesión muerta.
      // Otros errores HTTP (500/503): la sesión puede seguir viva — no borrar.
      if (response.status === 401 || response.status === 400) {
        clearTokens();
        return 'invalid';
      }
      return 'red';
    }

    const result: ApiResponse<AuthResponse['data']> = await response.json();
    if (!result.success) {
      clearTokens();
      return 'invalid';
    }

    setTokens(result.data.accessToken, result.data.refreshToken);
    return 'ok';
  } catch {
    // Timeout del AbortController o error de red (API inalcanzable / offline):
    // NO borrar la sesión — el refresh se reintentará al volver la señal.
    return 'red';
  } finally {
    clearTimeout(temporizador);
  }
}

function refreshAccessToken(): Promise<EstadoRefresh> {
  // UN solo refresh en vuelo: StrictMode (dev) monta el provider dos veces y
  // el interceptor puede recibir varios 401 a la vez — el refresh token es de
  // un solo uso, así que los concurrentes COMPARTEN la misma promesa.
  if (!refreshEnCurso) {
    refreshEnCurso = ejecutarRefresh().finally(() => {
      refreshEnCurso = null;
    });
  }
  return refreshEnCurso;
}

/**
 * Intenta obtener un access token válido al cargar la app.
 * Si el refresh token existe en localStorage, rota para obtener un access token fresco.
 * 'ok' = sesión restaurada; 'invalid' = sesión expirada/revocada; 'red' = sin conexión
 * (se conservan los tokens y el usuario cacheado; se reintenta al volver la señal).
 */
export async function initializeAuth(): Promise<EstadoRefresh> {
  // Si ya tenemos un access token en memoria, la sesión está activa
  if (inMemoryAccessToken) return 'ok';

  // Si no hay refresh token, no hay sesión que restaurar
  const refreshToken = getRefreshToken();
  if (!refreshToken) return 'invalid';

  // Intentar rotar el refresh token para obtener un access token nuevo
  return refreshAccessToken();
}

async function request<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { skipAuth, headers: customHeaders, raw, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  }).catch((error: TypeError) => {
    // Error de red: API no responde, CORS bloqueado preflight, o conexion rechazada
    if (
      error.message?.includes('fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Network request failed')
    ) {
      throw new Error(
        'No se pudo conectar con el servidor. Verifica que la API esté corriendo en http://localhost:3001/api',
      );
    }
    throw error;
  });

  // 401: intentar refresh y reintentar una vez
  if (response.status === 401 && !skipAuth && getRefreshToken()) {
    if (isRefreshing) {
      // Esperar a que termine el refresh en curso
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          resolve(
            request<T>(endpoint, {
              ...options,
              headers: {
                ...((customHeaders as Record<string, string>) || {}),
                Authorization: `Bearer ${newToken}`,
              },
            }),
          );
        });
      });
    }

    isRefreshing = true;
    const resultado = await refreshAccessToken();
    isRefreshing = false;

    if (resultado === 'ok') {
      const newToken = getAccessToken();
      if (newToken) {
        notifySubscribers(newToken);
        return request<T>(endpoint, {
          ...options,
          headers: {
            ...((customHeaders as Record<string, string>) || {}),
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    if (resultado === 'red') {
      // Sin conexión para refrescar: NO limpiar ni redirigir — el caller
      // muestra su error de conexión y la sesión sigue viva en el dispositivo
      return {
        success: false,
        error: { code: 'API_DOWN', message: 'No hay conexión con el servidor' },
      };
    }

    // Refresh inválido (token vencido/revocado): limpiar y dejar que el caller maneje
    window.location.href = '/';
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' },
    };
  }

  if (raw) {
    return response as unknown as ApiResponse<T>;
  }

  const data: ApiResponse<T> = await response.json();
  return data;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// ── Ciclo PIN de la PWA (plan §8.2) ──
export interface LoginPinCredentials {
  numeroEmpleado: string;
  pin: string;
}

export interface PinEstadoDTO {
  temporalActivo: boolean;
  temporalHasta: string | null;
  pinCambiadoEn: string | null;
  diasDesdeCambio: number | null;
  diasRestantes: number | null;
  avisar: boolean;
  vencido: boolean;
  bloqueada: boolean;
  requiereCambio: boolean;
}

export interface LoginPinResponse {
  accessToken: string;
  refreshToken: string;
  user: UserAuth;
  session: { id: string; iniciadaEn: string; expiraEn: string };
  pinEstado: PinEstadoDTO;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse['data']>('/auth/login', credentials, {
      skipAuth: true,
    }),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<AuthResponse['data']>('/auth/register', credentials, {
      skipAuth: true,
    }),

  refresh: (credentials: RefreshCredentials) =>
    apiClient.post<AuthResponse['data']>('/auth/refresh', credentials, {
      skipAuth: true,
    }),

  logout: () => apiClient.post<void>('/auth/logout', {}),

  profile: () => apiClient.get<UserAuth>('/auth/profile'),

  loginPin: (credentials: LoginPinCredentials) =>
    apiClient.post<LoginPinResponse>('/auth/login-pin', credentials, {
      skipAuth: true,
    }),

  pinEstado: () => apiClient.get<PinEstadoDTO>('/auth/pin/estado'),

  /** Mesa de ayuda (Vista B / ficha de trabajadores): temporal de 24 h, se muestra UNA vez. */
  pinReinicio: (userId: string) =>
    apiClient.post<{ message: string; pinTemporal: string }>('/auth/pin/reinicio', { userId }),

  pinCambio: (data: { pinActual: string; pinNuevo: string }) =>
    apiClient.post<{ message: string }>('/auth/pin/cambio', data),
};

// setTokens, clearTokens, getAccessToken, getRefreshToken, initializeAuth
// ya están exportados inline con `export function` arriba.

// ────────────────────────────────────────────────────────────
//  Inventario API
// ────────────────────────────────────────────────────────────

/** Formato que devuelve el backend serializado */
export interface ArticuloInventarioDTO {
  id: string;
  codigo: string | null;
  nombre: string;
  stock: number;
  stockMinimo: number;
  precioUnitario: number;
  categoria: string;
  categoriaId: string;
  proveedor: string;
  proveedorId: string;
  unidad: string;
  unidadId: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface InventarioStats {
  totalArticulos: number;
  stockBajo: number;
  valorTotal: number;
}

export interface CatalogoItem {
  id: string;
  nombre: string;
  estado?: string;
}

export interface CatalogoUnidad extends CatalogoItem {
  codigo: string;
}

export interface InventarioCatalogos {
  categorias: CatalogoItem[];
  proveedores: CatalogoItem[];
  unidades: CatalogoUnidad[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ArticuloCreateInput {
  nombre: string;
  codigo?: string;
  categoriaId: string;
  proveedorId: string;
  unidadId: string;
  stock: number;
  stockMinimo: number;
  precioUnitario: number;
}

export interface MovimientoInput {
  articuloId: string;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo?: string;
  referenciaTipo?: string;
  referenciaId?: string;
}

export const inventarioApi = {
  /** Listar artículos con búsqueda, filtros y paginación */
  listar: (params?: {
    search?: string;
    categoriaId?: string;
    proveedorId?: string;
    stockEstado?: 'bajo' | 'ok';
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.categoriaId) searchParams.set('categoriaId', params.categoriaId);
    if (params?.proveedorId) searchParams.set('proveedorId', params.proveedorId);
    if (params?.stockEstado) searchParams.set('stockEstado', params.stockEstado);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<ArticuloInventarioDTO>>(
      `/inventario${qs ? `?${qs}` : ''}`,
    );
  },

  /** Obtener un artículo por ID */
  obtener: (id: string) =>
    apiClient.get<ArticuloInventarioDTO>(`/inventario/${id}`),

  /** Crear un artículo */
  crear: (data: ArticuloCreateInput) =>
    apiClient.post<ArticuloInventarioDTO>('/inventario', data),

  /** Actualizar un artículo */
  actualizar: (id: string, data: Partial<ArticuloCreateInput>) =>
    apiClient.patch<ArticuloInventarioDTO>(`/inventario/${id}`, data),

  /** Eliminar un artículo (soft delete) */
  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/inventario/${id}`),

  /** Registrar movimiento de stock */
  movimiento: (data: MovimientoInput) =>
    apiClient.post<{
      articuloId: string;
      tipo: string;
      cantidad: number;
      stockAnterior: number;
      stockResultante: number;
    }>('/inventario/movimiento', data),

  /** Estadísticas del inventario */
  stats: () =>
    apiClient.get<InventarioStats>('/inventario/stats'),

  /** Catálogos para selects (categorías, proveedores, unidades) */
  catalogos: () =>
    apiClient.get<InventarioCatalogos>('/inventario/catalogos'),
};

// ────────────────────────────────────────────────────────────
//  Bitácora API
// ────────────────────────────────────────────────────────────

/** Formato que devuelve el backend serializado */
export interface BitacoraDTO {
  id: string;
  maquinaId: string;
  maquina: string;
  actividad: string;
  horas: number;
  fecha: string;
  obra: string;
  obraId: string | null;
  codigo: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface BitacoraStats {
  totalRegistros: number;
  horasTotales: number;
  maquinasActivas: number;
}

export interface BitacoraCatalogos {
  maquinas: CatalogoItem[];
  obras: CatalogoItem[];
}

export interface BitacoraCreateInput {
  maquinaId: string;
  actividad: string;
  horas: number;
  fecha: string;
  obraTexto: string;
  obraId?: string;
  codigo?: string;
}

export const bitacoraApi = {
  /** Listar registros de bitácora con búsqueda, filtros y paginación */
  listar: (params?: {
    search?: string;
    maquinaId?: string;
    obraId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.maquinaId) searchParams.set('maquinaId', params.maquinaId);
    if (params?.obraId) searchParams.set('obraId', params.obraId);
    if (params?.fechaDesde) searchParams.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) searchParams.set('fechaHasta', params.fechaHasta);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<BitacoraDTO>>(
      `/bitacora${qs ? `?${qs}` : ''}`,
    );
  },

  /** Obtener un registro por ID */
  obtener: (id: string) =>
    apiClient.get<BitacoraDTO>(`/bitacora/${id}`),

  /** Crear un registro de bitácora */
  crear: (data: BitacoraCreateInput) =>
    apiClient.post<BitacoraDTO>('/bitacora', data),

  /** Actualizar un registro de bitácora */
  actualizar: (id: string, data: Partial<BitacoraCreateInput>) =>
    apiClient.patch<BitacoraDTO>(`/bitacora/${id}`, data),

  /** Eliminar un registro (soft delete) */
  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/bitacora/${id}`),

  /** Estadísticas de la bitácora */
  stats: () =>
    apiClient.get<BitacoraStats>('/bitacora/stats'),

  /** Catálogos para selects (máquinas y obras) */
  catalogos: () =>
    apiClient.get<BitacoraCatalogos>('/bitacora/catalogos'),
};

export interface MantenimientoDTO {
  id: string;
  maquinaId: string;
  tipo: 'Correctivo' | 'Preventivo';
  descripcion: string;
  fecha: string;
  horasServicio: number;
  costo: number;
  proximoServicioHoras: number;
}

export interface MantenimientoStats {
  /** Máquinas a `umbralServicioHoras` o menos de su próximo servicio, o ya pasadas. */
  serviciosProximos: number;
  umbralServicioHoras: number;
  serviciosMes: number;
  costoMes: number;
  correctivosMes: number;
  /** Máquinas sin ningún servicio registrado (no se sabe cuándo les toca). */
  sinServicioRegistrado: number;
  totalMaquinas: number;
  /** Compatibilidad: promedio del horómetro al dar servicio. La vista ya no lo muestra. */
  promedioHorasServicio: number;
  /** Compatibilidad: contaba como "óptimas" a las máquinas sin servicio registrado. La vista ya no lo muestra. */
  equiposEnOptimoEstado: number;
}

export interface MantenimientoCreateInput {
  maquinaId: string;
  tipo: 'Correctivo' | 'Preventivo';
  descripcion: string;
  fecha: string;
  horasServicio: number;
  costo: number;
  proximoServicioHoras: number;
}

export const mantenimientoApi = {
  /** Listar registros de mantenimiento con búsqueda, filtros y paginación */
  listar: (params?: { search?: string; tipo?: string; maquinaId?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tipo) searchParams.set('tipo', params.tipo);
    if (params?.maquinaId) searchParams.set('maquinaId', params.maquinaId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<MantenimientoDTO>>(`/mantenimiento${qs ? `?${qs}` : ''}`);
  },

  /** Obtener un registro por ID */
  obtener: (id: string) => apiClient.get<MantenimientoDTO>(`/mantenimiento/${id}`),

  /** Crear un registro de mantenimiento */
  crear: (data: MantenimientoCreateInput) => apiClient.post<MantenimientoDTO>('/mantenimiento', data),

  /** Actualizar un registro de mantenimiento */
  actualizar: (id: string, data: Partial<MantenimientoCreateInput>) =>
    apiClient.patch<MantenimientoDTO>(`/mantenimiento/${id}`, data),

  /** Eliminar un registro (soft delete) */
  eliminar: (id: string) => apiClient.delete<{ message: string }>(`/mantenimiento/${id}`),

  /** Estadísticas para las tarjetas */
  stats: () => apiClient.get<MantenimientoStats>('/mantenimiento/stats'),
};

export interface CargaCombustibleDTO {
  id: string;
  maquinaId: string;
  fecha: string;
  litros: number;
  costo: number;
  operador: string;
  lugar: string;
  horometroActual: number;
  horasTrabajadasPeriodo: number;
  consumoEsperadoLtsHora: number;
  rendimientoLtsHora: number;
  alertaOrdena: boolean;
  desviacionPorcentaje: number;
}

export interface CombustibleStats {
  totalLitros: number;
  totalCosto: number;
  rendimientoPromedio: number;
  totalAlertasOrdena: number;
}

export interface CombustibleCreateInput {
  maquinaId: string;
  litros: number;
  horasTrabajadasPeriodo: number;
  lugar: string;
  costo?: number;
  operador?: string;
  fecha?: string;
}

export const combustibleApi = {
  /** Listar cargas de combustible con búsqueda, filtros y paginación */
  listar: (params?: { search?: string; maquinaId?: string; soloAlertas?: boolean; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.maquinaId) searchParams.set('maquinaId', params.maquinaId);
    if (params?.soloAlertas) searchParams.set('soloAlertas', 'true');
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<CargaCombustibleDTO>>(`/combustible${qs ? `?${qs}` : ''}`);
  },

  /** Obtener una carga por ID */
  obtener: (id: string) => apiClient.get<CargaCombustibleDTO>(`/combustible/${id}`),

  /** Registrar una carga de combustible */
  crear: (data: CombustibleCreateInput) => apiClient.post<CargaCombustibleDTO>('/combustible', data),

  /** Actualizar una carga de combustible */
  actualizar: (id: string, data: Partial<CombustibleCreateInput>) =>
    apiClient.patch<CargaCombustibleDTO>(`/combustible/${id}`, data),

  /** Eliminar una carga (soft delete) */
  eliminar: (id: string) => apiClient.delete<{ message: string }>(`/combustible/${id}`),

  /** Estadísticas para las tarjetas */
  stats: () => apiClient.get<CombustibleStats>('/combustible/stats'),
};

// ────────────────────────────────────────────────────────────
// FLOTA (máquinas, despachos, checklists) Y HORÓMETRO
// ────────────────────────────────────────────────────────────

/** Arma "?a=1&b=2" con los parámetros que sí traen valor. */
function queryString(params?: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export interface MaquinaCreateInput {
  /** Código del equipo (ej. "M005"); la API lo guarda en mayúsculas. */
  id: string;
  tipo: string;
  nombre: string;
  horometro: number;
  combustible: number;
  consumoEsperado: number;
}

export const maquinasApi = {
  /** Catálogo de la flota (datos maestros, sin paginar: lo usan los selects de varias vistas). */
  listar: () => apiClient.get<Maquina[]>('/maquinas'),
  crear: (data: MaquinaCreateInput) => apiClient.post<Maquina>('/maquinas', data),
};

export interface DespachoCreateInput {
  maquinaId: string;
  /** Código del proyecto (ej. "P001"). */
  proyectoId: string;
  fechaInicio: string;
  fechaFin: string;
}

export const despachosApi = {
  /** Paginado. Con `desde` y `hasta` trae solo los despachos que se enciman con esas fechas (cronograma). */
  listar: (params?: { maquinaId?: string; desde?: string; hasta?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<DespachoMaquina>>(`/despachos${queryString(params)}`),
  crear: (data: DespachoCreateInput) => apiClient.post<DespachoMaquina>('/despachos', data),
};

export type ChecklistCreateInput = Omit<ChecklistPreoperacional, 'id' | 'fecha' | 'hora' | 'estado'>;

export const checklistsApi = {
  listar: (params?: { maquinaId?: string; estado?: 'Aprobado' | 'Con Falla'; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<ChecklistPreoperacional>>(`/checklists${queryString(params)}`),
  crear: (data: ChecklistCreateInput) => apiClient.post<ChecklistPreoperacional>('/checklists', data),
};

export interface LecturaHorometroDTO {
  id: string;
  maquinaId: string;
  maquinaNombre: string;
  fecha: string;
  lecturaInicial: number;
  lecturaFinal: number;
  horasTrabajadas: number;
  /** Operador asignado a la máquina cuando se registró la lectura. */
  operador: string | null;
}

export interface ServicioPorHorasDTO {
  maquinaId: string;
  nombre: string;
  horometro: number;
  proximoServicioHoras: number | null;
  /** Negativo = el servicio ya se pasó. null = sin servicio registrado en Mantenimiento. */
  horasRestantes: number | null;
}

export interface HorometroStats {
  fecha: string;
  horasHoy: number;
  lecturasHoy: number;
  horasSemana: number;
  maquinasSinLecturaHoy: string[];
  umbralServicioHoras: number;
  serviciosProximos: number;
  servicios: ServicioPorHorasDTO[];
}

export interface LecturaHorometroCreateInput {
  maquinaId: string;
  fecha: string;
  lecturaInicial: number;
  lecturaFinal: number;
  /** Confirma una lectura inicial más de 24 h arriba del horómetro de la máquina (si no, la API la rechaza). */
  confirmarSalto?: boolean;
}

export const horometroApi = {
  listar: (params?: { search?: string; maquinaId?: string; desde?: string; hasta?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<LecturaHorometroDTO>>(`/lecturas-horometro${queryString(params)}`),
  stats: () => apiClient.get<HorometroStats>('/lecturas-horometro/stats'),
  crear: (data: LecturaHorometroCreateInput) => apiClient.post<LecturaHorometroDTO>('/lecturas-horometro', data),
};

// ────────────────────────────────────────────────────────────
//  Incidentes API
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
//  Proyectos API
// ────────────────────────────────────────────────────────────

export interface ProyectoDTO {
  id: string;
  codigo: string | null;
  nombre: string;
  clienteId: string;
  cliente: string;
  presupuesto: number;
  progreso: number;
  estado: 'En Proceso' | 'Finalizado' | 'Pausado';
  fechaInicio: string;
  fechaFin: string;
  ingresoCobrado: number;
  gastado: number;
  /** Ubicación exacta (opcional en BD; la UI la exige) */
  calle: string | null;
  colonia: string | null;
  ciudad: string | null;
  estadoUbicacion: string | null;
  codigoPostal: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ProyectoStats {
  total: number;
  enProceso: number;
  finalizados: number;
  presupuestoTotal: number;
}

export interface ProyectoCatalogos {
  clientes: CatalogoItem[];
}

export interface ProyectoCreateInput {
  nombre: string;
  clienteId: string;
  presupuesto: number;
  fechaInicio: string;
  fechaFin: string;
  estado?: 'EN_PROCESO' | 'FINALIZADO' | 'PAUSADO';
  progreso?: number;
  ingresoCobrado?: number;
  gastado?: number;
  calle?: string;
  colonia?: string;
  ciudad?: string;
  estadoUbicacion?: string;
  codigoPostal?: string;
}

export interface ProyectoFinanzasInput {
  ingresoCobrado?: number;
  gastado?: number;
}

export const proyectosApi = {
  listar: (params?: {
    search?: string;
    estado?: 'EN_PROCESO' | 'FINALIZADO' | 'PAUSADO';
    clienteId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.clienteId) searchParams.set('clienteId', params.clienteId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<ProyectoDTO>>(
      `/proyectos${qs ? `?${qs}` : ''}`,
    );
  },

  obtener: (id: string) =>
    apiClient.get<ProyectoDTO>(`/proyectos/${id}`),

  crear: (data: ProyectoCreateInput) =>
    apiClient.post<ProyectoDTO>('/proyectos', data),

  actualizar: (id: string, data: Partial<ProyectoCreateInput>) =>
    apiClient.patch<ProyectoDTO>(`/proyectos/${id}`, data),

  actualizarFinanzas: (id: string, data: ProyectoFinanzasInput) =>
    apiClient.patch<ProyectoDTO>(`/proyectos/${id}/finanzas`, data),

  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/proyectos/${id}`),

  stats: () =>
    apiClient.get<ProyectoStats>('/proyectos/stats'),

  catalogos: () =>
    apiClient.get<ProyectoCatalogos>('/proyectos/catalogos'),
};

// ────────────────────────────────────────────────────────────
//  Reportes de Campo API
// ────────────────────────────────────────────────────────────

export type TipoReporte = 'Administrativo' | 'Mecanico' | 'Operador' | 'Pipero' | 'Checador' | 'Incidente' | 'Ingeniero' | 'Trabajador';
export type EstadoIncidente = 'Nuevo' | 'En curso' | 'Cerrado';
export type PrioridadReporte = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type CategoriaReporte = 'Mecanico' | 'Soldador' | 'Diesel' | 'Mantenimiento' | 'Administrativo' | 'Residente';

/** Valores de enum que acepta la API en query/body (mayúsculas). */
export type TipoReporteApi = 'ADMINISTRATIVO' | 'MECANICO' | 'OPERADOR' | 'PIPERO' | 'CHECADOR' | 'INCIDENTE' | 'INGENIERO' | 'TRABAJADOR';
export type EstadoIncidenteApi = 'NUEVO' | 'EN_CURSO' | 'CERRADO';
export type PrioridadReporteApi = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type CategoriaReporteApi = 'MECANICO' | 'SOLDADOR' | 'DIESEL' | 'MANTENIMIENTO' | 'ADMINISTRATIVO' | 'RESIDENTE';

export interface ReporteCampoDTO {
  id: string;
  codigo: string | null;
  tipo: TipoReporte;
  categoria: CategoriaReporte | null;
  subcategoriaId: string | null;
  subcategoria: string | null;
  usuario: string;
  usuarioId: string | null;
  proyectoId: string | null;
  proyecto: string | null;
  /** Dirección guardada del proyecto (calle, colonia, ciudad). */
  proyectoDireccion: string | null;
  latitud: number | null;
  longitud: number | null;
  /** Quién levantó el incidente: nombre, teléfono, rol (para el detalle). */
  reportadoPor: ReportadoPorDTO | null;
  fecha: string;
  hora: string;
  descripcion: string;
  estado: EstadoIncidente;
  prioridad: PrioridadReporte | null;
  asignadoAId: string | null;
  asignadoANombre: string | null;
  asignadoAPuesto: string | null;
  asignadoEn: string | null;
  cerradoEn: string | null;
  detalles: Record<string, unknown> | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ActividadDTO {
  id: string;
  texto: string;
  autorNombre: string;
  creadoEn: string;
}

export interface AdjuntoDTO {
  id: string;
  nombre: string;
  mime: string;
  tamano: number;
  /** base64 puro (sin data: URI). */
  datos: string;
  creadoEn: string;
}

export interface ReportadoPorDTO {
  nombre: string | null;
  telefono: string | null;
  rol: string | null;
  area: string | null;
}

export interface ReportesIncidenteDetalle {
  reporte: ReporteCampoDTO;
  reportadoPor: ReportadoPorDTO | null;
  actividades: ActividadDTO[];
  adjuntos: AdjuntoDTO[];
}

export interface SubcategoriaDTO {
  id: string;
  categoria: CategoriaReporte;
  nombre: string;
}

export interface ReportesCampoStats {
  nuevos: number;
  enCurso: number;
  cerrados: number;
  criticosActivos: number;
  porArea: Partial<Record<TipoReporte, number>>;
}

export interface ReporteCampoCreateInput {
  /** Torre destino — o `mismaArea: true` para resolverla con el rol del que reporta. */
  categoria?: CategoriaReporteApi;
  mismaArea?: boolean;
  subcategoriaId?: string;
  /** Ubicación — proyecto EN_PROCESO (tabla proyectos) o GPS (lat/long). */
  proyectoId?: string;
  latitud?: number;
  longitud?: number;
  usuario: string;
  descripcion: string;
  prioridad?: PrioridadReporteApi;
}

export const reportesCampoApi = {
  listar: (params?: {
    search?: string;
    estado?: EstadoIncidenteApi;
    tipo?: TipoReporteApi;
    prioridad?: PrioridadReporteApi;
    criticos?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.tipo) searchParams.set('tipo', params.tipo);
    if (params?.prioridad) searchParams.set('prioridad', params.prioridad);
    if (params?.criticos) searchParams.set('criticos', 'true');
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<ReporteCampoDTO>>(
      `/reportes-campo${qs ? `?${qs}` : ''}`,
    );
  },

  /** Detalle del incidente: reporte + actividades + adjuntos. */
  detalle: (id: string) =>
    apiClient.get<ReportesIncidenteDetalle>(`/reportes-campo/${id}`),

  /** Catálogo maestro de subcategorías por torre. */
  subcategorias: () =>
    apiClient.get<SubcategoriaDTO[]>('/reportes-campo/subcategorias'),

  crear: (data: ReporteCampoCreateInput) =>
    apiClient.post<ReporteCampoDTO>('/reportes-campo', data),

  actualizar: (id: string, data: Partial<ReporteCampoCreateInput>) =>
    apiClient.patch<ReporteCampoDTO>(`/reportes-campo/${id}`, data),

  /** Iniciar (EN_CURSO) o Cerrar (CERRADO) el incidente. */
  cambiarEstado: (id: string, estado: 'EN_CURSO' | 'CERRADO') =>
    apiClient.patch<ReporteCampoDTO>(`/reportes-campo/${id}/estado`, { estado }),

  /** Aceptar el incidente: RESPONSABLE = quien lo acepta. */
  aceptar: (id: string) =>
    apiClient.post<ReporteCampoDTO>(`/reportes-campo/${id}/aceptar`, {}),

  /** Proyectos EN_PROCESO para el select "Ubicación — Proyecto". */
  proyectos: () => apiClient.get<{ id: string; nombre: string }[]>('/reportes-campo/proyectos-en-proceso'),

  /** Asigna "quién le cae": trabajador del sistema y/o nombre libre. */
  asignar: (id: string, data: { asignadoA?: string | null; asignadoNombre?: string | null }) =>
    apiClient.patch<ReporteCampoDTO>(`/reportes-campo/${id}/asignar`, data),

  /** Publica una actividad en la bitácora del incidente. */
  comentar: (id: string, texto: string) =>
    apiClient.post<ActividadDTO>(`/reportes-campo/${id}/actividades`, { texto }),

  /** Adjunta una imagen (base64) al incidente. */
  adjuntar: (
    id: string,
    data: { nombre: string; mime: string; tamano: number; datos: string },
  ) => apiClient.post<AdjuntoDTO>(`/reportes-campo/${id}/adjuntos`, data),

  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/reportes-campo/${id}`),

  stats: () =>
    apiClient.get<ReportesCampoStats>('/reportes-campo/stats'),
};

export interface LicenciaDTO {
  tipo: string;
  categoria: string;
  folio: string;
  vigencia?: string;
  vigenciaIndefinida?: boolean;
}

export interface ContactoEmergenciaDTO {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface TrabajadorDTO {
  id: string;
  nombre: string;
  puesto: string;
  categoriaPuesto: string;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones';
  entrada: string;
  telefono: string;
  proyectos: string[];
  avatar: string;
  sueldoFiscal: number;
  sueldoEfectivo: number;
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  maquinaAsignadaId?: string;
  maquinaAsignadaNombre?: string;
  estadoRenta?: string;
  clienteRentaActual?: string;
  licenciaODC3?: { tipo: string; vigencia: string; folio: string };
  fechaContratacion?: string;
  contactoEmergencia?: ContactoEmergenciaDTO;
  vacacionesDias?: number;
  horasExtraSemana?: number;
  tarifaHoraExtra?: number;
  descuentosSemana?: number;
  conceptoDescuento?: string;
  /** Cuenta de acceso P14 (solo en el listado): para la acción "Reiniciar PIN" (PR #18 #6). */
  usuarioId?: string;
  numeroEmpleado?: string;
}

export interface TrabajadorCreateInput {
  nombre: string;
  puesto: string;
  categoriaPuesto: string;
  telefono: string;
  entrada: string;
  sueldoFiscal: number;
  sueldoEfectivo: number;
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  /** Rol de acceso a la app (P14): el alta crea numero_empleado + PIN temporal. */
  rolId: string;
  /** Encargado (Residente) al que reporta — opcional (§6.8). */
  encargadoId?: string;
  proyecto?: string;
  maquinaId?: string;
  fechaContratacion?: string;
  vacacionesDias?: number;
  licencia?: LicenciaDTO;
  contactoEmergencia?: ContactoEmergenciaDTO;
}

/** Credenciales del alta (P14, §6.6): el PIN temporal se entrega UNA vez, nunca se vuelve a pedir. */
export interface IdentidadAltaDTO {
  numeroEmpleado: string;
  pinTemporal: string;
  temporalHasta: string;
}

export type TrabajadorAltaDTO = TrabajadorDTO & { identidad: IdentidadAltaDTO };

export interface LiquidarInput {
  tipoTerminacion: 'Despido' | 'Renuncia' | 'Convenio';
  diasTrabajadosPeriodo: number;
  diasVacacionesPendientes: number;
  deduccionesPrestamos?: number;
}

export interface LiquidacionDesglose {
  tipoTerminacion: string;
  aniosAntiguedad: number;
  sueldoDiario: number;
  montoDiasTrabajados: number;
  montoAguinaldo: number;
  montoVacaciones: number;
  montoPrimaVacacional: number;
  subtotalFiniquito: number;
  montoIndemnizacion90Dias: number;
  montoIndemnizacion20DiasPorAno: number;
  montoPrimaAntiguedad: number;
  subtotalIndemnizaciones: number;
  deduccionesPrestamos: number;
  granTotalNeto: number;
}

export interface ProyectoCatalogoDTO {
  id: string;
  nombre: string;
  /** Ubicación de su primera obra ('' si no tiene); `/catalogos/proyectos` la manda. */
  ubicacion?: string;
}

export interface MaquinaCatalogoDTO {
  id: string;
  nombre: string;
}

export const catalogosApi = {
  proyectos: () => apiClient.get<ProyectoCatalogoDTO[]>('/catalogos/proyectos'),
  maquinas: () => apiClient.get<MaquinaCatalogoDTO[]>('/maquinas'),
};

/** Máquina para los selects de Trabajadores: `codigo` es lo que esperan la API de trabajadores y la de bitácoras. */
export interface MaquinaTrabajadoresDTO {
  codigo: string;
  nombre: string;
  /** Trabajador que la tiene asignada hoy (para avisar antes de reasignarla). */
  operadorId: string | null;
  operadorNombre: string | null;
}

export interface ResidenteCatalogoDTO {
  id: string;
  nombre: string;
  numeroEmpleado: string | null;
}

export interface RolCatalogoDTO {
  id: string;
  nombre: string;
}

export interface CatalogosTrabajadoresDTO {
  maquinas: MaquinaTrabajadoresDTO[];
  proyectos: ProyectoCatalogoDTO[];
  /** Encargados (Residente) para el alta P14. */
  residentes: ResidenteCatalogoDTO[];
  /** Roles de acceso para el alta P14. */
  roles: RolCatalogoDTO[];
}

export const trabajadoresApi = {
  /** Listar trabajadores con búsqueda, filtros y paginación */
  listar: (params?: { search?: string; categoriaPuesto?: string; estado?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.categoriaPuesto) searchParams.set('categoriaPuesto', params.categoriaPuesto);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<TrabajadorDTO>>(`/trabajadores${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: string) => apiClient.get<TrabajadorDTO>(`/trabajadores/${id}`),

  /** Máquinas y proyectos con el permiso de RRHH (rrhh.trabajadores.ver). */
  catalogos: () => apiClient.get<CatalogosTrabajadoresDTO>('/trabajadores/catalogos'),

  crear: (data: TrabajadorCreateInput) => apiClient.post<TrabajadorAltaDTO>('/trabajadores', data),

  actualizar: (id: string, data: Partial<TrabajadorCreateInput> & { estado?: string }) =>
    apiClient.patch<TrabajadorDTO>(`/trabajadores/${id}`, data),

  eliminar: (id: string) => apiClient.delete<{ message: string }>(`/trabajadores/${id}`),

  liquidar: (id: string, data: LiquidarInput) => apiClient.post<LiquidacionDesglose>(`/trabajadores/${id}/liquidar`, data),
};

export interface BitacoraRentaDTO {
  id: string;
  folio: string;
  trabajadorId: string;
  trabajadorNombre: string;
  maquinaId: string;
  maquinaNombre: string;
  fecha: string;
  cliente: string;
  obraUbicacion: string;
  horaInicio: string;
  horaFin: string;
  horasEfectivas: number;
  horasExtras: number;
  horometroInicial: number;
  horometroFinal: number;
  actividadRealizada: string;
  firmaCliente: { firmado: boolean; nombreResidente?: string; cargoResidente?: string; fechaFirma?: string };
  estadoCobro: 'Listo para Facturar' | 'Facturado' | 'Pendiente Firma';
  tarifaHoraRenta: number;
  importeTotalRenta: number;
}

export interface BitacoraRentaCreateInput {
  trabajadorId: string;
  maquinaId: string;
  fecha: string;
  cliente: string;
  obraUbicacion: string;
  horaInicio: string;
  horaFin: string;
  horasEfectivas: number;
  horasExtras?: number;
  horometroInicial: number;
  horometroFinal: number;
  actividadRealizada: string;
  tarifaHoraRenta: number;
  firmado?: boolean;
  nombreResidente?: string;
  cargoResidente?: string;
}

export const bitacorasRentaApi = {
  listar: (params?: { search?: string; trabajadorId?: string; maquinaId?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.trabajadorId) searchParams.set('trabajadorId', params.trabajadorId);
    if (params?.maquinaId) searchParams.set('maquinaId', params.maquinaId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<BitacoraRentaDTO>>(`/bitacoras-renta${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: string) => apiClient.get<BitacoraRentaDTO>(`/bitacoras-renta/${id}`),

  crear: (data: BitacoraRentaCreateInput) => apiClient.post<BitacoraRentaDTO>('/bitacoras-renta', data),

  actualizar: (id: string, data: Partial<BitacoraRentaCreateInput> & { estadoCobro?: string }) =>
    apiClient.patch<BitacoraRentaDTO>(`/bitacoras-renta/${id}`, data),

  eliminar: (id: string) => apiClient.delete<{ message: string }>(`/bitacoras-renta/${id}`),

  /** Cierra la bitácora LISTO_FACTURAR y hace nacer la CxC (O3). Permiso: rrhh.trabajadores.editar */
  facturar: (id: string) => apiClient.post<BitacoraFacturarResponse>(`/bitacoras-renta/${id}/facturar`, undefined),
};

/** Respuesta del endpoint POST /bitacoras-renta/:id/facturar. */
export interface BitacoraFacturarResponse {
  cuenta: {
    id: string;
    bitacoraId: string;
    folio: string;
    clienteId: string;
    proyectoId: string | null;
    monto: number;
    fechaVencimiento: string;
    estado: 'PENDIENTE';
  };
  bitacora: { id: string; folio: string; estadoCobro: string };
}

// ────────────────────────────────────────────────────────────
//  Asistencia API
// ────────────────────────────────────────────────────────────

export interface HorasExtraAsistenciaDTO {
  id: string;
  inicio: string;
  fin?: string;
  horasCalculadas: number;
  tarifaPorHora: number;
  montoTotal: number;
  estado: 'En Curso' | 'Aprobado' | 'Pendiente' | 'Rechazado';
  motivo?: string;
  coordenadasInicio?: { lat: number; lng: number };
  coordenadasFin?: { lat: number; lng: number };
}

export interface RegistroAsistenciaDTO {
  id: string;
  trabajadorId: string;
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'No Presentado' | 'Salida Anticipada' | 'Omisión';
  /** Registrado sin checar (falta u omisión resuelta): sus coordenadas y obra son de relleno, no reales. */
  sinMarcaje: boolean;
  /** Omisión sin resolver pasada la hora límite (17:00) o de un día anterior: cuenta como falta. */
  omisionVencida?: boolean;
  /** Motivo con el que la administradora resolvió la omisión, y cuándo. */
  omisionMotivo?: string;
  omisionResueltaEn?: string;
  ubicacion: string;
  coordenadas: { lat: number; lng: number };
  salidaCoordenadas?: { lat: number; lng: number };
  salidaUbicacion?: string;
  obraAsignada: string;
  obraCoordenadas: { lat: number; lng: number };
  distanciaMetros: number;
  radioPermitidoMetros: number;
  enSitio: boolean;
  precisionGpsMetros: number;
  dispositivo: string;
  horaMarcajeExacta?: string;
  horaSalidaExacta?: string;
  horasTrabajadasOrdinarias?: number;
  salidaAnticipada?: boolean;
  motivoSalidaAnticipada?: string;
  horasExtra?: HorasExtraAsistenciaDTO;
  bateria?: number;
  notas?: string;
}

export interface DiaAsistenciaSemanaDTO {
  dia: 'Lun' | 'Mar' | 'Mie' | 'Jue' | 'Vie' | 'Sab';
  fecha: string;
  /** 'Omisión': aún puede justificarse hoy. 'Pendiente': hoy, todavía dentro de su tolerancia de entrada. */
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'Salida Anticipada' | 'Descanso' | 'Omisión' | 'Pendiente';
  registroId?: string;
  horaEntrada?: string;
  horaSalida?: string;
  horasTrabajadas: number;
  horasExtra?: number;
  enSitioGps: boolean;
  motivo?: string;
}

export interface AsistenciaSemanalDTO {
  trabajadorId: string;
  semana: string;
  dias: DiaAsistenciaSemanaDTO[];
  totalDiasAsistidos: number;
  totalFaltas: number;
  totalRetardos: number;
  totalOmisionesPendientes: number;
  /** Omisiones sin resolver que ya vencieron; están incluidas en totalFaltas. */
  totalOmisionesVencidas: number;
  totalHorasOrdinarias: number;
  /** Horas extra registradas que siguen vigentes (sin rechazadas ni borradas), aprobadas o no. */
  totalHorasExtra: number;
  /** Lo único que paga la nómina: horas extra aprobadas, al monto con que se aprobaron. */
  totalHorasExtraAprobadas: number;
  montoHorasExtraAprobadas: number;
  /** Pendientes o en curso: todavía no se pagan. */
  totalHorasExtraSinAutorizar: number;
}

export type ResolucionOmision = 'Falta' | 'Retardo';

export interface ResolverOmisionInput {
  resolucion: ResolucionOmision;
  motivo: string;
}

export interface RegistrarUbicacionObraInput {
  lat: number;
  lng: number;
  radioPermitidoMetros: number;
  /** Sin precisión, la API la toma como captura manual. */
  precisionGpsMetros?: number;
}

/** La API valida la geocerca con la ubicación y el radio guardados de la obra; el cliente solo manda su GPS. */
export interface MarcarEntradaInput {
  trabajadorId: string;
  obraId: string;
  lat: number;
  lng: number;
  precisionGpsMetros?: number;
  dispositivo: string;
  bateria?: number;
  ubicacion?: string;
  notas?: string;
}

export interface MarcarSalidaInput {
  trabajadorId: string;
  lat: number;
  lng: number;
  precisionGpsMetros?: number;
  dispositivo: string;
  ubicacion?: string;
  salidaAnticipada?: boolean;
  motivoSalidaAnticipada?: string;
  horasTrabajadasOrdinarias?: number;
}

export interface MarcarCuadrillaInput {
  obraId: string;
  trabajadorIds: string[];
  lat: number;
  lng: number;
  precisionGpsMetros?: number;
  dispositivo: string;
  ubicacion?: string;
}

export interface RegistrarHorasExtraInput {
  inicio: string;
  fin?: string;
  horasCalculadas: number;
  tarifaPorHora?: number;
  motivo?: string;
  latInicio?: number;
  lngInicio?: number;
  latFin?: number;
  lngFin?: number;
}

export interface ObraLite {
  id: string;
  nombre: string;
  lat?: number;
  lng?: number;
  radioPermitidoMetros?: number;
}

export const asistenciaApi = {
  listar: (params?: {
    fecha?: string;
    trabajadorId?: string;
    obraId?: string;
    estado?: string;
    enSitio?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.fecha) searchParams.set('fecha', params.fecha);
    if (params?.trabajadorId) searchParams.set('trabajadorId', params.trabajadorId);
    if (params?.obraId) searchParams.set('obraId', params.obraId);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.enSitio !== undefined) searchParams.set('enSitio', String(params.enSitio));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<RegistroAsistenciaDTO>>(`/asistencia${qs ? `?${qs}` : ''}`);
  },

  semanal: (params?: { fecha?: string; trabajadorId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.fecha) searchParams.set('fecha', params.fecha);
    if (params?.trabajadorId) searchParams.set('trabajadorId', params.trabajadorId);
    const qs = searchParams.toString();
    return apiClient.get<AsistenciaSemanalDTO[]>(`/asistencia/semanal${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: string) => apiClient.get<RegistroAsistenciaDTO>(`/asistencia/${id}`),

  marcarEntrada: (data: MarcarEntradaInput) => apiClient.post<RegistroAsistenciaDTO>('/asistencia/entrada', data),

  marcarSalida: (data: MarcarSalidaInput) => apiClient.post<RegistroAsistenciaDTO>('/asistencia/salida', data),

  marcarCuadrilla: (data: MarcarCuadrillaInput) =>
    apiClient.post<{ creados: RegistroAsistenciaDTO[]; omitidos: string[] }>('/asistencia/cuadrilla', data),

  registrarFalta: (data: { trabajadorId: string; fecha?: string; notas?: string }) =>
    apiClient.post<RegistroAsistenciaDTO>('/asistencia/faltas', data),

  actualizarEstado: (id: string, estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado') =>
    apiClient.patch<RegistroAsistenciaDTO>(`/asistencia/${id}/estado`, { estado }),

  /** La administradora resuelve la omisión de un registro (checó tarde). Permiso: rrhh.asistencia.editar */
  resolverOmision: (id: string, data: ResolverOmisionInput) =>
    apiClient.patch<RegistroAsistenciaDTO>(`/asistencia/${id}/omision`, data),

  /** Omisión de quien no checó nada ese día: crea el registro ya resuelto. */
  resolverOmisionSinMarcaje: (data: ResolverOmisionInput & { trabajadorId: string; fecha?: string }) =>
    apiClient.post<RegistroAsistenciaDTO>('/asistencia/omisiones', data),

  /** Centro y radio de la geocerca de una obra. Permiso: rrhh.asistencia.editar */
  registrarUbicacionObra: (obraId: string, data: RegistrarUbicacionObraInput) =>
    apiClient.patch<ObraLite>(`/asistencia/obras/${obraId}/ubicacion`, data),

  registrarHorasExtra: (id: string, data: RegistrarHorasExtraInput) =>
    apiClient.post<RegistroAsistenciaDTO>(`/asistencia/${id}/horas-extra`, data),

  aprobarHorasExtra: (horasExtraId: string) =>
    apiClient.patch<RegistroAsistenciaDTO>(`/asistencia/horas-extra/${horasExtraId}/aprobar`, {}),

  rechazarHorasExtra: (horasExtraId: string) =>
    apiClient.patch<RegistroAsistenciaDTO>(`/asistencia/horas-extra/${horasExtraId}/rechazar`, {}),

  obras: () => apiClient.get<ObraLite[]>('/catalogos/obras'),
};

// ────────────────────────────────────────────────────────────
//  Nómina API
// ────────────────────────────────────────────────────────────

export interface LineaNominaDTO {
  id: string;
  concepto: string;
  tipo: string;
  monto: number;
}

export interface NominaRowDTO {
  id: string;
  trabajadorId: string;
  trabajadorNombre: string;
  puesto: string;
  categoriaPuesto: string;
  avatar: string;
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Mixto';
  sueldoFiscal: number;
  sueldoEfectivo: number;
  diasTrabajados: number;
  diasFaltas: number;
  horasOrdinarias: number;
  horasExtra: number;
  totalPercepciones: number;
  totalDeducciones: number;
  totalNeto: number;
  estado: 'Pendiente' | 'Pagado';
  percepciones: LineaNominaDTO[];
  deducciones: LineaNominaDTO[];
}

export interface PeriodoNominaDTO {
  id: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export interface RegistrarAjusteInput {
  tipo: 'Bono' | 'Descuento' | 'Prestamo';
  monto: number;
  concepto: string;
}

export const nominaApi = {
  actual: (params?: { fecha?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.fecha) searchParams.set('fecha', params.fecha);
    const qs = searchParams.toString();
    return apiClient.get<{ periodo: PeriodoNominaDTO; items: NominaRowDTO[] }>(`/nomina/actual${qs ? `?${qs}` : ''}`);
  },

  sincronizarAsistencia: (periodoId: string) =>
    apiClient.post<{
      items: NominaRowDTO[];
      totalHorasExtraSincronizadas: number;
      totalFaltasAplicadas: number;
      totalOmisionesPendientes: number;
      totalOmisionesVencidas: number;
      /** Nóminas ya pagadas que la sincronización no tocó. */
      nominasPagadasSinCambio: number;
      /** Horas extra pendientes o en curso: no se pagaron porque todavía no se autorizan. */
      totalHorasExtraSinAutorizar: number;
    }>(
      `/nomina/${periodoId}/sincronizar`,
      {},
    ),

  registrarAjuste: (nominaId: string, data: RegistrarAjusteInput) =>
    apiClient.post<NominaRowDTO>(`/nomina/${nominaId}/ajuste`, data),

  actualizarEstado: (nominaId: string, estado: 'Pendiente' | 'Pagado') =>
    apiClient.patch<NominaRowDTO>(`/nomina/${nominaId}/estado`, { estado }),

  pagarTodos: (periodoId: string) =>
    apiClient.post<{ items: NominaRowDTO[]; actualizados: number }>(`/nomina/${periodoId}/pagar-todos`, {}),
};

// ────────────────────────────────────────────────────────────
//  Finanzas API
// ────────────────────────────────────────────────────────────

export type TipoTransaccionApi = 'INGRESO' | 'EGRESO';

/** Formato que devuelve el backend serializado (modelo `transacciones`) */
export interface TransaccionDTO {
  id: string;
  codigo: string | null;
  tipo: TipoTransaccionApi;
  categoria: string;
  /** Categoría personalizada cuando `categoria` es "Otros". */
  otraCategoria?: string | null;
  /** Categoría efectiva a mostrar (si "Otros" con texto, muestra el texto). */
  catEfectiva?: string;
  monto: number;
  fecha: string;
  descripcion: string;
  activo: boolean;
  creadoEn: string;
}

export interface FinanzasStats {
  balance: number;
  totalIngresos: number;
  totalEgresos: number;
  cantidad: number;
}

export type VentanaFlujoDTO =
  | 'vencido'
  | '0-30d'
  | '31-60d'
  | '61-90d'
  | '+90d'
  | 'sin_vencimiento';

export interface VentanaFlujoItem {
  ventana: VentanaFlujoDTO;
  label: string;
  porCobrar: number;
  porPagar: number;
  neto: number;
}

export interface FlujoNetoDTO {
  items: VentanaFlujoItem[];
  totales: { porCobrar: number; porPagar: number; neto: number };
}

export interface TransaccionCreateInput {
  tipo: TipoTransaccionApi;
  categoria: string;
  monto: number;
  fecha: string;
  descripcion: string;
  /** Categoría personalizada cuando `categoria` es "Otros". */
  otraCategoria?: string;
}

/** Catálogo de categorías financieras disponibles (frontend estático) */
export const FinanzasCategorias: { value: string; label: string }[] = [
  { value: 'Pago de Obra', label: 'Pago de Obra' },
  { value: 'Anticipo de Cliente', label: 'Anticipo de Cliente' },
  { value: 'Venta de Material', label: 'Venta de Material' },
  { value: 'Renta de Maquinaria', label: 'Renta de Maquinaria' },
  { value: 'Combustible', label: 'Combustible' },
  { value: 'Nómina', label: 'Nómina' },
  { value: 'Refacciones', label: 'Refacciones' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Impuestos', label: 'Impuestos' },
  { value: 'Otros', label: 'Otros' },
];

export const finanzasApi = {
  /** Listar transacciones con búsqueda, filtros y paginación */
  listar: (params?: {
    search?: string;
    tipo?: TipoTransaccionApi;
    categoria?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tipo) searchParams.set('tipo', params.tipo);
    if (params?.categoria) searchParams.set('categoria', params.categoria);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<TransaccionDTO>>(
      `/finanzas${qs ? `?${qs}` : ''}`,
    );
  },

  /** Obtener una transacción por ID */
  obtener: (id: string) =>
    apiClient.get<TransaccionDTO>(`/finanzas/${id}`),

  /** Crear una transacción */
  crear: (data: TransaccionCreateInput) =>
    apiClient.post<TransaccionDTO>('/finanzas', data),

  /** Actualizar una transacción */
  actualizar: (id: string, data: Partial<TransaccionCreateInput>) =>
    apiClient.patch<TransaccionDTO>(`/finanzas/${id}`, data),

  /** Eliminar una transacción (soft delete) */
  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/finanzas/${id}`),

  /** Estadísticas financieras */
  stats: () =>
    apiClient.get<FinanzasStats>('/finanzas/stats'),

  /** Flujo neto proyectado CxC vs CxP por ventana de vencimiento */
  flujoNeto: () =>
    apiClient.get<FlujoNetoDTO>('/finanzas/flujo-neto'),

  /** Descarga un CSV de las transacciones (descarga directa del navegador). */
  exportar: async (params?: {
    search?: string;
    tipo?: TipoTransaccionApi;
    categoria?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tipo) searchParams.set('tipo', params.tipo);
    if (params?.categoria) searchParams.set('categoria', params.categoria);
    const qs = searchParams.toString();
    // `raw: true` hace que request() maneje el refresh 401 y devuelva la Response.
    const res = (await request<never>(
      `/finanzas/exportar${qs ? `?${qs}` : ''}`,
      { method: 'GET', raw: true },
    )) as unknown as Response;
    if (!res.ok) throw new Error('No se pudo exportar el CSV');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ────────────────────────────────────────────────────────────
//  Conciliación Bancaria API
// ────────────────────────────────────────────────────────────
export interface BancoDTO {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface CuentaBancariaDTO {
  id: string;
  bancoId: string;
  numero: string;
  nombre: string | null;
  saldoInicial: number;
  activo: boolean;
}

export interface MovimientoBancarioDTO {
  id: string;
  cuentaId: string;
  fecha: string;
  descripcion: string;
  deposito: number | null;
  retiro: number | null;
  conciliado: boolean;
  transaccionId: string | null;
  conciliadoEn: string | null;
  conciliadoPor: string | null;
  creadoEn: string | null;
}

export interface CandidataConciliacionDTO {
  id: string;
  codigo: string | null;
  tipo: 'INGRESO' | 'EGRESO';
  categoria: string;
  monto: number;
  fecha: string;
  descripcion: string;
}

/** Fila CSV inválida que el backend NO insertó; se reporta al usuario (Blocker #3). */
export interface DescarteCsv {
  /** Número de línea física del CSV (1-based, incluye header si existe). */
  linea: number;
  motivo: 'FECHA_INVALIDA' | 'MONTO_INVALIDO' | 'CAMPOS_FALTANTES';
}

export interface CargarLoteResult {
  totalMovimientos: number;
  insertados: number;
  duplicados: number;
  descartadas: DescarteCsv[];
}

/** Candidatas a conciliar: transacciones ±3 días del movimiento con monto similar. */
export const conciliacionApi = {
  bancos: () => apiClient.get<BancoDTO[]>('/finanzas/bancos'),

  crearBanco: (data: { nombre: string }) =>
    apiClient.post<BancoDTO>('/finanzas/bancos', data),

  cuentas: (bancoId: string) =>
    apiClient.get<CuentaBancariaDTO[]>(`/finanzas/bancos/${bancoId}/cuentas`),

  crearCuenta: (bancoId: string, data: { numero: string; nombre?: string; saldoInicial?: number }) =>
    apiClient.post<CuentaBancariaDTO>(`/finanzas/bancos/${bancoId}/cuentas`, data),

  movimientos: (cuentaId: string, params?: { soloNoConciliados?: boolean; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.soloNoConciliados) searchParams.set('soloNoConciliados', 'true');
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<MovimientoBancarioDTO>>(
      `/finanzas/cuentas/${cuentaId}/movimientos${qs ? `?${qs}` : ''}`,
    );
  },

  crearMovimiento: (cuentaId: string, data: { fecha: string; descripcion: string; deposito?: number; retiro?: number }) =>
    apiClient.post<MovimientoBancarioDTO>(`/finanzas/cuentas/${cuentaId}/movimientos`, data),

  cargarLote: (cuentaId: string, csv: string) =>
    apiClient.post<CargarLoteResult>(`/finanzas/cuentas/${cuentaId}/movimientos/lote`, { csv }),

  candidatas: (movimientoId: string) =>
    apiClient.get<CandidataConciliacionDTO[]>(`/finanzas/movimientos/${movimientoId}/candidatas`),

  conciliar: (movimientoId: string, transaccionId: string) =>
    apiClient.post<{ conciliado: boolean; movimientoId: string; transaccionId: string; monto: number }>(
      `/finanzas/movimientos/${movimientoId}/conciliar`,
      { transaccionId },
    ),

  desconciliar: (movimientoId: string) =>
    apiClient.delete<{ conciliado: boolean; movimientoId: string }>(
      `/finanzas/movimientos/${movimientoId}/conciliar`,
    ),
};

// ────────────────────────────────────────────────────────────
//  Criba API
// ────────────────────────────────────────────────────────────

/** Enum de turno que espera el backend (Prisma `Turno`) — para crear/editar/filtrar. */
export type TurnoCribaApi = 'MATUTINO' | 'VESPERTINO';

/** Formato que devuelve el backend serializado (la UI muestra `turno` como etiqueta). */
export interface RegistroCribaDTO {
  id: string;
  codigo: string | null;
  fecha: string; // YYYY-MM-DD
  turno: 'Matutino' | 'Vespertino';
  operadorId: string | null;
  operador: string | null;
  tipoMaterial: string;
  materialProducido: number;
  horasTrabajadas: number;
  materialAlBanco: number;
  observaciones: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CribaStats {
  totalProducido: number;
  totalAlBanco: number;
  totalHoras: number;
  eficiencia: number;
  merma: number;
  mermaPorcentaje: number;
  porMaterial: {
    tipo: string;
    producido: number;
    alBanco: number;
    merma: number;
    ef: number;
  }[];
}

export interface CribaCatalogos {
  trabajadores: { id: string; nombre: string }[];
}

export interface CribaCreateInput {
  fecha: string;
  turno: TurnoCribaApi;
  operadorId?: string;
  tipoMaterial: string;
  materialProducido: number;
  horasTrabajadas: number;
  materialAlBanco: number;
  observaciones?: string;
}

export const cribaApi = {
  /** Listar registros con búsqueda, filtros y paginación (server-side) */
  listar: (params?: {
    search?: string;
    turno?: TurnoCribaApi;
    tipoMaterial?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.turno) searchParams.set('turno', params.turno);
    if (params?.tipoMaterial) searchParams.set('tipoMaterial', params.tipoMaterial);
    if (params?.fechaDesde) searchParams.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) searchParams.set('fechaHasta', params.fechaHasta);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<RegistroCribaDTO>>(
      `/criba${qs ? `?${qs}` : ''}`,
    );
  },

  /** Obtener un registro por ID */
  obtener: (id: string) =>
    apiClient.get<RegistroCribaDTO>(`/criba/${id}`),

  /** Estadísticas para las tarjetas */
  stats: () =>
    apiClient.get<CribaStats>('/criba/stats'),

  /** Catálogo de trabajadores (operadores) para el formulario */
  catalogos: () =>
    apiClient.get<CribaCatalogos>('/criba/catalogos'),

  /** Crear un registro de turno */
  crear: (data: CribaCreateInput) =>
    apiClient.post<RegistroCribaDTO>('/criba', data),

  /** Actualizar un registro de turno */
  actualizar: (id: string, data: Partial<CribaCreateInput>) =>
    apiClient.patch<RegistroCribaDTO>(`/criba/${id}`, data),

  /** Eliminar (soft delete) un registro */
  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/criba/${id}`),
};

// ────────────────────────────────────────────────────────────
//  Ventas (Punto de Venta) API
// ────────────────────────────────────────────────────────────

export type MetodoPagoVentaApi = 'efectivo' | 'tarjeta' | 'transferencia';

/** Catálogo de materiales del POS (viene de `materiales_venta` + `materiales_precio`). */
export interface MaterialVentaDTO {
  id: string;
  sku: string;
  nombre: string;
  categoria: string | null;
  unidadBase: string;
  stock: number;
  precios: { medida: string; precio: number }[];
}

export interface VentasCatalogos {
  materiales: MaterialVentaDTO[];
}

export interface VentaItemInput {
  materialId: string;
  medida: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPct?: number;
}

export interface VentaPagoInput {
  metodo: MetodoPagoVentaApi;
  monto: number;
}

export interface CreateVentaInput {
  cajero: string;
  cliente?: string;
  terminal?: string;
  caja?: string;
  items: VentaItemInput[];
  pagos: VentaPagoInput[];
  metodo: MetodoPagoVentaApi;
  efectivoRecibido?: number;
  cambio?: number;
  descuentoPct?: number;
  descuentoTotal?: number;
  autorizadoPor?: string;
  idempotenciaKey?: string;
}

export interface VentaDTO {
  id: string;
  folio: string;
  ticket: string;
  ticketNumber: number;
  terminal: string;
  registerNumber: string;
  customer: string;
  cashier: string;
  subtotal: number;
  iva: number;
  ieps: number;
  total: number;
  method: MetodoPagoVentaApi;
  cashReceived?: number;
  change?: number;
  discountPct?: number;
  discountTotal?: number;
  authorizedBy?: string;
  itemsSold: number;
  createdAt: string;
  items: {
    id: string;
    materialId: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
    subtotal: number;
    discountPct?: number;
  }[];
  payments: { method: MetodoPagoVentaApi; amount: number }[];
}

export interface VentasHoy {
  ventas: VentaDTO[];
  stats: {
    count: number;
    total: number;
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  };
}

export interface RetiroVentaDTO {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  hora: string;
  autorizadoPor: string;
}

export interface CrearRetiroInput {
  concepto: string;
  monto: number;
  autorizadoPor: string;
}

export interface CierreVentaDTO {
  id: string;
  fecha: string;
  cajero: string;
  ventasCount: number;
  totalVentas: number;
  efectivoInicial: number;
  ventasEfectivo: number;
  totalRetiros: number;
  esperado: number;
  contado: number;
  diferencia: number;
  fondoSiguiente: number;
  notas?: string;
  denominaciones: Record<string, number>;
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  aprobadorId?: string | null;
  motivoRechazo?: string | null;
}

export interface CrearCierreInput {
  denominaciones: Record<string, number>;
  efectivoInicial?: number;
  fondoSiguiente?: number;
  notas?: string;
}

export interface QueryCierresDto {
  search?: string;
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface TurnoConfig {
  apertura: string;
  cierre: string;
  formato: string;
}

export interface AperturaDTO {
  id: string;
  fecha: string;
  cajero: string;
  fondoInicial: number;
  abiertaEn: string;
}

export interface CrearAperturaInput {
  fondoInicial: number;
}

export const ventasApi = {
  /** Catálogo de materiales + medidas + precios (alimenta selects de Material / Medida). */
  catalogos: () => apiClient.get<VentasCatalogos>('/ventas/catalogos'),

  /** Ventas del día + estadísticas por método de pago. */
  hoy: () => apiClient.get<VentasHoy>('/ventas/hoy'),

  /** Registrar una venta (valida stock/medida y lo persiste). */
  crear: (data: CreateVentaInput) => apiClient.post<VentaDTO>('/ventas', data),

  /** Retiros de efectivo del día. */
  retiros: () => apiClient.get<{ items: RetiroVentaDTO[] }>('/ventas/retiros'),

  /** Registrar un retiro. */
  crearRetiro: (data: CrearRetiroInput) =>
    apiClient.post<RetiroVentaDTO>('/ventas/retiros', data),

  /** Estado del cierre de caja del día (+ config del turno y apertura). */
  cierreHoy: () =>
    apiClient.get<{
      existe: boolean;
      registro: CierreVentaDTO | null;
      config: TurnoConfig;
      apertura: { existe: boolean; registro: AperturaDTO | null };
    }>('/ventas/cierres/hoy'),

  /** Registrar el cierre de caja del día (arqueo). */
  crearCierre: (data: CrearCierreInput) =>
    apiClient.post<CierreVentaDTO>('/ventas/cierres', data),

  /** Aprobar un cierre de caja (solo Administrador). */
  aprobarCierre: (id: string) =>
    apiClient.patch<CierreVentaDTO>(`/ventas/cierres/${id}/aprobar`, {}),

  /** Rechazar un cierre de caja con motivo (solo Administrador). */
  rechazarCierre: (id: string, motivo: string) =>
    apiClient.patch<CierreVentaDTO>(`/ventas/cierres/${id}/rechazar`, { motivo }),

  /** Listar cierres de caja con filtros y paginación. */
  listarCierres: (query: QueryCierresDto) => {
    const searchParams = new URLSearchParams();
    if (query.search) searchParams.set('search', query.search);
    if (query.estado) searchParams.set('estado', query.estado);
    if (query.fechaDesde) searchParams.set('fechaDesde', query.fechaDesde);
    if (query.fechaHasta) searchParams.set('fechaHasta', query.fechaHasta);
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));
    const qs = searchParams.toString();
    return apiClient.get<{
      items: CierreVentaDTO[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      stats: { total: number; aprobados: number; rechazados: number; pendientes: number };
    }>(`/ventas/cierres${qs ? `?${qs}` : ''}`);
  },

  /** Configuración del turno (apertura/cierre 24h). */
  config: () => apiClient.get<TurnoConfig>('/ventas/config'),

  /** Actualiza configuración del turno (solo Administrador). */
  updateConfig: (data: Partial<TurnoConfig>) =>
    apiClient.patch<TurnoConfig>('/ventas/config', data),

  /** Estado de la apertura de turno del día. */
  aperturaHoy: () =>
    apiClient.get<{ existe: boolean; registro: AperturaDTO | null }>(
      '/ventas/apertura/hoy',
    ),

  /** Registrar la apertura del turno (fondo inicial). */
  crearApertura: (data: CrearAperturaInput) =>
    apiClient.post<AperturaDTO>('/ventas/apertura', data),
};

/** Convierte un material del catálogo BD al shape `Product` que usa el POS. */
export function materialToProduct(m: MaterialVentaDTO): Product {
  const prices: Record<string, number> = {};
  for (const p of m.precios) prices[p.medida] = p.precio;
  const units = m.precios.map((p) => p.medida);
  const defaultUnit = m.unidadBase || units[0] || 'm³';
  return {
    id: m.id,
    sku: m.sku,
    barcode: '',
    name: m.nombre,
    category: m.categoria ?? undefined,
    condition: 'Nuevo',
    stock: m.stock,
    unit: defaultUnit,
    units: units.length ? units : [defaultUnit],
    prices,
    priceMxn: prices[defaultUnit] ?? m.precios[0]?.precio ?? 0,
  };
}

/** Convierte la respuesta del backend a la `POSSale` que renderiza el ticket. */
export function ventaDtoToSale(v: VentaDTO, products: Product[]): POSSale {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: CartItem[] = v.items.map((i) => {
    const product = byId.get(i.materialId);
    return {
      product: product ?? {
        id: i.materialId,
        sku: '',
        barcode: '',
        name: i.name,
        condition: 'Nuevo',
        stock: 0,
        unit: i.unit,
        priceMxn: i.price,
      },
      quantity: i.quantity,
      unit: i.unit,
    };
  });

  const subtotal = v.subtotal;
  const iva = v.iva;
  const ieps = v.ieps;
  const taxBreakdown: TaxBreakdown = { subtotal, iva, ieps, totalTax: iva + ieps };

  return {
    id: v.id,
    ticketNumber: v.ticket,
    folio: v.folio,
    terminal: v.terminal,
    registerNumber: v.registerNumber,
    customer: v.customer,
    cashier: v.cashier,
    items,
    total: v.total,
    method: v.method,
    cashReceived: v.cashReceived,
    change: v.change,
    payments: v.payments.map((p) => ({ method: p.method, amount: p.amount })),
    taxBreakdown,
    paymentDetails: {},
    discountPct: v.discountPct,
    discountTotal: v.discountTotal,
    authorizedBy: v.authorizedBy,
    itemsSold: v.itemsSold,
    createdAt: v.createdAt,
  };
}

// ────────────────────────────────────────────────────────────
//  Clientes API
// ────────────────────────────────────────────────────────────

export interface ClienteDTO {
  id: string;
  codigo: string | null;
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  rfc: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ClientesStats {
  totalClientes: number;
  clientesActivos: number;
  empresas: number;
}

export interface ClienteCreateInput {
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
  rfc?: string;
  activo?: boolean;
}

export interface ConsolidadoClienteDTO {
  cliente: ClienteDTO;
  saldoTotal: number;
  cuentasPorCobrar: Array<{
    id: string;
    facturaFolio: string | null;
    proyecto: { id: string; codigo: string; nombre: string } | null;
    monto: number;
    montoPagado: number;
    saldo: number;
    fechaVencimiento: string | null;
    estado: string;
    situacion: string;
    diasAtraso: number;
  }>;
  facturas: Array<{
    id: string;
    codigo: string | null;
    folio: string;
    total: number;
    estado: string;
    fechaEmision: string | null;
  }>;
  cobros: Array<{
    id: string;
    codigo: string | null;
    monto: number;
    fecha: string | null;
    metodoPago: string;
    referencia: string | null;
    estado: string;
    revertido: boolean;
    cuentaMonto: number | null;
  }>;
  cotizaciones: Array<{
    id: string;
    codigo: string | null;
    descripcion: string;
    monto: number;
    fecha: string | null;
    estado: string;
  }>;
}

export const clientesApi = {
  /** Listar clientes con búsqueda, filtro de estado y paginación */
  listar: (params?: { search?: string; activo?: 'true' | 'false'; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.activo) searchParams.set('activo', params.activo);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<ClienteDTO>>(
      `/clientes${qs ? `?${qs}` : ''}`,
    );
  },

  /** Obtener un cliente por ID */
  obtener: (id: string) => apiClient.get<ClienteDTO>(`/clientes/${id}`),

  /** Estado de cuenta: saldo, CxC, facturas, cobros y cotizaciones */
  consolidado: (id: string) =>
    apiClient.get<ConsolidadoClienteDTO>(`/clientes/${id}/consolidado`),

  /** Crear un cliente */
  crear: (data: ClienteCreateInput) =>
    apiClient.post<ClienteDTO>('/clientes', data),

  /** Actualizar un cliente */
  actualizar: (id: string, data: Partial<ClienteCreateInput>) =>
    apiClient.patch<ClienteDTO>(`/clientes/${id}`, data),

  /** Eliminar un cliente (soft delete) */
  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/clientes/${id}`),

  /** Estadísticas del cliente para las tarjetas */
  stats: () => apiClient.get<ClientesStats>('/clientes/stats'),

  /** Historial de cotizaciones de un cliente (paginado) */
  cotizaciones: (clienteId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<CotizacionDTO>>(
      `/clientes/${clienteId}/cotizaciones${qs ? `?${qs}` : ''}`,
    );
  },

  /** Crear una cotización para un cliente (siempre PENDIENTE) */
  crearCotizacion: (clienteId: string, data: CotizacionCreateInput) =>
    apiClient.post<CotizacionDTO>(`/clientes/${clienteId}/cotizaciones`, data),
};

/** Formato que devuelve el backend serializado (modelo `cotizaciones`). */
export interface CotizacionDTO {
  id: string;
  codigo: string | null;
  clienteId: string;
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  motivoRechazo?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  // Campos del cliente (solo presentes en el listado/detalle global)
  clienteNombre?: string | null;
  clienteEmpresa?: string | null;
  clienteTelefono?: string | null;
  clienteCorreo?: string | null;
}

export interface CotizacionCreateInput {
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
}

/** Campos editables de una cotización (todos opcionales = PATCH). */
export interface CotizacionUpdateInput {
  clienteId?: string;
  descripcion?: string;
  monto?: number;
  fecha?: string; // YYYY-MM-DD
}

/** Métricas para las tarjetas de /cotizaciones. */
export interface CotizacionesStats {
  total: number;
  pendientes: number;
  aceptadas: number;
  rechazadas: number;
  montoAceptado: number;
}

/** Estado que acepta la API en body para cambiar el estado (mayúsculas). */
export type EstadoCotizacionApi = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export const cotizacionesApi = {
  /** Listado global de cotizaciones con búsqueda, filtros y paginación. */
  listar: (params?: {
    search?: string;
    estado?: EstadoCotizacionApi;
    clienteId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.clienteId) searchParams.set('clienteId', params.clienteId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<CotizacionDTO>>(
      `/cotizaciones${qs ? `?${qs}` : ''}`,
    );
  },

  /** Detalle de una cotización con datos del cliente. */
  obtener: (id: string) =>
    apiClient.get<CotizacionDTO>(`/cotizaciones/${id}`),

  /** Estadísticas para las tarjetas. */
  stats: () =>
    apiClient.get<CotizacionesStats>('/cotizaciones/stats'),

  /** Cambiar estado (Aceptada / Rechazada); motivoRechazo es obligatorio al rechazar. */
  cambiarEstado: (id: string, data: { estado: EstadoCotizacionApi; motivoRechazo?: string }) =>
    apiClient.patch<CotizacionDTO>(`/cotizaciones/${id}/estado`, data),

  /** Editar campos de la cotización (descripción, monto, fecha, cliente). */
  actualizar: (id: string, data: CotizacionUpdateInput) =>
    apiClient.patch<CotizacionDTO>(`/cotizaciones/${id}`, data),

  /** Facturar: acepta la cotización y crea factura + CxC en una transacción. */
  facturar: (id: string) =>
    apiClient.post<{
      cotizacionId: string;
      factura: { id: string; codigo: string; total: number; estado: string };
      cxc: { id: string; monto: number; fechaVencimiento: string };
    }>(`/cotizaciones/${id}/facturar`, {}),
};

// ────────────────────────────────────────────────────────────
//  Proveedores API (módulo proveedores: OC, abonos y CxP)
//  Backend: apps/api/src/proveedores/
// ────────────────────────────────────────────────────────────

/** Estados de orden de compra serializados por el backend (enum API). */
export type EstadoOrdenApi = 'PENDIENTE' | 'APROBADA' | 'RECIBIDA' | 'CANCELADA';

export interface ProveedorDTO {
  id: string;
  codigo: string | null;
  nombre: string;
  rfc: string | null;
  correo: string | null;
  telefono: string | null;
  categoria: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface OrdenCompraDTO {
  id: string;
  folio: string;
  proveedorId: string;
  proveedor: string | null;
  descripcion: string;
  monto: number;
  pagado: number;
  saldo: number;
  fecha: string; // ISO
  estado: EstadoOrdenApi;
  motivoCancelacion: string | null;
  activo: boolean;
}

export interface AbonoDTO {
  id: string;
  codigo: string;
  monto: number;
  fechaPago: string; // ISO
  metodoPago: string | null;
  referencia: string | null;
}

export interface OrdenCompraDetalleDTO extends OrdenCompraDTO {
  abonos: AbonoDTO[];
}

export interface EstadoCuentaResumenDTO {
  proveedorId: string;
  proveedor: string;
  operaciones: number;
  total: number;
  pagado: number;
  saldo: number;
}

export interface LedgerMovimientoDTO {
  fecha: string; // ISO
  folio: string;
  concepto: string;
  cargo: number;
  abono: number;
  saldo: number;
  estado: string;
}

export interface LedgerDetalleDTO {
  proveedorId: string;
  proveedor: string;
  movimientos: LedgerMovimientoDTO[];
  totales: {
    cargo: number;
    abono: number;
    saldo: number;
  };
}

export interface AbonoResultDTO {
  abono: AbonoDTO;
  orden: OrdenCompraDTO;
}

export interface ProveedorCreateInput {
  nombre: string;
  rfc?: string;
  correo?: string;
  telefono?: string;
  categoria: string;
}

export type ProveedorUpdateInput = Partial<ProveedorCreateInput>;

export interface OrdenCompraItemInput {
  articuloId?: string | null; // artículo del catálogo; null → línea de ALTA
  nombre?: string; // obligatorio si articuloId no viene (nuevo producto)
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompraCreateInput {
  proveedorId: string;
  descripcion?: string;
  fecha?: string; // YYYY-MM-DD
  items: OrdenCompraItemInput[]; // monto se deriva de la suma en el backend
}

export type OrdenCompraUpdateInput = Partial<
  Pick<OrdenCompraCreateInput, 'descripcion' | 'items'>
>;

export interface RegistrarAbonoInput {
  ordenCompraId: string;
  monto: number;
  metodoPago?: string; // EFECTIVO | TARJETA | TRANSFERENCIA | MIXTO
}

export interface CambiarEstadoOrdenInput {
  estado: EstadoOrdenApi;
  /** Obligatorio al cancelar (campo `motivo` del DTO backend). */
  motivo?: string;
}

export const proveedoresApi = {
  /** Listar proveedores con búsqueda, filtros y paginación. */
  listar: (params?: { search?: string; categoria?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.categoria) searchParams.set('categoria', params.categoria);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<ProveedorDTO>>(`/proveedores${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: string) => apiClient.get<ProveedorDTO>(`/proveedores/${id}`),

  crear: (data: ProveedorCreateInput) => apiClient.post<ProveedorDTO>('/proveedores', data),

  actualizar: (id: string, data: ProveedorUpdateInput) =>
    apiClient.patch<ProveedorDTO>(`/proveedores/${id}`, data),

  eliminar: (id: string) => apiClient.delete<void>(`/proveedores/${id}`),

  /** Resumen de estados de cuenta (proveedores con operaciones). */
  estadosCuenta: () => apiClient.get<EstadoCuentaResumenDTO[]>('/proveedores/estados-cuenta'),

  /** Ledger detalle de un proveedor: movimientos con saldo corrido + totales. */
  ledger: (id: string) => apiClient.get<LedgerDetalleDTO>(`/proveedores/${id}/estado-cuenta`),

  /** Registrar abono (pago) contra una orden; crea transacción EGRESO. */
  abonar: (proveedorId: string, data: RegistrarAbonoInput) =>
    apiClient.post<AbonoResultDTO>(`/proveedores/${proveedorId}/abonos`, data),
};

export const ordenesCompraApi = {
  /** Listar órdenes de compra con búsqueda, filtros y paginación. */
  listar: (params?: { search?: string; estado?: EstadoOrdenApi; proveedorId?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.proveedorId) searchParams.set('proveedorId', params.proveedorId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<OrdenCompraDTO>>(`/ordenes-compra${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: string) => apiClient.get<OrdenCompraDetalleDTO>(`/ordenes-compra/${id}`),

  crear: (data: OrdenCompraCreateInput) => apiClient.post<OrdenCompraDTO>('/ordenes-compra', data),

  actualizar: (id: string, data: OrdenCompraUpdateInput) =>
    apiClient.patch<OrdenCompraDTO>(`/ordenes-compra/${id}`, data),

  eliminar: (id: string) => apiClient.delete<void>(`/ordenes-compra/${id}`),

  /** Aprobar / Cancelar (la recepción tiene su propio endpoint). */
  cambiarEstado: (id: string, data: CambiarEstadoOrdenInput) =>
    apiClient.post<OrdenCompraDTO>(`/ordenes-compra/${id}/cambiar-estado`, data),

  /** Catálogo de artículos de inventario para las líneas de OC. */
  catalogoArticulos: (params?: { search?: string; page?: number; limit?: number }) =>
    inventarioApi.listar(params),

  /** Recibir OC aprobada: aplica al inventario (alta/entrada) y marca RECIBIDA. */
  recibir: (
    id: string,
    data?: {
      nuevosArticulos?: Array<{ lineaIndex: number; categoriaId: string; unidadId: string }>;
    },
  ) =>
    apiClient.post<{
      orden: { id: string; folio: string; estado: string };
      inventario: Array<{ lineaIndex: number; articuloId: string; cantidad: number; stockAnterior: number; stockResultante: number; altaNueva: boolean }>;
    }>(`/ordenes-compra/${id}/recibir`, data ?? {}),
};

// ─── Cobranza (cuentas por cobrar) ───────────────────────────────────────────
// Contrato consumido por la UI. Fuente real: módulo NestJS `cobranza`
// (modelos `cuentas_por_cobrar` y `pagos`).

export type EstadoCuentaCobranza = 'PENDIENTE' | 'PARCIAL' | 'SALDADO';
export type MetodoPagoCobro = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
export type SituacionCobranza = 'AL_CORRIENTE' | 'ATRASO_LEVE' | 'ATRASO_GRAVE' | 'SALDADO';

export interface CuentaPorCobrarDTO {
  id: string;
  clienteId: string;
  clienteNombre: string;
  empresa: string;
  obra: string;
  facturaFolio: string;
  monto: number;
  montoPagado: number;
  /** Saldo restante (monto - montoPagado) */
  saldo: number;
  /** Fecha emisión ISO (YYYY-MM-DD) */
  fechaEmision: string;
  /** Fecha vencimiento ISO (YYYY-MM-DD) */
  fechaVencimiento: string;
  /** Días de atraso (0 si está al corriente o sin vencer) */
  diasAtraso: number;
  estado: EstadoCuentaCobranza;
  situacion: SituacionCobranza;
  ultimoCobroFecha?: string;
  /** Proyecto asignado a la cuenta (O1). Null = "Sin proyecto". */
  proyectoId?: string | null;
  proyecto?: { id: string; codigo: string; nombre: string } | null;
}

/** Grupo de la cartera agrupada por proyecto (endpoint /cobranza/por-proyecto). */
export interface GrupoProyectoDTO {
  proyecto: { id: string; codigo: string; nombre: string } | null;
  totalCuentas: number;
  monto: number;
  pagado: number;
  saldo: number;
  vencido: number;
}

export interface PorProyectoResponse {
  items: GrupoProyectoDTO[];
  totales: { monto: number; pagado: number; saldo: number; vencido: number };
}

export interface CobroDTO {
  id: string;
  cuentaId: string;
  clienteNombre: string;
  monto: number;
  /** Fecha del cobro ISO (YYYY-MM-DD) */
  fecha: string;
  referencia: string;
  metodoPago: MetodoPagoCobro;
}

export interface VencimientoDTO {
  id: string;
  cuentaId: string;
  clienteNombre: string;
  obra: string;
  monto: number;
  fechaVencimiento: string;
  diasAtraso: number;
}

export interface CobranzaStats {
  totalPorCobrar: number;
  vencido: number;
  cobradoMes: number;
  clientesConSaldo: number;
}

export interface CobroCreateInput {
  monto: number;
  fecha?: string;
  metodoPago?: MetodoPagoCobro;
  referencia?: string;
}

/** Ledger de cobros de una cuenta (endpoint /cobranza/:id/cobros). */
export interface LedgerCobranzaDTO {
  cuentaId: string;
  saldo: number;
  cobros: CobroDTO[];
}

export interface CobranzaCuentaCreateInput {
  clienteId: string;
  facturaId?: string;
  monto: number;
  fechaVencimiento?: string;
}

export interface CobranzaCuentaUpdateInput {
  monto?: number;
  fechaVencimiento?: string;
}

export const cobranzaApi = {
  /** Listar cuentas por cobrar con búsqueda, filtros y paginación. */
  listar: (params?: {
    estado?: EstadoCuentaCobranza;
    situacion?: SituacionCobranza;
    clienteId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.situacion) searchParams.set('situacion', params.situacion);
    if (params?.clienteId) searchParams.set('clienteId', params.clienteId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<CuentaPorCobrarDTO>>(`/cobranza${qs ? `?${qs}` : ''}`);
  },

  /** Estadísticas globales de la cartera. */
  stats: () => apiClient.get<CobranzaStats>('/cobranza/stats'),

  /** Listar cobros (movimientos) globales con búsqueda, filtro y paginación. */
  cobros: (params?: { metodoPago?: MetodoPagoCobro; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.metodoPago) searchParams.set('metodoPago', params.metodoPago);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<CobroDTO>>(`/cobranza/cobros${qs ? `?${qs}` : ''}`);
  },

  /** Listar vencimientos (cuentas con saldo pendiente). */
  vencimientos: (params?: { search?: string; rango?: 'vencido' | 'por_vencer'; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.rango) searchParams.set('rango', params.rango);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<VencimientoDTO>>(`/cobranza/vencimientos${qs ? `?${qs}` : ''}`);
  },

  obtener: (id: string) => apiClient.get<CuentaPorCobrarDTO>(`/cobranza/${id}`),

  crearCuenta: (data: CobranzaCuentaCreateInput) =>
    apiClient.post<CuentaPorCobrarDTO>('/cobranza', data),

  actualizarCuenta: (id: string, data: CobranzaCuentaUpdateInput) =>
    apiClient.patch<CuentaPorCobrarDTO>(`/cobranza/${id}`, data),

  /** Ledger de movimientos de una cuenta. */
  cobrosDeCuenta: (id: string) => apiClient.get<LedgerCobranzaDTO>(`/cobranza/${id}/cobros`),

  /** Registrar cobro contra una cuenta; crea pago + ingreso en finanzas. */
  registrarCobro: (id: string, data: CobroCreateInput) =>
    apiClient.post<{ cobro: CobroDTO; cuenta: CuentaPorCobrarDTO }>(`/cobranza/${id}/cobros`, data),

  /** Revierte un cobro confirmado: soft-delete del pago, la CxC vuelve a su
   *  saldo anterior y se genera el EGRESO contable (traza inmutable). */
  revertirCobro: (id: string, cobroId: string, motivo: string) =>
    apiClient.post<{ cobroRevertido: { id: string; cuentaId: string; monto: number; motivo: string }; cuenta: CuentaPorCobrarDTO }>(
      `/cobranza/${id}/cobros/${cobroId}/revertir`,
      { motivo },
    ),

  /** Cartera agrupada por proyecto (grupo "Sin proyecto" para CxC sin asignar). */
  porProyecto: (params?: {
    estado?: EstadoCuentaCobranza;
    situacion?: SituacionCobranza;
    proyectoId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.situacion) searchParams.set('situacion', params.situacion);
    if (params?.proyectoId) searchParams.set('proyectoId', params.proyectoId);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return apiClient.get<PorProyectoResponse>(`/cobranza/por-proyecto${qs ? `?${qs}` : ''}`);
  },

  /** Descarga el CSV agrupado por proyecto (descarga directa, BOM UTF-8). */
  exportarPorProyecto: async (params?: {
    estado?: EstadoCuentaCobranza;
    situacion?: SituacionCobranza;
    proyectoId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.situacion) searchParams.set('situacion', params.situacion);
    if (params?.proyectoId) searchParams.set('proyectoId', params.proyectoId);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    // `raw: true` → request() maneja el refresh 401 y devuelve la Response.
    const res = (await request<never>(
      `/cobranza/por-proyecto/exportar${qs ? `?${qs}` : ''}`,
      { method: 'GET', raw: true },
    )) as unknown as Response;
    if (!res.ok) throw new Error('No se pudo exportar el CSV');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cobranza-por-proyecto-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ────────────────────────────────────────────────────────────
//  Facturas API (módulo facturas)
//  Backend: apps/api/src/facturas/
// ────────────────────────────────────────────────────────────

/** Estados de factura serializados por el backend (string del modelo `facturas`). */
export type EstadoFacturaApi = 'PENDIENTE' | 'TIMBRADA' | 'PAGADA' | 'CANCELADA';

export interface FacturaDTO {
  id: string;
  codigo: string;
  serie: string;
  folio: string;
  clienteId: string;
  clienteNombre: string;
  empresa: string;
  rfc: string;
  cotizacionId: string | null;
  cotizacionCodigo: string | null;
  subtotal: number;
  impuestos: number;
  total: number;
  moneda: string;
  tipoCambio: number;
  formaPago: string;
  metodoPago: string;
  usoCfdi: string;
  estado: string;
  timbradoEn: string | null;
  fechaEmision: string;
  periodoInicio: string | null;
  periodoFin: string | null;
  conceptos: FacturaConceptoDTO[];
  cuentaPorCobrar: { id: string; estado: string; montoPagado: number } | null;
}

export interface FacturaConceptoDTO {
  id: string;
  cantidad: number;
  unidad: string;
  descripcion: string;
  valorUnitario: number;
  importe: number;
  descuento: number;
  objetoImpuesto: string;
  impuestoTasa: number;
  impuestoImporte: number;
}

export interface FacturasStats {
  total: number;
  pendientes: number;
  timbradas: number;
  canceladas: number;
  montoTotal: number;
}

export interface FacturaCreateInput {
  clienteId: string;
  serie?: string;
  formaPago?: string;
  metodoPago?: string;
  usoCfdi?: string;
  conceptos: {
    cantidad: number;
    unidad: string;
    descripcion: string;
    valorUnitario: number;
    objetoImpuesto?: string;
  }[];
}

export interface FacturaEstadoInput {
  estado: 'TIMBRADA' | 'CANCELADA';
  motivoCancelacion?: string;
}

export const facturasApi = {
  /** Listar facturas con búsqueda, filtros y paginación. */
  listar: (params?: {
    search?: string;
    estado?: string;
    clienteId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.clienteId) searchParams.set('clienteId', params.clienteId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<FacturaDTO>>(`/facturas${qs ? `?${qs}` : ''}`);
  },

  /** Detalle de una factura. */
  obtener: (id: string) => apiClient.get<FacturaDTO>(`/facturas/${id}`),

  /** Crear una factura en estado PENDIENTE. */
  crear: (data: FacturaCreateInput) => apiClient.post<FacturaDTO>('/facturas', data),

  /** Actualizar datos fiscales de una factura PENDIENTE. */
  actualizar: (id: string, data: Partial<FacturaCreateInput>) =>
    apiClient.patch<FacturaDTO>(`/facturas/${id}`, data),

  /** Cambiar estado (PENDIENTE→TIMBRADA, PENDIENTE→CANCELADA). */
  cambiarEstado: (id: string, data: FacturaEstadoInput) =>
    apiClient.patch<FacturaDTO>(`/facturas/${id}/estado`, data),

  /** Eliminar (soft delete) una factura PENDIENTE sin CxC. */
  eliminar: (id: string) => apiClient.delete<{ message: string }>(`/facturas/${id}`),

  /** Agregar concepto a una factura PENDIENTE. */
  agregarConcepto: (
    id: string,
    data: { cantidad: number; unidad: string; descripcion: string; valorUnitario: number; objetoImpuesto?: string },
  ) => apiClient.post<FacturaDTO>(`/facturas/${id}/conceptos`, data),

  /** Actualizar concepto y recalcular totales. */
  actualizarConcepto: (
    id: string,
    conceptoId: string,
    data: { cantidad?: number; unidad?: string; descripcion?: string; valorUnitario?: number; objetoImpuesto?: string; impuestoTasa?: number | null },
  ) => apiClient.patch<FacturaDTO>(`/facturas/${id}/conceptos/${conceptoId}`, data),

  /** Eliminar concepto y recalcular totales. */
  eliminarConcepto: (id: string, conceptoId: string) =>
    apiClient.delete<FacturaDTO>(`/facturas/${id}/conceptos/${conceptoId}`),

  /** Estadísticas globales para las StatsCards. */
  stats: () => apiClient.get<FacturasStats>('/facturas/stats'),

  /** Descarga un CSV de las facturas (descarga directa del navegador). */
  exportar: async (params?: { search?: string; estado?: string; clienteId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.clienteId) searchParams.set('clienteId', params.clienteId);
    const qs = searchParams.toString();
    // `raw: true` → request() maneja el refresh 401 y devuelve la Response.
    const res = (await request<never>(
      `/facturas/exportar${qs ? `?${qs}` : ''}`,
      { method: 'GET', raw: true },
    )) as unknown as Response;
    if (!res.ok) throw new Error('No se pudo exportar el CSV');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facturas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ────────────────────────────────────────────────────────────
//  GPS / Rastreo de maquinaria
// ────────────────────────────────────────────────────────────

export type EstadoGpsMaquina = 'moving' | 'idle' | 'offline' | 'alert';

export type TipoGeocerca = 'OBRA' | 'PATIO' | 'ESTACION' | 'RUTA' | 'PROHIBIDA';

export interface GeocercaDTO {
  id: string;
  nombre: string;
  tipo: TipoGeocerca;
  color: string;
  centroLat: number;
  centroLng: number;
  radioMetros: number;
  activa: boolean;
  maquinasDentro: number;
  creadoEn: string;
}

export interface GeocercaInput {
  nombre: string;
  tipo: TipoGeocerca;
  color?: string;
  centroLat: number;
  centroLng: number;
  radioMetros: number;
  activa?: boolean;
}

export interface MaquinaGpsDTO {
  id: string;
  maquinaId: string;
  name: string;
  type: string;
  status: EstadoGpsMaquina;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  fuel: number;
  temperature: number;
  hours: number;
  lastUpdate: string;
  ultimaFechaHora: string | null;
  /** true si la última posición la generó la simulación (todavía no hay feed del proveedor). */
  simulada?: boolean;
  operator?: string;
  geocercas: Array<{ nombre: string; color: string }>;
}

export interface HistorialGpsDTO {
  maquinaId: string;
  maquinaNombre: string;
  fecha: string;
  puntos: Array<{ lat: number; lng: number; time: string; speed: number }>;
  eventos: Array<{ time: string; text: string; speed?: number }>;
}

export interface SimulacionGpsDTO {
  maquinasActualizadas: number;
  entradas: Array<{ maquinaId: string; geocerca: string }>;
  salidas: Array<{ maquinaId: string; geocerca: string }>;
  fechaHora: string;
}

export const gpsApi = {
  /** Última posición conocida de cada máquina activa, con estado y geocercas. */
  maquinas: () => apiClient.get<MaquinaGpsDTO[]>('/gps/maquinas'),

  /** Recorrido y eventos de geocerca del día para una máquina. */
  historial: (maquinaId: string, params?: { fecha?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.fecha) searchParams.set('fecha', params.fecha);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<HistorialGpsDTO>(`/gps/maquinas/${maquinaId}/historial${qs ? `?${qs}` : ''}`);
  },

  listarGeocercas: (params?: { search?: string; tipo?: TipoGeocerca; activa?: boolean; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tipo) searchParams.set('tipo', params.tipo);
    if (params?.activa !== undefined) searchParams.set('activa', String(params.activa));
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<GeocercaDTO>>(`/gps/geocercas${qs ? `?${qs}` : ''}`);
  },

  crearGeocerca: (data: GeocercaInput) => apiClient.post<GeocercaDTO>('/gps/geocercas', data),

  actualizarGeocerca: (id: string, data: Partial<GeocercaInput>) =>
    apiClient.patch<GeocercaDTO>(`/gps/geocercas/${id}`, data),

  eliminarGeocerca: (id: string) => apiClient.delete<{ message: string }>(`/gps/geocercas/${id}`),

  /** Genera el siguiente ping de cada máquina y evalúa cruces de geocerca. */
  simular: () => apiClient.post<SimulacionGpsDTO>('/gps/simular', {}),
};
