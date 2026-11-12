export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  jti: string;       // unique token ID (UUID)
  tipo: 'access' | 'refresh';
  sessionId?: string; // session UUID (solo en access tokens)
  /** Requiere cambio de PIN (temporal/vencido) — solo en access de sesiones PWA (PR #18 #4). */
  rpc?: boolean;
  iat?: number;      // "Issued at" (epoch segundos) — lo agrega jsonwebtoken al firmar
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    activo: boolean;
    /** Área (torre) asignada — para "misma área" en /reportes. */
    torre?: import('@prisma/client').CategoriaReporte | null;
    /** Número de empleado (users.numero_empleado) — vista de perfil PWA. */
    numeroEmpleado?: string | null;
    /** Jefe directo, si el usuario tiene uno asignado. */
    jefe?: {
      nombre: string;
      email: string;
      telefono?: string | null;
    } | null;
    persona: {
      nombre: string;
      apellidoPaterno: string | null;
      apellidoMaterno: string | null;
      correo: string | null;
      telefono?: string | null;
    };
    roles: {
      id: string;
      nombre: string;
      nivel: number;
      esPrincipal: boolean;
    }[];
    vistas: {
      id: string;
      nombre: string;
      ruta: string;
      icono: string | null;
      orden: number;
      puedeVer: boolean;
      puedeCrear: boolean;
      puedeEditar: boolean;
      puedeEliminar: boolean;
      puedeExportar: boolean;
    }[];
    permisos: {
      modulo: string;
      recurso: string;
      accion: string;
    }[];
  };
  session: {
    id: string;
    iniciadaEn: string;
    expiraEn: string;
  };
}

export interface TokenBlacklistEntry {
  jti: string;
  tokenHash: string;
  tipo: string;
  userId?: string;
  razon: string;
  expiraEn: Date;
}
