'use client';

/**
 * Centro de notificaciones del teléfono — REUTILIZA el provider compartido
 * (`NotificationProvider`: polling de 60 s, marcar leída / todas / descartar;
 * cero lógica nueva). Diseño paritario con el «Centro de Alertas» del
 * escritorio (Topbar): acciones de ícono en el encabezado y estado vacío con
 * campana. Tap en un item lo marca leído; la navegación al reporte
 * referenciado queda como mejora (el provider compartido aún no expone
 * `referenciaTipo`/`referenciaId`).
 */
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { activarPush, estadoPush, type EstadoPush } from '@/lib/pwa/push';
import { notificacionesModalClasses as c } from './NotificacionesModal.styles';

export interface NotificacionesModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function NotificacionesModal({ abierto, onCerrar }: NotificacionesModalProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const { showToast } = useToast();
  const [pushEstado, setPushEstado] = useState<EstadoPush | null>(null);
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    void estadoPush().then((e) => {
      if (vivo) setPushEstado(e);
    });
    return () => {
      vivo = false;
    };
  }, [abierto]);

  const activar = async () => {
    setActivando(true);
    const r = await activarPush();
    setActivando(false);
    showToast(r.mensaje, r.ok ? 'success' : 'error');
    if (r.ok) void estadoPush().then((e) => setPushEstado(e));
  };

  return (
    <Modal open={abierto} onClose={onCerrar} size="sm">
      <ModalBody>
        {/* Banner de activación del push — los 4 estados del permiso */}
        {pushEstado?.estado === 'por-activar' && (
          <div className={c.banner}>
            <div className="min-w-0">
              <p className={c.bannerTitulo}>Activa las notificaciones del teléfono</p>
              <p className={c.bannerTexto}>Llegan aunque tengas la app cerrada.</p>
            </div>
            <Button variant="primary" size="md" loading={activando} onClick={() => void activar()} className="min-h-[44px] shrink-0">
              Activar
            </Button>
          </div>
        )}
        {pushEstado?.estado === 'bloqueadas' && (
          <div className={c.banner}>
            <p className={c.bannerTexto}>
              Notificaciones bloqueadas — habilítalas en los ajustes del navegador (sitio → notificaciones).
            </p>
          </div>
        )}
        {pushEstado?.estado === 'no-soportado' && (
          <div className={c.banner}>
            <p className={c.bannerTexto}>
              Las notificaciones del sistema requieren la app instalada en el teléfono.
            </p>
          </div>
        )}
        {pushEstado?.estado === 'activadas' && (
          <div className={c.banner}>
            <p className={c.bannerTexto}>Notificaciones del teléfono activadas ✓</p>
          </div>
        )}

        {/* Encabezado — igual que el Centro de Alertas del escritorio */}
        <div className={c.header}>
          <div className="min-w-0">
            <p className={c.headerTitulo}>Centro de Alertas</p>
            <p className={c.headerSub}>{unreadCount} no leídas</p>
          </div>
          {notifications.length > 0 && (
            <div className={c.acciones}>
              <button
                type="button"
                onClick={() => markAllAsRead()}
                aria-label="Marcar todas leídas"
                title="Marcar todas leídas"
                className={c.accionIcono}
              >
                <CheckCheck className="w-5 h-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => clearNotifications()}
                aria-label="Vaciar notificaciones"
                title="Vaciar"
                className={c.accionIconoRojo}
              >
                <Trash2 className="w-5 h-5" aria-hidden />
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className={c.vacio}>
            <Bell className={c.vacioIcono} aria-hidden />
            <p className={c.vacioTexto}>Sin notificaciones</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markAsRead(n.id)}
                  className={`${c.item} ${n.leido ? '' : c.itemNoLeida}`}
                  title={n.leido ? undefined : 'Marcar como leída'}
                >
                  <span className="flex items-center gap-2">
                    <Badge variant={n.tipo === 'alerta' ? 'warning' : 'info'} size="sm">
                      {n.tipo === 'alerta' ? 'Alerta' : 'Info'}
                    </Badge>
                    <span className={n.leido ? c.itemLeidoMarca : c.itemNoLeidaMarca} aria-hidden />
                  </span>
                  <p className={c.itemTitulo}>{n.titulo}</p>
                  <p className={c.itemMensaje}>{n.mensaje}</p>
                  <p className={c.itemFecha}>{n.fecha}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" className={c.botonPie} onClick={onCerrar}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
