export interface PersonaAuth {
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno?: string | null;
}

export interface RolAuth {
  id: string;
  nombre: string;
  nivel: number;
  esPrincipal: boolean;
}

export interface VistaAuth {
  id: string;
  nombre: string;
  ruta: string;
  icono?: string | null;
  orden: number;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeExportar: boolean;
}

export interface PermisoAuth {
  modulo: string;
  recurso: string;
  accion: string;
}

export interface UserAuth {
  id: string;
  email: string;
  activo: boolean;
  persona: PersonaAuth;
  roles: RolAuth[];
  vistas: VistaAuth[];
  permisos: PermisoAuth[];
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: UserAuth;
    session: {
      id: string;
      iniciadaEn: string;
      expiraEn: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
}

export interface RefreshCredentials {
  refreshToken: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const STORAGE_KEYS = {
  /** Access token: se almacena EN MEMORIA (api.ts), NO en localStorage */
  ACCESS_TOKEN: 'svr_access_token',
  /** Refresh token: persiste en localStorage para compatibilidad con Capacitor */
  REFRESH_TOKEN: 'svr_refresh_token',
  /** Datos del usuario serializados */
  USER: 'svr_user',
} as const;
