"use client";

import { useRouter } from "next/navigation";
import { LogOut, Mail, BadgeCheck, Layers } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/layout/ThemeToggle";

/**
 * Mi perfil (petición del cliente 2026-11-11): accesible desde el HEADER
 * (avatar + nombre + rol), no del nav inferior — existe para TODOS los
 * roles (el guard del shell la exenta junto a /m/pin-cambio).
 * Muestra la info del empleado, el selector de tema y cerrar sesión.
 */
export default function PerfilMovilPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const nombreCompleto = [
    user?.persona?.nombre,
    user?.persona?.apellidoPaterno,
    user?.persona?.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ");

  const iniciales = (nombreCompleto || user?.email || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const cerrarSesion = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <section className="min-h-full max-w-sm mx-auto flex flex-col gap-5">
      {/* Encabezado con la identidad */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shrink-0 text-xl font-black text-white">
          {iniciales}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-ui-900 truncate">
            {nombreCompleto || user?.email}
          </h1>
          <p className="text-xs text-ui-500 font-bold uppercase tracking-widest truncate">
            {user?.roles?.[0]?.nombre ?? "Sin rol"}
          </p>
        </div>
      </div>

      {/* Información del empleado */}
      <div className="bg-surface border border-ui-200 rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-ui-500">
          Información del empleado
        </h2>

        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-ui-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ui-500">Correo</p>
            <p className="text-sm font-semibold text-ui-900 break-all">{user?.email}</p>
          </div>
        </div>

        {user?.torre && (
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-ui-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ui-500">Área</p>
              <p className="text-sm font-semibold text-ui-900">{user.torre}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <BadgeCheck className="w-5 h-5 text-ui-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ui-500">Roles</p>
            <p className="text-sm font-semibold text-ui-900">
              {user?.roles?.map((r) => r.nombre).join(", ") || "Sin rol"}
            </p>
          </div>
        </div>
      </div>

      {/* Tema claro / oscuro — el mismo toggle del header del escritorio */}
      <div className="bg-surface border border-ui-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-ui-900">Tema</p>
          <p className="text-xs text-ui-500 font-medium">
            Claro, oscuro o el del teléfono
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Cerrar sesión — siempre pegado abajo (mt-auto dentro de min-h-full) */}
      <button
        type="button"
        onClick={cerrarSesion}
        className="mt-auto w-full min-h-[44px] rounded-2xl bg-error/10 border border-error/30 text-error font-black text-sm flex items-center justify-center gap-2 hover:bg-error/20 active:bg-error/25 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Cerrar sesión
      </button>
    </section>
  );
}
