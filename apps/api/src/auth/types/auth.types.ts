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
    persona: {
      nombre: string;
      apellido_paterno: string | null;
      apellido_materno: string | null;
      correo: string | null;
    };
  };
  session: {
    id: string;
    iniciadaEn: Date;
    expiraEn: Date;
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
