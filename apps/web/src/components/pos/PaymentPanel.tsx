'use client';

import { useState } from 'react';
import { CreditCard, QrCode, Banknote, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { posClasses } from './pos.styles';
import { cn } from '@/lib/utils';
import { applyDiscount, CASH_BILLS, CASH_COINS, discountAmount, getChange, SPEI_ACCOUNT } from '@/lib/pos';
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
  /** Abre el modal QR con el monto a transferir. */
  onRequestQr: (amount: number) => void;
  disabled: boolean;
}

type PanelMethod = PaymentMethod | 'mixto';

const METHOD_OPTIONS: { label: string; value: PanelMethod }[] = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Tarjeta (terminal)', value: 'tarjeta' },
  { label: 'Transferencia / QR', value: 'transferencia' },
  { label: 'Mixto', value: 'mixto' },
];

const MIXED_SECONDARY_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Tarjeta (terminal)', value: 'tarjeta' },
  { label: 'Transferencia / QR', value: 'transferencia' },
];

/** Descuento máximo que el cajero puede aplicar sin autorización del Administrador. */
const DISCOUNT_APPROVAL_THRESHOLD = 10;

function methodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'efectivo':
      return 'Efectivo';
    case 'tarjeta':
      return 'Tarjeta';
    case 'transferencia':
      return 'Transferencia';
  }
}

export function PaymentPanel({ total, isAdmin, onPay, onRequestQr, disabled }: PaymentPanelProps) {
  const [method, setMethod] = useState<PanelMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [cashPart, setCashPart] = useState('');
  const [secondaryMethod, setSecondaryMethod] = useState<PaymentMethod>('tarjeta');
  const [discountPct, setDiscountPct] = useState('');
  const [discountAuthorized, setDiscountAuthorized] = useState(false);

  const discount = Math.min(100, Math.max(0, Number(discountPct) || 0));
  const discountTotal = discountAmount(total, discount);
  const totalFinal = applyDiscount(total, discount);

  const received = Number(cashReceived) || 0;
  const cashPartValue = Number(cashPart) || 0;
  const change = getChange(received, totalFinal);

  const needsApproval = discount > DISCOUNT_APPROVAL_THRESHOLD;
  const approved = needsApproval ? discountAuthorized || isAdmin : true;

  const mixedValid = cashPartValue > 0 && cashPartValue < totalFinal;
  const secondaryAmount = mixedValid ? totalFinal - cashPartValue : 0;

  const canPay =
    !disabled &&
    approved &&
    (method === 'efectivo' ? received >= totalFinal : method === 'mixto' ? mixedValid : true);

  const addCash = (amount: number) => {
    setCashReceived((prev) => ((Number(prev) || 0) + amount).toFixed(2));
  };

  const handlePay = () => {
    if (!canPay) return;

    let payments: Payment[] = [];
    let cashReceivedValue: number | undefined;
    let changeValue: number | undefined;

    if (method === 'mixto') {
      payments = [
        { method: 'efectivo', amount: cashPartValue },
        { method: secondaryMethod, amount: secondaryAmount },
      ];
      cashReceivedValue = cashPartValue;
      changeValue = 0;
    } else if (method === 'efectivo') {
      payments = [{ method: 'efectivo', amount: totalFinal }];
      cashReceivedValue = received;
      changeValue = change;
    } else {
      payments = [{ method, amount: totalFinal }];
    }

    const finalMethod: PaymentMethod =
      method === 'mixto' ? (cashPartValue >= secondaryAmount ? 'efectivo' : secondaryMethod) : method;

    onPay(
      payments,
      finalMethod,
      cashReceivedValue,
      changeValue,
      discount,
      discountTotal,
      needsApproval ? (isAdmin ? 'Administrador' : 'Administrador (simulado)') : undefined,
    );

    setMethod('efectivo');
    setCashReceived('');
    setCashPart('');
    setSecondaryMethod('tarjeta');
    setDiscountPct('');
    setDiscountAuthorized(false);
  };

  const qrAmount = method === 'mixto' ? secondaryAmount : totalFinal;

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
              className={cn(posClasses.chipBase, method === opt.value ? posClasses.chipActive : posClasses.chipInactive)}
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

      {/* Transferencia / QR */}
      {method === 'transferencia' && (
        <div className={posClasses.terminalBox}>
          <QrCode className="w-10 h-10 text-primary mx-auto" />
          <p className={posClasses.terminalTitle}>Transferencia / QR</p>
          <p className={posClasses.terminalText}>
            El cliente transfiere{' '}
            <span className={posClasses.terminalAmount}>{formatCurrency(totalFinal)}</span> a la
            cuenta (simulada) y confirma.
          </p>
          <p className="font-mono text-xs font-black text-slate-700 mt-2">{SPEI_ACCOUNT}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            icon={<QrCode className="w-4 h-4" />}
            onClick={() => onRequestQr(qrAmount)}
          >
            Ver código QR
          </Button>
        </div>
      )}

      {/* Mixto */}
      {method === 'mixto' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Total: {formatCurrency(totalFinal)} — ingresa la parte en efectivo; el resto se cobra
            con el segundo método.
          </p>
          <Input
            value={cashPart}
            onChange={(e) => setCashPart(e.target.value)}
            placeholder="Efectivo a recibir (MXN)"
            inputMode="decimal"
            type="number"
          />
          <div>
            <label className={posClasses.fieldLabel}>Método para el resto</label>
            <div className="flex flex-wrap gap-2">
              {MIXED_SECONDARY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSecondaryMethod(opt.value)}
                  className={cn(
                    posClasses.chipBase,
                    secondaryMethod === opt.value ? posClasses.chipActive : posClasses.chipInactive,
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {mixedValid && (
            <p className="text-xs font-bold text-slate-700">
              Resto con {methodLabel(secondaryMethod)}: {formatCurrency(secondaryAmount)}
            </p>
          )}
          {mixedValid && secondaryMethod === 'transferencia' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<QrCode className="w-4 h-4" />}
              onClick={() => onRequestQr(qrAmount)}
            >
              Ver código QR del resto
            </Button>
          )}
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
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-1"
                  icon={
                    discountAuthorized ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )
                  }
                  onClick={() => setDiscountAuthorized(true)}
                  disabled={discountAuthorized}
                >
                  {discountAuthorized ? 'Autorizado' : 'Autorizar como Administrador'}
                </Button>
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