export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  jti: string;       // unique token ID (UUID)
  tipo: 'access' | 'refresh';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    activo: boolean;
    persona: {
      nombre: string;
      apellidoPaterno: string | null;
      apellidoMaterno: string | null;
      correo: string | null;
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
