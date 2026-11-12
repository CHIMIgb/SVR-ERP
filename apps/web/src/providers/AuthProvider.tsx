"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  STORAGE_KEYS,
  type LoginCredentials,
  type RegisterCredentials,
  type UserAuth,
  type ApiResponse,
  type AuthResponse,
} from "@svr-erp/shared";
import { authApi, clearTokens, setTokens, initializeAuth, getAccessToken, type PinEstadoDTO } from "@/lib/api";
import { limpiarCola } from "@/lib/pwa/offline";

interface AuthState {
  user: UserAuth | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  /** Login móvil: número de empleado + PIN (plan §8.2). */
  loginPin: (credentials: { numeroEmpleado: string; pin: string }) => Promise<{ success: boolean; message?: string; requiereCambio?: boolean }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUser(): UserAuth | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserAuth;
  } catch {
    return null;
  }
}

function storeUser(user: UserAuth | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const handleAuthResponse = useCallback(
    (response: ApiResponse<AuthResponse["data"]>): boolean => {
      if (!response.success) {
        setError(response.error.message || "Error de autenticación");
        return false;
      }

      const { accessToken, refreshToken, user: authUser } = response.data;
      setTokens(accessToken, refreshToken);
      storeUser(authUser);
      setUser(authUser);
      setError(null);
      return true;
    },
    [],
  );

  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.login(credentials);
        const success = handleAuthResponse(response);

        if (!success) {
          // Si el servidor devolvio errores de validacion (message = 'Error de
          // validacion'), mostrar los detalles reales, no genericos.
          const detalles = response.success ? undefined : response.error.details;
          if (Array.isArray(detalles) && detalles.length) {
            const message = detalles.map(String).join(' ');
            setError(message);
            return { success: false, message };
          }

          const backendMessage = response.success
            ? undefined
            : response.error.message;

          // Normalizar errores de autenticacion para no mostrar 500 o mensajes tecnicos
          const message =
            backendMessage && /bloquead/i.test(backendMessage)
              ? backendMessage
              : 'Credenciales incorrectas';

          setError(message);
          return { success: false, message };
        }

        return { success: true };
      } catch (err) {
        const backendMessage =
          err instanceof Error ? err.message : 'Error desconocido';

        // Si es un error de red, mostrar mensaje de conexion
        const message = /no se pudo conectar|failed to fetch|network/i.test(
          backendMessage,
        )
          ? backendMessage
          : 'Credenciales incorrectas';

        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthResponse],
  );

  const loginPin = useCallback(
    async (credentials: { numeroEmpleado: string; pin: string }): Promise<{ success: boolean; message?: string; requiereCambio?: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.loginPin(credentials);
        const success = handleAuthResponse(response);

        if (!success) {
          const detalles = response.success ? undefined : response.error.details;
          if (Array.isArray(detalles) && detalles.length) {
            const message = detalles.map(String).join(' ');
            setError(message);
            return { success: false, message };
          }
          const backendMessage = response.success ? undefined : response.error.message;
          const message = backendMessage || 'Credenciales incorrectas';
          setError(message);
          return { success: false, message };
        }

        // el estado del PIN llega en la respuesta (temporal/vencido → obligar cambio)
        const pinEstado = ((response as unknown as { data: { pinEstado: PinEstadoDTO } }).data.pinEstado);
        return { success: true, requiereCambio: pinEstado?.requiereCambio };
      } catch {
        setError("No se pudo conectar con el servidor. Verifica tu conexión.");
        return { success: false, message: 'No se pudo conectar con el servidor' };
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthResponse],
  );

  const register = useCallback(
    async (
      credentials: RegisterCredentials,
    ): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.register(credentials);
        const success = handleAuthResponse(response);

        if (!success) {
          return {
            success: false,
            message: response.success ? undefined : response.error.message,
          };
        }

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo conectar con el servidor";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthResponse],
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignorar errores de red en logout — limpiamos sesión de todos modos
    } finally {
      clearTokens();
      setUser(null);
      setError(null);
      setIsLoading(false);
      // Cola offline (PR #18, mediano): lo pendiente del trabajador NO viaja
      // con el token del siguiente en un teléfono compartido. Nunca rompe el logout.
      limpiarCola().catch(() => {});
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await authApi.profile();
      if (response.success) {
        storeUser(response.data);
        setUser(response.data);
      } else {
        await logout();
      }
    } catch {
      // Error de red: NO cerrar sesión — solo si el refresh ya limpió
      // los tokens (revocación/expiración) la sesión está muerta
      if (!getAccessToken()) await logout();
    }
  }, [logout]);

  const clearError = useCallback(() => setError(null), []);

  // Inicialización: restaurar sesión desde el refresh token en localStorage.
  // El setState va dentro de .then (asíncrono) — la regla de React prohíbe
  // setState síncrono en el cuerpo del effect (cascading renders).
  useEffect(() => {
    const storedUser = getStoredUser();

    initializeAuth()
      .then((estado) => {
        if (estado === 'invalid') {
          // Refresh token expirado o revocado: cerrar sesión
          clearTokens();
          setUser(null);
          return;
        }
        if (storedUser) {
          setUser(storedUser);
          if (estado === 'ok') {
            // Token restaurado: refrescar perfil en segundo plano para validar
            refreshProfile().catch(() => {});
          }
          // 'red' (sin conexión): conservar tokens y usuario cacheado — la app
          // abre igual; al volver la señal, el interceptor refresca en el 401
        }
      })
      .finally(() => {
        setIsInitialized(true);
      });
  }, [refreshProfile]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isInitialized,
      error,
      login,
      loginPin,
      register,
      logout,
      refreshProfile,
      clearError,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      isInitialized,
      error,
      login,
      loginPin,
      register,
      logout,
      refreshProfile,
      clearError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
