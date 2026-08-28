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
