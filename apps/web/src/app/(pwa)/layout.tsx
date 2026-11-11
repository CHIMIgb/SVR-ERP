"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { authApi } from "@/lib/api";
import { vistaEfectiva } from "@/lib/pwa/dispositivo";
import { CLAVE_TEMA } from "@/lib/tema";
import { RoleNav } from "@/components/pwa/RoleNav";
import { iniciarSincronizador } from "@/lib/pwa/sincronizador";
import { useCola } from "@/lib/pwa/useCola";
import { navDelRol } from "@/lib/pwa/rol-nav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * Shell mínimo de la PWA (paso 3 — plan §7b completo llega con RoleNav).
 * Guards: sesión (sin user → login) y PIN (temporal/vencido → cambio obligatorio).
 * Si el ancho es de escritorio → manda al dashboard (el usuario puede
 * volver con el interruptor cuando exista nav).
 * Tema: si el usuario nunca eligió, la PWA sigue el modo del TELÉFONO
 * ('system') — el escritorio conserva su default claro (decisión 2026-11-11).
 */
export default function PwaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized, setPreferencia } = useThemeYAuth();
  const pendientes = useCola();

  // Instalable + sincronización (§7c): SW en /sw.js + disparadores de la cola
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const parar = iniciarSincronizador();
    return parar;
  }, []);

  // Tema de la PWA: primera vez en el móvil → seguir al teléfono ('system')
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    let guardada: string | null = null;
    try { guardada = localStorage.getItem(CLAVE_TEMA); } catch { /* modo privado */ }
    if (!guardada) setPreferencia("system");
  }, [isInitialized, isAuthenticated, setPreferencia]);

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
          if (res.data.requiereCambio) router.replace("/m/pin-cambio");
        }
      })
      .catch(() => undefined);
  }, [isAuthenticated, router]);

  // guard de VISTA (RBAC): una ruta /m/* fuera de las vistas del usuario
  // (URL directa) vuelve al inicio — pin-cambio siempre permitido (es parte
  // del ciclo de identidad, no una vista)
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !pathname) return;
    if (pathname === "/m/pin-cambio") return;
    const autorizadas = navDelRol(user).map((p) => p.ruta);
    if (!autorizadas.includes(pathname)) {
      router.replace("/m");
    }
  }, [isInitialized, isAuthenticated, pathname, user, router]);

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
      {/* Header del shell — avatar + nombre + rol + tema + notificaciones */}
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
        {/* Tema: default = el modo del teléfono ('system'), tocable */}
        <div className="shrink-0 [&>button]:w-9 [&>button]:h-9 [&>button]:bg-white/5 [&>button]:border [&>button]:border-white/10 [&>button]:text-slate-300 [&>button:hover]:bg-white/10">
          <ThemeToggle />
        </div>
        {/* Notificaciones (fase F1) — el cierre de sesión va en Módulos */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors shrink-0 relative"
        >
          <Bell className="w-5 h-5" />
        </button>
      </header>

      {/* Contenido con safe-areas */}
      <main className="flex-1 px-4 py-5 overflow-y-auto scrollbar-none">{children}</main>

      {/* Nav inferior por rol (plan §7b) */}
      <RoleNav pendientes={pendientes} />
    </div>
  );
}

/** Atajo: useTheme + useAuth juntos (solo para los guards de este layout). */
function useThemeYAuth() {
  const tema = useTheme();
  const auth = useAuth();
  return { ...auth, setPreferencia: tema.setPreferencia };
}

