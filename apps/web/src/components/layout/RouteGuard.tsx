"use client";

import { useEffect, useMemo, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RouteGuard({ children, fallback }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized } = useAuth();

  const allowedRoutes = useMemo(
    () =>
      (user?.vistas || [])
        .filter((v) => v.puedeVer)
        .map((v) => v.ruta)
        .sort((a, b) => b.length - a.length), // rutas más específicas primero
    [user],
  );

  const isAllowed = useMemo(() => {
    if (!isInitialized || !isAuthenticated) return true; // lo maneja el auth guard
    if (!pathname) return true;

    // Siempre permitir el dashboard como fallback seguro
    if (pathname === "/dashboard") return true;

    return allowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  }, [isInitialized, isAuthenticated, pathname, allowedRoutes]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (!isAllowed && pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  }, [isInitialized, isAuthenticated, isAllowed, pathname, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      fallback || (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-black text-slate-900 mb-2">
              Acceso restringido
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              No tienes permiso para acceder a esta vista. Redirigiendo al
              dashboard…
            </p>
            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
