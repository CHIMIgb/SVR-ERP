"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import type { PinEstadoDTO } from "@/lib/api";
import { vistaEfectiva } from "@/lib/pwa/dispositivo";
import { LoadingState } from "@/components/ui/LoadingState";
import { RoleNav } from "@/components/pwa/RoleNav";

/**
 * Shell mínimo de la PWA (paso 3 — plan §7b completo llega con RoleNav).
 * Guards: sesión (sin user → login) y PIN (temporal/vencido → cambio obligatorio).
 * Si el ancho es de escritorio → manda al dashboard (el usuario puede
 * volver con el interruptor cuando exista nav).
 */
export default function PwaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, logout } = useAuth();
  const [pinEstado, setPinEstado] = useState<PinEstadoDTO | null>(null);

  // guard de sesión + guard de ancho (escritorio → dashboard)
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/");
      return;
    }
    if (isInitialized && isAuthenticated && vistaEfectiva() === "escritorio") {
      router.replace("/dashboard");
    }
  }, [isInitialized, isAuthenticated, router]);

  // guard de PIN: temporal/vencido → cambio obligatorio (spec §6.6-7)
  useEffect(() => {
    if (!isAuthenticated) return;
    authApi
      .pinEstado()
      .then((res) => {
        if (res.success && res.data) {
          setPinEstado(res.data);
          if (res.data.requiereCambio) router.replace("/m/pin-cambio");
        }
      })
      .catch(() => undefined);
  }, [isAuthenticated, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-secondary flex items-center justify-center p-6">
        <LoadingState size="lg" />
      </main>
    );
  }

  const iniciales = (user?.persona?.nombre ?? user?.email ?? "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-secondary text-white flex flex-col">
      {/* Header del shell — avatar + nombre + rol + cerrar sesión */}
      <header className="bg-ui-900/60 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white">
          {iniciales}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate leading-tight">
            {user?.persona?.nombre ?? user?.email}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
            {user?.roles?.[0]?.nombre ?? "Sin rol"}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/");
          }}
          aria-label="Cerrar sesión"
          className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-300 hover:bg-red-500/20 transition-colors shrink-0"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Contenido con safe-areas */}
      <main className="flex-1 px-4 py-5 overflow-y-auto scrollbar-none">{children}</main>

      {/* Nav inferior por rol (plan §7b) + interruptor a escritorio */}
      <RoleNav />

      {/* Aviso a los 25 días (spec §6.6-5): sin mostrar PIN */}
      {pinEstado?.avisar && !pinEstado.vencido && (
        <div className="px-4 pb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-200 flex items-start gap-3">
            <span className="text-lg leading-none">⏳</span>
            <p>
              Tu PIN vence en <strong>{pinEstado.diasRestantes} día(s)</strong>.
              Cámbialo pronto desde esta pantalla cuando esté disponible.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
