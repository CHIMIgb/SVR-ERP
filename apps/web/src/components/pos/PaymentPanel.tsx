'use client';

import { useState } from 'react';
import { CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { cn } from '@/lib/utils';
import {
  applyDiscount,
  CASH_BILLS,
  CASH_COINS,
  discountAmount,
  getChange,
  SPEI_ACCOUNT,
} from '@/lib/pos';
import type { Payment, PaymentMethod } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface PaymentPanelProps {
  total: number;
  /** Rol del usuario para autorizar descuentos > umbral (admin=true autoriza). */
  isAdmin: boolean;
  onPay: (
    payments: Payment[],
    method: PaymentMethod,
    cashReceived: number | undefined,
    change: number | undefined,
    discountPct: number,
    discountTotal: number,
    authorizedBy: string | undefined,
  ) => void;
  disabled: boolean;
}

const METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Tarjeta', value: 'tarjeta' },
  { label: 'Transferencia', value: 'transferencia' },
];

/** Descuento máximo que el cajero puede aplicar sin autorización del Administrador. */
const DISCOUNT_APPROVAL_THRESHOLD = 10;

export function PaymentPanel({ total, isAdmin, onPay, disabled }: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [discountPct, setDiscountPct] = useState('');

  const discount = Math.min(100, Math.max(0, Number(discountPct) || 0));
  const discountTotal = discountAmount(total, discount);
  const totalFinal = applyDiscount(total, discount);

  const received = Number(cashReceived) || 0;
  const change = getChange(received, totalFinal);

  const needsApproval = discount > DISCOUNT_APPROVAL_THRESHOLD;
  const approved = !needsApproval || isAdmin;

  const canPay =
    !disabled && approved && (method === 'efectivo' ? received >= totalFinal : true);

  const addCash = (amount: number) => {
    setCashReceived((prev) => ((Number(prev) || 0) + amount).toFixed(2));
  };

  const handlePay = () => {
    if (!canPay) return;

    let payments: Payment[] = [];
    let cashReceivedValue: number | undefined;
    let changeValue: number | undefined;

    if (method === 'efectivo') {
      payments = [{ method: 'efectivo', amount: totalFinal }];
      cashReceivedValue = received;
      changeValue = change;
    } else {
      payments = [{ method, amount: totalFinal }];
    }

    onPay(
      payments,
      method,
      cashReceivedValue,
      changeValue,
      discount,
      discountTotal,
      needsApproval && isAdmin ? 'Administrador' : undefined,
    );

    setMethod('efectivo');
    setCashReceived('');
    setDiscountPct('');
  };

  return (
    <div className={cn(posClasses.card, 'flex flex-col')}>
      <h3 className={cn(posClasses.sectionTitle, 'mb-3')}>Pago</h3>

      {/* Método de pago */}
      <div className="mb-3">
        <label className={posClasses.fieldLabel}>Método de pago</label>
        <div className="flex flex-wrap gap-2">
          {METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMethod(opt.value)}
              className={cn(
                posClasses.chipBase,
                method === opt.value ? posClasses.chipActive : posClasses.chipInactive,
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Efectivo */}
      {method === 'efectivo' && (
        <div className="space-y-3">
          <div>
            <label className={posClasses.fieldLabel}>Efectivo recibido (MXN)</label>
            <Input
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              type="number"
            />
          </div>
          <div>
            <label className={posClasses.billGroupLabel}>Billetes</label>
            <div className="flex flex-wrap gap-1.5">
              {CASH_BILLS.map((bill) => (
                <button key={bill} onClick={() => addCash(bill)} className={posClasses.billBtn}>
                  ${bill.toLocaleString('es-MX')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={posClasses.billGroupLabel}>Monedas</label>
            <div className="flex flex-wrap gap-1.5">
              {CASH_COINS.map((coin) => (
                <button key={coin} onClick={() => addCash(coin)} className={posClasses.billBtn}>
                  ${coin}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-xs font-bold text-slate-600">Cambio:</span>
            <span className="font-black text-primary">{formatCurrency(change)}</span>
          </div>
        </div>
      )}

      {/* Tarjeta */}
      {method === 'tarjeta' && (
        <div className={posClasses.terminalBox}>
          <CreditCard className="w-6 h-6 text-primary mx-auto" />
          <p className={posClasses.terminalTitle}>Terminal independiente</p>
          <p className={posClasses.terminalText}>
            Introduce{' '}
            <span className={posClasses.terminalAmount}>{formatCurrency(totalFinal)}</span> en la
            terminal de tarjetas y presiona confirmar una vez aprobado.
          </p>
        </div>
      )}

      {/* Transferencia */}
      {method === 'transferencia' && (
        <div className={posClasses.terminalBox}>
          <Banknote className="w-6 h-6 text-primary mx-auto" />
          <p className={posClasses.terminalTitle}>Transferencia</p>
          <p className={posClasses.terminalText}>
            El cliente transfiere{' '}
            <span className={posClasses.terminalAmount}>{formatCurrency(totalFinal)}</span> a la
            cuenta indicada y confirma.
          </p>
          <p className="font-mono text-xs font-black text-slate-700 mt-2">{SPEI_ACCOUNT}</p>
        </div>
      )}

      {/* Descuento */}
      <div className="mt-3 space-y-2">
        <label className={posClasses.fieldLabel}>Descuento sobre el total (%)</label>
        <Input
          value={discountPct}
          onChange={(e) => setDiscountPct(e.target.value)}
          placeholder="0"
          inputMode="decimal"
          type="number"
        />
        {discount > 0 && (
          <p className="text-xs text-slate-600">
            Descuento: −{formatCurrency(discountTotal)} · Total final:{' '}
            <span className="font-black text-primary">{formatCurrency(totalFinal)}</span>
          </p>
        )}
        {needsApproval && (
          <div className={posClasses.approvalBox}>
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className={posClasses.approvalText}>
                Descuento mayor al {DISCOUNT_APPROVAL_THRESHOLD}% requiere autorización del
                Administrador.
              </p>
              {isAdmin ? (
                <p className="text-[11px] font-bold text-amber-700 mt-1">
                  Autorizado por tu rol (Administrador)
                </p>
              ) : (
                <p className="text-[11px] font-bold text-red-600 mt-1">
                  Solo un Administrador puede aplicar este descuento. Reduce el porcentaje o pide
                  autorización.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Total a pagar + botón */}
      <div className="mt-auto pt-3">
        <div className={posClasses.totalRow}>
          <span className={posClasses.totalLabel}>Total a pagar</span>
          <span className={posClasses.totalValue}>{formatCurrency(totalFinal)}</span>
        </div>
        {discount > 0 && (
          <p className="text-[11px] text-slate-400 text-right mt-1 line-through">
            {formatCurrency(total)}
          </p>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="mt-3"
          icon={<Banknote className="w-5 h-5" />}
          onClick={handlePay}
          disabled={!canPay}
        >
          Cobrar
        </Button>
      </div>
    </div>
  );
}
