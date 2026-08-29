'use client';

import { ReceiptText, Eye, Printer } from 'lucide-react';
import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { posClasses } from './pos.styles';
import { formatTicketDate, isToday } from '@/lib/pos';
import type { POSSale } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

function methodLabel(method: string): string {
  switch (method) {
    case 'efectivo':
      return 'Efectivo';
    case 'tarjeta':
      return 'Tarjeta';
    case 'transferencia':
      return 'Transferencia';
    default:
      return method;
  }
}

interface SalesHistoryModalProps {
  sales: POSSale[];
  onClose: () => void;
  onReprint: (sale: POSSale) => void;
  onView?: (sale: POSSale) => void;
  open?: boolean;
}

/** Historial de ventas del día con reimpresión de ticket (POS). */
export function SalesHistoryModal({
  sales,
  onClose,
  onReprint,
  onView,
  open = true,
}: SalesHistoryModalProps) {
  const today = sales.filter((s) => isToday(s.createdAt));
  const totalToday = today.reduce((sum, s) => sum + s.total, 0);

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title="Ventas de hoy"
        subtitle={`${today.length} ventas · ${formatCurrency(totalToday)}`}
        onClose={onClose}
      />
      <ModalBody>
        {today.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="w-10 h-10" />}
            title="Sin ventas registradas hoy"
            subtitle="Las ventas del día aparecerán aquí al cobrar en el punto de venta."
          />
        ) : (
          <div className="max-h-[55vh] overflow-y-auto scrollbar-none">
            {today.map((sale) => {
              const { time } = formatTicketDate(sale.createdAt);
              return (
                <div key={sale.id} className={posClasses.historyRow}>
                  <div className="min-w-0 flex-1">
                    <p className={posClasses.historyTicket}>{sale.ticketNumber}</p>
                    <p className={posClasses.historyMeta}>Folio: {sale.folio}</p>
                    <p className={posClasses.historyMeta}>
                      {time} · {sale.customer || 'Público en general'}
                    </p>
                    <p className={posClasses.historyMeta}>
                      {methodLabel(sale.method)}
                      {sale.discountPct ? ` · −${sale.discountPct}%` : ''}
                    </p>
                  </div>
                  <span className={posClasses.historyTotal}>{formatCurrency(sale.total)}</span>
                  {onView && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => onView(sale)}
                    >
                      Ver ticket
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => onReprint(sale)}
                  >
                    Reimprimir
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}