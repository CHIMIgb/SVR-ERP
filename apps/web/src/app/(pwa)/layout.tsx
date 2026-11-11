"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authApi, type PinEstadoDTO } from "@/lib/api";
import { vistaEfectiva } from "@/lib/pwa/dispositivo";
import { RoleNav } from "@/components/pwa/RoleNav";
import ModalInstalar from "@/components/pwa/ModalInstalar";
import { estaInstaladaEnDispositivo } from "@/lib/pwa/instalar";
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
  // true de inicio para no dar destello del modal a quien YA la tiene instalada
  const [instalada, setInstalada] = useState(true);

  // Barras del sistema (status/nav de Android) siguen el tema activo:
  // Chrome las repinta con el <meta name="theme-color"> dinámico
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const aplicar = () =>
      meta.setAttribute(
        "content",
        document.documentElement.classList.contains("dark") ? "#0f172a" : "#f8fafc",
      );
    aplicar();
    const obs = new MutationObserver(aplicar);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Modal de instalación en cada acceso (petición del cliente) — se oculta
  // si la app está instalada EN EL DISPOSITIVO (la pestaña de Chrome no es
  // standalone aunque ya esté instalada) o al instalarse (appinstalled)
  useEffect(() => {
    let vivo = true;
    estaInstaladaEnDispositivo().then((si) => {
      if (vivo) setInstalada(si);
    });
    const yaSeInstalo = () => setInstalada(true);
    window.addEventListener("appinstalled", yaSeInstalo);
    return () => {
      vivo = false;
      window.removeEventListener("appinstalled", yaSeInstalo);
    };
  }, []);

  // Instalable + sincronización (§7c): SW en /sw.js + disparadores de la cola.
  // En DEV no se registra y además se desregistran SWs existentes + se
  // borran sus cachés: el SW persiste aunque quitemos el registro y su
  // cache-first sobre los chunks de Turbopack sirve JS viejo → errores de
  // hidratación (HTML nuevo vs JS viejo) y hot-reload roto.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const parar = iniciarSincronizador();
    return () => {
      parar();
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

  // Captura del evento de instalación: vive en el LAYOUT RAÍZ (server, head)
  // porque se dispara UNA vez por carga y el usuario puede aterrizar primero
  // en el login; aquí en el cliente React no ejecuta los <script> que
  // renderiza (warning de React 19) y por navegación interna se perdería.

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
      <header className="bg-surface border-b border-ui-200 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-3 sticky top-0 z-30">
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

      {/* Instalación: modal propio en cada acceso si no está instalada */}
      {!instalada && <ModalInstalar onCerrar={() => setInstalada(true)} />}
    </div>
  );
}
