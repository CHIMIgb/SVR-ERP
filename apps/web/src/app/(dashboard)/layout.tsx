"use client";

import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ToastProvider } from "@/components/layout/Toast";
import { NotificationProvider } from "@/components/layout/NotificationContext";
import Topbar from "@/components/layout/Topbar";
import RouteGuard from "@/components/layout/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
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
    </RouteGuard>
  );
}
