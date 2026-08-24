import {
  STORAGE_KEYS,
  type ApiResponse,
  type AuthResponse,
  type LoginCredentials,
  type RegisterCredentials,
  type RefreshCredentials,
  type UserAuth,
} from '@svr-erp/shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
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

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken } satisfies RefreshCredentials),
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const result: ApiResponse<AuthResponse['data']> = await response.json();
    if (!result.success) {
      throw new Error('Refresh failed');
    }

    setTokens(result.data.accessToken, result.data.refreshToken);
    return result.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Intenta obtener un access token válido al cargar la app.
 * Si el refresh token existe en localStorage, rota para obtener un access token fresco.
 * Retorna true si se obtuvo un token válido, false si no (sesión expirada).
 */
export async function initializeAuth(): Promise<boolean> {
  // Si ya tenemos un access token en memoria, la sesión está activa
  if (inMemoryAccessToken) return true;

  // Si no hay refresh token, no hay sesión que restaurar
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  // Intentar rotar el refresh token para obtener un access token nuevo
  const newToken = await refreshAccessToken();
  return newToken !== null;
}

async function request<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { skipAuth, headers: customHeaders, ...fetchOptions } = options;
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
    const newToken = await refreshAccessToken();
    isRefreshing = false;

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

    // Refresh falló: limpiar y dejar que el caller maneje
    window.location.href = '/';
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' },
    };
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
  serviciosProximos: number;
  promedioHorasServicio: number;
  equiposEnOptimoEstado: number;
  totalMaquinas: number;
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
//  Incidentes API
// ────────────────────────────────────────────────────────────

export interface IncidenteDTO {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  estado: 'Abierto' | 'En Revisión' | 'Resuelto';
  fecha: string;
  maquinaId: string | null;
  maquina: string | null;
  obraId: string;
  obra: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface IncidenteStats {
  total: number;
  abiertos: number;
  criticos: number;
}

export interface IncidenteCatalogos {
  maquinas: CatalogoItem[];
  obras: CatalogoItem[];
}

export interface IncidenteCreateInput {
  titulo: string;
  descripcion: string;
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  estado: 'ABIERTO' | 'EN_REVISION' | 'RESUELTO';
  fecha: string;
  maquinaId?: string;
  obraId: string;
}

export const incidentesApi = {
  listar: (params?: {
    search?: string;
    prioridad?: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
    estado?: 'ABIERTO' | 'EN_REVISION' | 'RESUELTO';
    maquinaId?: string;
    obraId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.prioridad) searchParams.set('prioridad', params.prioridad);
    if (params?.estado) searchParams.set('estado', params.estado);
    if (params?.maquinaId) searchParams.set('maquinaId', params.maquinaId);
    if (params?.obraId) searchParams.set('obraId', params.obraId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<IncidenteDTO>>(
      `/incidentes${qs ? `?${qs}` : ''}`,
    );
  },

  obtener: (id: string) =>
    apiClient.get<IncidenteDTO>(`/incidentes/${id}`),

  crear: (data: IncidenteCreateInput) =>
    apiClient.post<IncidenteDTO>('/incidentes', data),

  actualizar: (id: string, data: Partial<IncidenteCreateInput>) =>
    apiClient.patch<IncidenteDTO>(`/incidentes/${id}`, data),

  eliminar: (id: string) =>
    apiClient.delete<{ message: string }>(`/incidentes/${id}`),

  resolver: (id: string) =>
    apiClient.patch<IncidenteDTO>(`/incidentes/${id}/resolver`, {}),

  stats: () =>
    apiClient.get<IncidenteStats>('/incidentes/stats'),

  catalogos: () =>
    apiClient.get<IncidenteCatalogos>('/incidentes/catalogos'),
};
