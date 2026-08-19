import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/layout/Toast";
import { NotificationProvider } from "@/components/layout/NotificationContext";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <NotificationProvider>
        <div className="min-height-screen bg-slate-50 flex">
          <Sidebar />
          <main className="flex-1 ml-72 transition-all duration-300 min-h-screen flex flex-col">
            <Topbar />
            
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </NotificationProvider>
    </ToastProvider>
  );
}


