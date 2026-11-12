"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import { PinInput } from "@/components/pwa/PinInput";
import { useAuth } from "@/hooks/useAuth";
import { authApi, getRefreshToken, setTokens } from "@/lib/api";
import { mensajeErrorApi } from "@/lib/api";

/**
 * Cambio de PIN obligatorio (spec §6.6-3/6-6/6-7): lo exige el layout cuando
 * el PIN es temporal o venció. Pide el actual, y el nuevo dos veces.
 */
export default function PinCambioPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [pinActual, setPinActual] = useState("");
  const [pinNuevo, setPinNuevo] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pinActual.length !== 8 || pinNuevo.length !== 8 || pinConfirm.length !== 8) {
      setError("Los tres PINs deben tener 8 caracteres");
      return;
    }
    if (pinNuevo !== pinConfirm) {
      setError("El nuevo PIN y su confirmación no coinciden");
      return;
    }
    setGuardando(true);
    try {
      const res = await authApi.pinCambio({ pinActual, pinNuevo });
      if (res.success) {
        // Repone el access: el token vivo aún cargaba el claim rpc (PR #18 #4) —
        // sin esto, todo daría 403 hasta que expirara (15 min). El refresh
        // recalcula el claim desde la BD (cambio hecho → claim fuera).
        try {
          const rt = getRefreshToken();
          if (rt) {
            const rr = await authApi.refresh({ refreshToken: rt });
            if (rr.success && rr.data) {
              setTokens(rr.data.accessToken, rr.data.refreshToken);
            } else {
              await logout();
            }
          }
        } catch {
          // Sin red: el claim muere junto con el access (≤15 min)
        }
        // sesión limpia: vuelve a entrar con su PIN nuevo (spec: se cierran
        // las otras sesiones; la actual queda)
        router.replace("/m");
        return;
      }
      setError(mensajeErrorApi(res.error, "No se pudo cambiar el PIN"));
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="max-w-sm mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black leading-tight">Cambia tu PIN</h1>
          <p className="text-xs text-slate-400">
            8 caracteres con al menos 1 letra y 1 número, sin repetidos ni secuencias
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            PIN actual
          </p>
          <PinInput value={pinActual} onChange={setPinActual} ariaLabel="PIN actual" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Nuevo PIN
          </p>
          <PinInput value={pinNuevo} onChange={setPinNuevo} ariaLabel="PIN nuevo" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Confirmar nuevo PIN
          </p>
          <PinInput value={pinConfirm} onChange={setPinConfirm} ariaLabel="Confirmar PIN nuevo" />
        </div>

        <button
          type="submit"
          disabled={guardando || !pinActual || !pinNuevo || !pinConfirm}
          className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all"
        >
          {guardando ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Guardar PIN
        </button>

        <button
          type="button"
          onClick={() => logout()}
          className="text-xs text-slate-500 font-bold uppercase tracking-widest underline underline-offset-4"
        >
          Cerrar sesión
        </button>
      </form>
    </section>
  );
}
