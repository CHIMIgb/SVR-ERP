"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { useAuth } from '@/hooks/useAuth';
import { notificacionesApi, mensajeErrorApi } from '@/lib/api';

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

/** Fecha corta para la lista del Topbar (el backend manda ISO). */
function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aNotificacion(n: any): Notification {
  return {
    id: n.id,
    titulo: n.titulo,
    mensaje: n.cuerpo,
    tipo: n.tipo === 'ALERTA' ? 'alerta' : 'info',
    fecha: fechaCorta(n.creadoEn),
    leido: n.leida,
  };
}

const INTERVALO_MS = 60_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const precargado = useRef(false);

  const cargar = useCallback(async () => {
    try {
      const res = await notificacionesApi.listar({ limit: 50 });
      if (res.success && res.data) {
        setNotifications(res.data.items.map(aNotificacion));
        setUnreadCount(res.data.noLeidas);
      }
    } catch {
      // Sin conexión: el centro queda vacío, sin toasts de ruido.
    }
  }, []);

  useEffect(() => {
    if (!user || precargado.current) return;
    precargado.current = true;
    cargar();
    // Polling simple (sin websockets) cada 60s.
    const intervalo = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [user, cargar]);

  /**
   * Overlay local para avisos generados EN el navegador (vistas que todavía
   * lo usan). No persiste: las notificaciones reales las emite el backend.
   */
  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'fecha' | 'leido'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `local-${Date.now()}`,
      fecha: fechaCorta(new Date().toISOString()),
      leido: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(c => c + 1);

    // Send toast overlay too!
    const toastType = notif.tipo === 'alerta' ? 'error' : notif.tipo === 'correo' ? 'info' : 'success';
    const toastPrefix = notif.tipo === 'correo' ? '✉️ Correo: ' : notif.tipo === 'alerta' ? '⚠️ Alerta: ' : '📢 ';
    showToast(`${toastPrefix}${notif.titulo} - ${notif.mensaje.substring(0, 50)}...`, toastType);
  }, [showToast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, leido: true } : n)));
    setUnreadCount(c => Math.max(0, c - 1));
    notificacionesApi.marcarLeida(id).then((res) => {
      if (!res.success) showToast(mensajeErrorApi(res.error, 'No se pudo marcar la notificación.'), 'error');
    });
  }, [showToast]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    setUnreadCount(0);
    notificacionesApi.marcarTodas().then((res) => {
      if (!res.success) showToast(mensajeErrorApi(res.error, 'No se pudieron marcar las notificaciones.'), 'error');
    });
  }, [showToast]);

  /** Basura del centro: descarta en la API — desaparecen y no vuelven
   * (quedan en BD con `descartada = true`). */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    notificacionesApi.descartarTodas().then((res) => {
      if (!res.success) showToast(mensajeErrorApi(res.error, 'No se pudieron descartar las notificaciones.'), 'error');
    });
  }, [showToast]);

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
