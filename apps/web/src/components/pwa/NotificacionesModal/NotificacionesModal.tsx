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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useNotifications } from '@/components/layout/NotificationContext';
import { notificacionesModalClasses as c } from './NotificacionesModal.styles';

export interface NotificacionesModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function NotificacionesModal({ abierto, onCerrar }: NotificacionesModalProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <Modal open={abierto} onClose={onCerrar} size="md">
      <ModalBody>
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
