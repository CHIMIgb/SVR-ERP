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
import { authApi, clearTokens, setTokens } from "@/lib/api";

interface AuthState {
  user: UserAuth | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
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
      await logout();
    }
  }, [logout]);

  const clearError = useCallback(() => setError(null), []);

  // Inicialización: recuperar usuario de localStorage y validar token
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      // Refrescar perfil en segundo plano para validar el token
      refreshProfile().catch(() => {
        // logout ya se llama dentro de refreshProfile en caso de error
      });
    }
    setIsInitialized(true);
  }, [refreshProfile]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isInitialized,
      error,
      login,
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
