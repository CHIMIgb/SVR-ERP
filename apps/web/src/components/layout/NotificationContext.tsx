"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from './Toast';

export interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'alerta' | 'info' | 'correo';
  fecha: string;
  leido: boolean;
  destinatario?: string;
  asunto?: string;
  plantillaHtml?: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notif: Omit<Notification, 'id' | 'fecha' | 'leido'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {}
});

export function useNotifications() {
  return useContext(NotificationContext);
}

const initialNotifications: Notification[] = [
  {
    id: "N1",
    titulo: "Límite de Horómetro Alcanzado",
    mensaje: "La Excavadora CAT 320 (M001) ha superado las 1,240 horas. Requiere mantenimiento preventivo en 5 hrs.",
    tipo: "alerta",
    fecha: "Hace 10 min",
    leido: false
  },
  {
    id: "N2",
    titulo: "Correo: Falla Crítica Reportada",
    mensaje: "Se envió un correo a Ricardo M. (Mecánico) por reporte de fuga en Grúa Liebherr (M003).",
    tipo: "correo",
    fecha: "Hace 1 hr",
    leido: false,
    destinatario: "Ricardo M. <mecanica@svr.com>",
    asunto: "URGENTE: Reporte de Falla Mecánica - M003",
    plantillaHtml: `
      <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #334155;">
        <div style="background-color: #ef4444; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Alerta de Falla Crítica</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; opacity: 0.8;">SVR ERP AUTOMATED DISPATCH</p>
        </div>
        <div style="padding: 24px; line-height: 1.6;">
          <p style="margin-top: 0;">Estimado <strong>Ing. Ricardo Mendoza</strong> (Departamento de Mantenimiento),</p>
          <p>Se ha registrado un reporte de falla mecánica crítica desde el campo que requiere atención urgente.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px;">
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">Activo / Máquina</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">M003 — Grúa Liebherr LTM</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">Operador</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">Roberto Díaz</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">Ubicación</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">Obra Toluca C2</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Descripción Falla</td>
              <td style="padding: 10px; color: #ef4444; font-weight: bold;">Fuga severa de líquido de frenos en el eje delantero.</td>
            </tr>
          </table>

          <p>Por favor, coordina el traslado de refacciones y el equipo mecánico lo antes posible. Puedes contactar al operador al <strong>555-8899</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; text-align: center; color: #94a3b8;">
            Este es un correo automático generado por SVR Constructora ERP. Por favor, no respondas a este mensaje.
          </p>
        </div>
      </div>
    `
  },
  {
    id: "N3",
    titulo: "Nueva Maquinaria Despachada",
    mensaje: "El Kenworth Volteo (M004) ha sido despachado exitosamente a la obra Fraccionamiento Valle Sur.",
    tipo: "info",
    fecha: "Hace 3 hrs",
    leido: true
  }
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'fecha' | 'leido'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `N${Date.now()}`,
      fecha: "Hace un momento",
      leido: false
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Send toast overlay too!
    const toastType = notif.tipo === 'alerta' ? 'error' : notif.tipo === 'correo' ? 'info' : 'success';
    const toastPrefix = notif.tipo === 'correo' ? '✉️ Correo: ' : notif.tipo === 'alerta' ? '⚠️ Alerta: ' : '📢 ';
    showToast(`${toastPrefix}${notif.titulo} - ${notif.mensaje.substring(0, 50)}...`, toastType);
  }, [showToast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.leido).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
