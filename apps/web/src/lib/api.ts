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

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
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

export { setTokens, clearTokens, getAccessToken, getRefreshToken };

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
