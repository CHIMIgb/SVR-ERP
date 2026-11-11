"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat, Lock, User, Loader2, AlertCircle, BadgeCheck } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { PinInput } from "@/components/pwa/PinInput";
import { vistaEfectiva } from "@/lib/pwa/dispositivo";

/**
 * Login dual (plan §8.4 — una sola pantalla):
 * móvil → número de empleado + PIN · escritorio → email + password.
 * Tras autenticar enruta a la cara correspondiente y revisa el estado del PIN
 * (temporal/vencido → cambio obligatorio, spec §6.6).
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, loginPin, isAuthenticated, isInitialized, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [numeroEmpleado, setNumeroEmpleado] = useState("");
  const [pin, setPin] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; numero?: string; pin?: string }>({});
  // El modo se decide por el ancho (client-only: evita mismatch de hidratación)
  const [modo, setModo] = useState<"email" | "pin">("email");

  // Detector: < 768px → modo PIN + cara móvil (deferido a rAF: no bloquea
  // hidratación y evita setState síncrono en el effect — regla de lint)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setModo(vistaEfectiva() === "movil" ? "pin" : "email");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Redirigir si ya está autenticado (a la cara que toca)
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(vistaEfectiva() === "movil" ? "/m" : "/dashboard");
    }
  }, [isInitialized, isAuthenticated, router]);

  const destinoTrasLogin = (requiereCambio?: boolean) => {
    if (vistaEfectiva() === "movil") {
      router.replace(requiereCambio ? "/m/pin-cambio" : "/m");
      return;
    }
    router.replace("/dashboard");
  };

  // Validación en el cliente (español); el servidor repite la suya en los DTOs
  const validate = (): { email?: string; password?: string; numero?: string; pin?: string } => {
    if (modo === "pin") {
      const errors: { numero?: string; pin?: string } = {};
      if (numeroEmpleado.trim().length > 8) {
        errors.numero = "Máximo 8 caracteres (ej. TRA-0142)";
      } else if (!/^(ADM|RES|TEC|COB|TRA)-\d{1,6}$/i.test(numeroEmpleado.trim())) {
        errors.numero = "Formato: PREF-NNN (ej. TRA-0142)";
      }
      if (pin.length !== 8) {
        errors.pin = "El PIN tiene 8 caracteres";
      }
      return errors;
    }
    const errors: { email?: string; password?: string } = {};
    const emailTrim = email.trim();
    if (!emailTrim) {
      errors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = "El correo no es válido";
    }
    if (!password) {
      errors.password = "La contraseña es obligatoria";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const errors = validate();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    if (modo === "pin") {
      const result = await loginPin({ numeroEmpleado: numeroEmpleado.trim().toUpperCase(), pin });
      if (result.success) {
        // temporal/vencido → cambio obligatorio antes de navegar (spec §6.6)
        destinoTrasLogin(result.requiereCambio);
      }
      return;
    }

    const result = await login({ email: email.trim(), password });
    if (result.success) {
      destinoTrasLogin();
    }
  };

  // Mientras se valida la sesión existente, mostramos un estado de carga
  if (!isInitialized) {
    return (
      <main className="min-h-screen bg-secondary flex items-center justify-center p-6">
        <LoadingState size="lg" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
               <HardHat className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter leading-none italic">SVR</h1>
              <p className="text-[10px] text-primary-light font-bold tracking-[0.3em] uppercase">Constructora</p>
            </div>
          </div>

          {modo === "email" ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a SVR</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">Ingresa tus credenciales para continuar.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Tu jornada empieza</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">
                Ingresa tu número de empleado y tu PIN.
              </p>
            </>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {modo === "email" ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="tu-correo@ejemplo.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.email}
                      className={fieldErrors.email
                        ? "w-full bg-white/5 border border-red-500/60 rounded-md py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-400 focus:bg-white/10 transition-all disabled:opacity-60"
                        : "w-full bg-white/5 border border-white/10 rounded-md py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all disabled:opacity-60"}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs font-medium text-red-300 ml-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.password}
                      className={fieldErrors.password
                        ? "w-full bg-white/5 border border-red-500/60 rounded-md py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-400 focus:bg-white/10 transition-all disabled:opacity-60"
                        : "w-full bg-white/5 border border-white/10 rounded-md py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all disabled:opacity-60"}
                    />
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs font-medium text-red-300 ml-1">{fieldErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1 active:translate-y-0 mt-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Iniciando sesión…
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Número de empleado
                  </label>
                  <div className="relative group">
                    <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      autoComplete="username"
                      inputMode="text"
                      maxLength={8}
                      placeholder="TRA-0142"
                      value={numeroEmpleado}
                      onChange={(e) => {
                        setNumeroEmpleado(e.target.value.toUpperCase());
                        setFieldErrors((prev) => ({ ...prev, numero: undefined }));
                      }}
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.numero}
                      className={fieldErrors.numero
                        ? "w-full bg-white/5 border border-red-500/60 rounded-md py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-400 focus:bg-white/10 transition-all disabled:opacity-60"
                        : "w-full bg-white/5 border border-white/10 rounded-md py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all disabled:opacity-60"}
                    />
                  </div>
                  {fieldErrors.numero && (
                    <p className="text-xs font-medium text-red-300 ml-1">{fieldErrors.numero}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PIN</p>
                  <PinInput
                    value={pin}
                    onChange={(v) => {
                      setPin(v);
                      setFieldErrors((prev) => ({ ...prev, pin: undefined }));
                    }}
                    disabled={isLoading}
                    error={!!fieldErrors.pin}
                    ariaLabel="PIN de acceso"
                  />
                  {fieldErrors.pin && (
                    <p className="text-xs font-medium text-red-300 ml-1 text-center">{fieldErrors.pin}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all mt-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </>
            )}
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Sistema desarrollado por Arazaka
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
