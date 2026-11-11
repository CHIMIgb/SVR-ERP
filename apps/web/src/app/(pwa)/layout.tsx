"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authApi, type PinEstadoDTO } from "@/lib/api";
import { vistaEfectiva } from "@/lib/pwa/dispositivo";
import { RoleNav } from "@/components/pwa/RoleNav";
import ModalInstalar from "@/components/pwa/ModalInstalar";
import { iniciarSincronizador } from "@/lib/pwa/sincronizador";
import { useCola } from "@/lib/pwa/useCola";
import { navDelRol } from "@/lib/pwa/rol-nav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * Shell de la PWA — 100% theme-aware con los tokens del escritorio
 * (bg-canvas/bg-surface/text-ui-* se invierten solos entre claro y oscuro).
 * Guards: sesión, dispositivo (escritorio → dashboard), PIN y vista (RBAC).
 * Tema: si el usuario nunca eligió, la PWA sigue el modo del TELÉFONO
 * ('system') — el escritorio conserva su default claro.
 */
export default function PwaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized, logout } = useAuth();
  const pendientes = useCola();
  const [pinEstado, setPinEstado] = useState<PinEstadoDTO | null>(null);
  const [cerrarModal, setCerrarModal] = useState(false);
  const [instalada, setInstalada] = useState(false);

  // Instalable + sincronización (§7c): SW en /sw.js + disparadores de la cola
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const parar = iniciarSincronizador();
    const revisar = () =>
      setInstalada(
        window.matchMedia("(display-mode: standalone)").matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    revisar();
    window.addEventListener("appinstalled", revisar);
    return () => {
      parar();
      window.removeEventListener("appinstalled", revisar);
    };
  }, []);

  // guard de sesión + guard de dispositivo (escritorio → dashboard)
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
      <main className="min-h-screen bg-canvas flex items-center justify-center p-6">
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
    <div className="min-h-screen bg-canvas text-ui-900 flex flex-col">
      {/* Header del shell — mismo look que el Topbar del escritorio */}
      <header className="bg-surface border-b border-ui-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white">
          {iniciales}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate leading-tight text-ui-900">
            {user?.persona?.nombre ?? user?.email}
          </p>
          <p className="text-[10px] text-ui-500 font-bold uppercase tracking-widest truncate">
            {user?.roles?.[0]?.nombre ?? "Sin rol"}
          </p>
        </div>
        <div className="shrink-0 text-ui-600">
          <ThemeToggle />
        </div>
        <button
          type="button"
          aria-label="Notificaciones"
          className="w-9 h-9 rounded-xl bg-ui-100 border border-ui-200 flex items-center justify-center text-ui-600 hover:bg-ui-200/60 transition-colors shrink-0 relative"
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/");
          }}
          aria-label="Cerrar sesión"
          className="w-9 h-9 rounded-xl bg-error/10 border border-error/30 flex items-center justify-center text-error hover:bg-error/20 transition-colors shrink-0"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Contenido con safe-areas */}
      <main className="flex-1 px-4 py-5 overflow-y-auto scrollbar-none">{children}</main>

      {/* Nav inferior por rol (plan §7b) */}
      <RoleNav pendientes={pendientes} />

      {/* Instalación: modal automático si no está instalada (cada acceso) */}
      {!instalada && !cerrarModal && (
        <ModalInstalar
          onCancelar={() => {
            try { sessionStorage.setItem("svr-instalar-oculto", "1"); } catch { /* noop */ }
            setCerrarModal(true);
          }}
          origen={typeof window === "undefined" ? undefined : window.location.origin}
        />
      )}

      {/* Aviso a los 25 días (spec §6.6-5): sin mostrar PIN */}
      {pinEstado?.avisar && !pinEstado.vencido && (
        <div className="px-4 pb-6">
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-sm text-ui-900 flex items-start gap-3">
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
