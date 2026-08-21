"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ToastProvider } from "@/components/layout/Toast";
import { NotificationProvider } from "@/components/layout/NotificationContext";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <NotificationProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 md:ml-72 min-h-screen flex flex-col overflow-x-hidden">
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
  );
}
