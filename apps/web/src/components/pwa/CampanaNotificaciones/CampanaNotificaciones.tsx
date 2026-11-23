'use client';

/**
 * Campana del header PWA: badge con el número de no leídas + abre el centro
 * (`NotificacionesModal`). Vive DEBAJO de `NotificationProvider` (montado en
 * el shell) — el provider compartido hace el polling y las acciones.
 */
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/components/layout/NotificationContext';
import { NotificacionesModal } from '@/components/pwa/NotificacionesModal';
import { campanaClasses as c } from './CampanaNotificaciones.styles';

export function CampanaNotificaciones() {
  const [abierto, setAbierto] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Notificaciones"
        className={c.boton}
      >
        <Bell className="w-5 h-5" aria-hidden />
        {unreadCount > 0 && (
          <span className={c.badge} aria-label={`${unreadCount} sin leer`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <NotificacionesModal abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
