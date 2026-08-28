'use client';

import { Printer } from 'lucide-react';
import { Modal, ModalBody, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { cn } from '@/lib/utils';
import { barcodeBars, formatTicketDate, itemSubtotal, itemUnitPrice, numberToWords, printTicket } from '@/lib/pos';
import type { BusinessInfo, POSSale } from '@/lib/pos';
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

function initialsOf(name: string): string {
  return (
    name
      .split(' ')
      .filter((w) => w.length > 2 && w[0] !== '[')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SVR'
  );
}

function TicketBarcode({ code }: { code: string }) {
  const bars = barcodeBars(code);
  const totalWidth = bars.length ? bars[bars.length - 1].x + bars[bars.length - 1].width + 10 : 0;
  return (
    <div className={posClasses.ticketBarcodeBox}>
      <svg width={totalWidth} height={48} viewBox={`0 0 ${totalWidth} 48`} className="mx-auto">
        {bars.map((bar, index) => (
          <rect key={index} x={bar.x} y={0} width={bar.width} height={48} fill="#111827" />
        ))}
      </svg>
      <p className={posClasses.ticketBarcodeNum}>{code}</p>
    </div>
  );
}

interface TicketPreviewProps {
  sale: POSSale;
  businessInfo: BusinessInfo;
  onClose: () => void;
}

/** Vista previa del ticket de venta (estilo térmico 58mm) + impresión web. */
export function TicketPreview({ sale, businessInfo, onClose }: TicketPreviewProps) {
  const { date, time } = formatTicketDate(sale.createdAt);
  const payments = sale.payments?.length ? sale.payments : [{ method: sale.method, amount: sale.total }];
  const tax = sale.taxBreakdown;
  const pieces = sale.items.reduce((sum, i) => sum + i.quantity, 0);
  const d = sale.paymentDetails;

  const paymentDetailsRows = (() => {
    const hasCard = sale.method === 'tarjeta' || (payments.length > 1 && payments.some((p) => p.method === 'tarjeta'));
    if (hasCard) {
      return (
        <>
          <div className={posClasses.ticketRow}>
            <span>Tipo</span>
            <span>{d.cardType === 'credito' ? 'Crédito' : 'Débito'}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Tarjeta</span>
            <span>**** {d.lastFour ?? '****'}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Aut#</span>
            <span>{d.authCode ?? ''}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Afiliación</span>
            <span>{d.affiliation ?? ''}</span>
          </div>
        </>
      );
    }
    if (sale.method === 'transferencia') {
      return (
        <>
          <div className={posClasses.ticketRow}>
            <span>Cuenta SPEI</span>
            <span>{d.speiAccount ?? ''}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Referencia</span>
            <span>{d.reference ?? ''}</span>
          </div>
        </>
      );
    }
    return null;
  })();

  return (
    <Modal open onClose={onClose} size="lg">
      <ModalHeader title="Venta registrada" subtitle={`Ticket ${sale.ticketNumber}`} />
      <ModalBody>
        <div className={cn(posClasses.ticketPaper, 'max-h-[65vh] overflow-y-auto scrollbar-none')}>
          <div className={posClasses.ticketCenter}>
            <div className={posClasses.ticketLogo}>{initialsOf(businessInfo.name)}</div>
            <p className="text-sm font-bold">{businessInfo.name}</p>
            <p className={posClasses.muted}>R.F.C. {businessInfo.rfc}</p>
            <p className={posClasses.muted}>{businessInfo.address}</p>
            <p className={posClasses.muted}>
              {businessInfo.branch} · {businessInfo.branchCode}
            </p>
            <p className={posClasses.muted}>Tel. {businessInfo.phone}</p>
          </div>

          <div className={posClasses.ticketDivider} />

          <p className={posClasses.ticketSection}>TICKET DE VENTA</p>
          <div className={posClasses.ticketRow}>
            <span>Folio</span>
            <span className="font-bold tracking-wide">{sale.folio}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Ticket</span>
            <span>{sale.ticketNumber}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Fecha</span>
            <span>{date}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Hora</span>
            <span>{time}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Terminal</span>
            <span>{sale.terminal}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Caja</span>
            <span>{sale.registerNumber}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Cajero</span>
            <span>{sale.cashier}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>Cliente</span>
            <span>{sale.customer || 'Público en general'}</span>
          </div>

          <div className={posClasses.ticketDivider} />

          <div className="flex justify-between text-[10px] font-bold border-b border-dashed border-slate-300 pb-1">
            <span className="flex-1">ARTÍCULO</span>
            <span className="w-9 text-center">CANT</span>
            <span className="w-14 text-right">P.UNIT</span>
            <span className="w-14 text-right">TOTAL</span>
          </div>
          <div>
            {sale.items.map((item, index) => {
              const unit = itemUnitPrice(item);
              const lineTotal = itemSubtotal(item);
              const hasOverride = (item.priceOverride ?? item.product.priceMxn) !== item.product.priceMxn;
              return (
                <div key={`${item.product.id}-${index}`} className="py-1">
                  <div className="flex justify-between items-start">
                    <span className="flex-1 font-bold">
                      {item.product.name}
                      {hasOverride ? ' (PM)' : ''}
                      {item.discountPct ? ` -${item.discountPct}%` : ''}
                    </span>
                    <span className="w-9 text-center">x{item.quantity}</span>
                    <span className="w-14 text-right">{formatCurrency(unit)}</span>
                    <span className="w-14 text-right font-bold">{formatCurrency(lineTotal)}</span>
                  </div>
                  <p className={posClasses.muted}>
                    SKU: {item.product.sku} · {item.product.unit}
                  </p>
                </div>
              );
            })}
          </div>

          <div className={posClasses.ticketDivider} />

          <div className={posClasses.ticketRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(tax.subtotal)}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>IVA 16%</span>
            <span>{formatCurrency(tax.iva)}</span>
          </div>
          <div className={posClasses.ticketRow}>
            <span>IEPS</span>
            <span>{formatCurrency(tax.ieps)}</span>
          </div>
          {sale.discountPct ? (
            <div className={posClasses.ticketRow}>
              <span>Descuento ({sale.discountPct}%)</span>
              <span className="text-red-500">−{formatCurrency(sale.discountTotal ?? 0)}</span>
            </div>
          ) : null}
          {payments.map((p, i) => (
            <div key={`${p.method}-${i}`} className={posClasses.ticketRow}>
              <span>{methodLabel(p.method)}</span>
              <span>{formatCurrency(p.amount)}</span>
            </div>
          ))}
          {paymentDetailsRows}
          {sale.method === 'efectivo' && sale.cashReceived != null && (
            <>
              <div className={posClasses.ticketRow}>
                <span>Recibido</span>
                <span>{formatCurrency(sale.cashReceived)}</span>
              </div>
              <div className={posClasses.ticketRow}>
                <span>Cambio</span>
                <span>{formatCurrency(sale.change ?? 0)}</span>
              </div>
            </>
          )}
          <div className={cn(posClasses.ticketRow, 'font-black text-sm border-t border-dashed border-slate-300 pt-1 mt-1')}>
            <span>TOTAL</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
          {sale.authorizedBy && (
            <p className="text-[10px] text-slate-500 text-center mt-1">
              Autorizado por: {sale.authorizedBy}
            </p>
          )}

          <p className={posClasses.ticketSection + ' italic'}>{numberToWords(sale.total)}</p>
          <p className="text-center text-[10px]">
            {sale.itemsSold} artículo{sale.itemsSold !== 1 ? 's' : ''} vendido
            {sale.itemsSold !== 1 ? 's' : ''} · {pieces} piezas
          </p>

          <div className={posClasses.ticketDivider} />
          <TicketBarcode code={sale.folio} />
          <div className={posClasses.ticketDivider} />

          <p className={posClasses.ticketFooter}>Gracias por su compra</p>
          <p className={posClasses.ticketLegal}>
            Política de devoluciones: presente este ticket. Devoluciones dentro de los 30 días
            naturales en el mismo punto de venta.
          </p>
          <p className={posClasses.ticketLegal}>
            Régimen General de Personas Morales. Este comprobante no es un comprobante fiscal
            digital.
          </p>
        </div>
      </ModalBody>
      <ModalFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="primary"
          icon={<Printer className="w-4 h-4" />}
          onClick={() => printTicket(sale, businessInfo)}
        >
          Imprimir / Guardar
        </Button>
      </ModalFooter>
    </Modal>
  );
}