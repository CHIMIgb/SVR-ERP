"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ToastProvider } from "@/components/layout/Toast";
import { NotificationProvider } from "@/components/layout/NotificationContext";
import Topbar from "@/components/layout/Topbar";
import RouteGuard from "@/components/layout/RouteGuard";
import { vistaEfectiva } from "@/lib/pwa/dispositivo";

/**
 * Shell del escritorio. Detector (plan §7a): si el ancho es de móvil (sin
 * override), manda a la cara PWA — cada layout se defiende a sí mismo.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (vistaEfectiva() === "movil") {
        router.replace("/m");
      }
    });
    return () => cancelAnimationFrame(id);
  }, [router]);

  return (
    <RouteGuard>
      <ToastProvider>
        <NotificationProvider>
          <SidebarProvider>
            <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
              <Sidebar />
              <main className="flex-1 lg:ml-72 min-h-screen flex flex-col overflow-x-hidden">
                <Topbar />
                <div className="h-16 shrink-0" />

                <div className="p-4 md:p-8">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </NotificationProvider>
      </ToastProvider>
    </RouteGuard>
  );
}
