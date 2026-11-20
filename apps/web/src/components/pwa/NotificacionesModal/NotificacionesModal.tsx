'use client';

/**
 * Centro de notificaciones del teléfono — REUTILIZA el provider compartido
 * (`NotificationProvider`: polling de 60 s, marcar leída / todas / descartar;
 * cero lógica nueva). Tap en un item lo marca leído; la navegación al reporte
 * referenciado queda como mejora (el provider compartido aún no expone
 * `referenciaTipo`/`referenciaId`).
 */
import { BellOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { useNotifications } from '@/components/layout/NotificationContext';
import { notificacionesModalClasses as c } from './NotificacionesModal.styles';

export interface NotificacionesModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function NotificacionesModal({ abierto, onCerrar }: NotificacionesModalProps) {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <Modal open={abierto} onClose={onCerrar} size="md">
      <ModalHeader title="Notificaciones" onClose={onCerrar} />
      <ModalBody>
        {notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff className="w-10 h-10" />}
            title="Sin notificaciones"
            subtitle="Aquí verás los avisos de tu área y de tus reportes."
          />
        ) : (
          <>
            <div className={c.acciones}>
              <Button variant="secondary" className={c.boton} onClick={() => markAllAsRead()}>
                Marcar todas leídas
              </Button>
              <Button variant="secondary" className={c.boton} onClick={() => clearNotifications()}>
                Vaciar
              </Button>
            </div>
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
                      <span
                        className={n.leido ? c.itemLeidoMarca : c.itemNoLeidaMarca}
                        aria-hidden
                      />
                    </span>
                    <p className={c.itemTitulo}>{n.titulo}</p>
                    <p className={c.itemMensaje}>{n.mensaje}</p>
                    <p className={c.itemFecha}>{n.fecha}</p>
                  </button>
                </li>
              ))}
            </ul>
          </>
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
