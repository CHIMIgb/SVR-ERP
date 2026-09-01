import {
  STORAGE_KEYS,
  type ApiResponse,
  type AuthResponse,
  type LoginCredentials,
  type RegisterCredentials,
  type RefreshCredentials,
  type UserAuth,
} from '@svr-erp/shared';

import type { POSSale, Product, CartItem, TaxBreakdown } from '@/lib/pos';

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
  reporteDescripcion: string | null;
  reportadoEn: string | null;
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

export interface IncidenteReportarInput {
  descripcion: string;
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

  reportar: (id: string, data: IncidenteReportarInput) =>
    apiClient.patch<IncidenteDTO>(`/incidentes/${id}/reportar`, data),

  stats: () =>
    apiClient.get<IncidenteStats>('/incidentes/stats'),

  catalogos: () =>
    apiClient.get<IncidenteCatalogos>('/incidentes/catalogos'),
};

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

export type TipoReporte = 'Mecanico' | 'Operador' | 'Pipero' | 'Checador' | 'Incidente' | 'Ingeniero' | 'Trabajador';
export type EstadoReporte = 'Pendiente' | 'Visto' | 'Atendido' | 'En Revisión' | 'Resuelto';
export type PrioridadReporte = 'Baja' | 'Media' | 'Alta' | 'Crítica';

/** Valores de enum que acepta la API en query/body (mayúsculas). */
export type TipoReporteApi = 'MECANICO' | 'OPERADOR' | 'PIPERO' | 'CHECADOR' | 'INCIDENTE' | 'INGENIERO' | 'TRABAJADOR';
export type EstadoReporteApi = 'PENDIENTE' | 'VISTO' | 'ATENDIDO' | 'EN_REVISION' | 'RESUELTO';
export type PrioridadReporteApi = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface ReporteCampoDTO {
  id: string;
  codigo: string | null;
  tipo: TipoReporte;
  usuario: string;
  usuarioId: string | null;
  maquinaId: string | null;
  maquinaCodigo: string | null;
  maquinaNombre: string | null;
  obraId: string | null;
  obra: string;
  fecha: string;
  hora: string;
  descripcion: string;
  estado: EstadoReporte;
  prioridad: PrioridadReporte | null;
  detalles: Record<string, unknown> | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ReportesCampoStats {
  pendientes: number;
  enRevision: number;
  atendidos: number;
  resueltos: number;
  criticosActivos: number;
}

export interface ReporteCampoCreateInput {
  tipo: TipoReporteApi;
  usuario: string;
  maquinaId?: string;
  obraId?: string;
  obraTexto: string;
  fecha: string;
  hora: string;
  descripcion: string;
  prioridad?: PrioridadReporteApi;
}

export const reportesCampoApi = {
  listar: (params?: {
    search?: string;
    estado?: EstadoReporteApi;
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

  obtener: (id: string) =>
    apiClient.get<ReporteCampoDTO>(`/reportes-campo/${id}`),

  crear: (data: ReporteCampoCreateInput) =>
    apiClient.post<ReporteCampoDTO>('/reportes-campo', data),

  actualizar: (id: string, data: Partial<ReporteCampoCreateInput>) =>
    apiClient.patch<ReporteCampoDTO>(`/reportes-campo/${id}`, data),

  cambiarEstado: (id: string, estado: EstadoReporteApi) =>
    apiClient.patch<ReporteCampoDTO>(`/reportes-campo/${id}/estado`, { estado }),

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
  proyecto?: string;
  maquinaId?: string;
  fechaContratacion?: string;
  vacacionesDias?: number;
  licencia?: LicenciaDTO;
  contactoEmergencia?: ContactoEmergenciaDTO;
}

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
}

export interface MaquinaCatalogoDTO {
  id: string;
  nombre: string;
}

export const catalogosApi = {
  proyectos: () => apiClient.get<ProyectoCatalogoDTO[]>('/catalogos/proyectos'),
  maquinas: () => apiClient.get<MaquinaCatalogoDTO[]>('/maquinas'),
};

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

  crear: (data: TrabajadorCreateInput) => apiClient.post<TrabajadorDTO>('/trabajadores', data),

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
};

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
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'No Presentado' | 'Salida Anticipada';
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
  estado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado' | 'Salida Anticipada' | 'Descanso';
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
  totalHorasOrdinarias: number;
  totalHorasExtra: number;
}

export interface MarcarEntradaInput {
  trabajadorId: string;
  obraId: string;
  obraLat: number;
  obraLng: number;
  radioPermitidoMetros?: number;
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
  obraLat: number;
  obraLng: number;
  radioPermitidoMetros?: number;
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
    apiClient.post<{ items: NominaRowDTO[]; totalHorasExtraSincronizadas: number; totalFaltasAplicadas: number }>(
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
    return apiClient.get<{ items: CierreVentaDTO[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/ventas/cierres${qs ? `?${qs}` : ''}`);
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

export const clientesApi = {
  /** Listar clientes con búsqueda y paginación */
  listar: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiClient.get<PaginatedResponse<ClienteDTO>>(
      `/clientes${qs ? `?${qs}` : ''}`,
    );
  },

  /** Obtener un cliente por ID */
  obtener: (id: string) => apiClient.get<ClienteDTO>(`/clientes/${id}`),

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
};
