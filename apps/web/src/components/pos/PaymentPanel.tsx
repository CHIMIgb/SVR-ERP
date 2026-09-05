'use client';

import { useState } from 'react';
import { CreditCard, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { cn } from '@/lib/utils';
import { CASH_BILLS, CASH_COINS, getChange, SPEI_ACCOUNT } from '@/lib/pos';
import type { Payment, PaymentMethod } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface PaymentPanelProps {
  total: number;
  onPay: (
    payments: Payment[],
    method: PaymentMethod,
    cashReceived: number | undefined,
    change: number | undefined,
  ) => void;
  disabled: boolean;
}

const METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Tarjeta', value: 'tarjeta' },
  { label: 'Transferencia', value: 'transferencia' },
];

export function PaymentPanel({ total, onPay, disabled }: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState('');

  const received = Number(cashReceived) || 0;
  const change = getChange(received, total);

  const canPay = !disabled && (method === 'efectivo' ? received >= total : true);

  const addCash = (amount: number) => {
    setCashReceived((prev) => ((Number(prev) || 0) + amount).toFixed(2));
  };

  const handlePay = () => {
    if (!canPay) return;

    let payments: Payment[] = [];
    let cashReceivedValue: number | undefined;
    let changeValue: number | undefined;

    if (method === 'efectivo') {
      payments = [{ method: 'efectivo', amount: total }];
      cashReceivedValue = received;
      changeValue = change;
    } else {
      payments = [{ method, amount: total }];
    }

    onPay(payments, method, cashReceivedValue, changeValue);

    setMethod('efectivo');
    setCashReceived('');
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
            <span className={posClasses.terminalAmount}>{formatCurrency(total)}</span> en la
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
            <span className={posClasses.terminalAmount}>{formatCurrency(total)}</span> a la
            cuenta indicada y confirma.
          </p>
          <p className="font-mono text-xs font-black text-slate-700 mt-2">{SPEI_ACCOUNT}</p>
        </div>
      )}

      {/* Total a pagar + botón */}
      <div className="mt-auto pt-3">
        <div className={posClasses.totalRow}>
          <span className={posClasses.totalLabel}>Total a pagar</span>
          <span className={posClasses.totalValue}>{formatCurrency(total)}</span>
        </div>
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
