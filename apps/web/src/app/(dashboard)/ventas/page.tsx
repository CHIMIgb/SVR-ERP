"use client";

import { useMemo, useState } from 'react';
import {
  Plus,
  ReceiptText,
  ShoppingCart,
  ArrowDownCircle,
  Trash2,
  CalendarDays,
  Banknote,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import Modal, { ModalField, inputClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';
import { useAuth } from '@/hooks/useAuth';

import { PosScanner } from '@/components/pos/PosScanner';
import { CartItemRow } from '@/components/pos/CartItemRow';
import { PaymentPanel } from '@/components/pos/PaymentPanel';
import { QrModal } from '@/components/pos/QrModal';
import { TicketPreview } from '@/components/pos/TicketPreview';
import { SalesHistoryModal } from '@/components/pos/SalesHistoryModal';
import { posClasses } from '@/components/pos/pos.styles';

import {
  BUSINESS_INFO,
  POS_REGISTER,
  POS_TERMINAL,
  PRODUCTS,
  buildPaymentDetails,
  calculateTaxBreakdown,
  calculateTotal,
  findProductByBarcode,
  generateSaleFolio,
  generateTicketNumber,
  isToday,
  printTicket,
} from '@/lib/pos';
import type { CartItem, Payment, PaymentMethod, POSSale } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Retiro {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  hora: string;
  autorizadoPor: string;
}

const retirosIniciales: Retiro[] = [];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VentasPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const vistaVentas = user?.vistas.find((v) => v.ruta === '/ventas');
  const puedeCrear = vistaVentas?.puedeCrear ?? false;
  const isAdmin = user?.roles.some((r) => r.nombre.toLowerCase().includes('admin')) ?? false;

  const cashierName = user?.persona && user.persona.nombre
    ? `${user.persona.nombre} ${user.persona.apellidoPaterno ?? ''}`.trim()
    : 'Cajero';

  // Carrito + ventas del día (estado local, fase 1 frontend)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<POSSale[]>([]);
  const [retiros, setRetiros] = useState<Retiro[]>(retirosIniciales);

  // Modales del POS
  const [qrAmount, setQrAmount] = useState<number | null>(null);
  const [lastSale, setLastSale] = useState<POSSale | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Modal de retiro
  const [modalRetiro, setModalRetiro] = useState(false);
  const [formRetiro, setFormRetiro] = useState({ concepto: '', monto: '', autorizadoPor: '' });

  const total = useMemo(() => calculateTotal(cart), [cart]);
  const itemsSold = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // ── Carrito ──────────────────────────────────────────────────────────────
  const addToCart = (barcode: string) => {
    const product = findProductByBarcode(PRODUCTS, barcode);
    if (!product) {
      showToast('Producto no encontrado en el catálogo.', 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Stock máximo (${product.stock}) alcanzado.`, 'error');
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.product.id !== id) return [i];
        const qty = i.quantity + delta;
        if (qty <= 0) return [];
        if (qty > i.product.stock) {
          showToast(`Stock máximo (${i.product.stock}).`, 'error');
          return [i];
        }
        return [{ ...i, quantity: qty }];
      }),
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  // ── Cobro ─────────────────────────────────────────────────────────────────
  const handlePay = (
    payments: Payment[],
    method: PaymentMethod,
    cashReceived: number | undefined,
    change: number | undefined,
    discountPct: number,
    discountTotal: number,
    authorizedBy: string | undefined,
  ) => {
    if (cart.length === 0) return;
    const totalCobrado = payments.reduce((sum, p) => sum + p.amount, 0);

    const sale: POSSale = {
      id: `sale-${Date.now()}`,
      ticketNumber: generateTicketNumber(sales.length),
      folio: generateSaleFolio(),
      terminal: POS_TERMINAL,
      registerNumber: POS_REGISTER,
      customer: 'Público en general',
      cashier: cashierName,
      items: cart,
      total: totalCobrado,
      method,
      cashReceived,
      change,
      payments,
      taxBreakdown: calculateTaxBreakdown(totalCobrado),
      paymentDetails: buildPaymentDetails(method),
      discountPct: discountPct || undefined,
      discountTotal: discountTotal || undefined,
      authorizedBy,
      itemsSold: cart.reduce((sum, i) => sum + i.quantity, 0),
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [sale, ...prev]);
    setCart([]);
    setLastSale(sale);
  };

  // ── Retiros ───────────────────────────────────────────────────────────────
  const handleRetiro = () => {
    const monto = parseFloat(formRetiro.monto);
    if (!formRetiro.concepto.trim() || !monto || monto <= 0) {
      showToast('Concepto y monto son obligatorios.', 'error');
      return;
    }
    const ahora = new Date();
    const nuevo: Retiro = {
      id: `r-${Date.now()}`,
      concepto: formRetiro.concepto.trim(),
      monto,
      fecha: ahora.toISOString().split('T')[0],
      hora: ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      autorizadoPor: formRetiro.autorizadoPor.trim() || 'Sin especificar',
    };
    setRetiros((prev) => [nuevo, ...prev]);
    setModalRetiro(false);
    setFormRetiro({ concepto: '', monto: '', autorizadoPor: '' });
    showToast(`Retiro de ${formatCurrency(monto)} registrado.`, 'success');
  };

  // ── Métricas del día ──────────────────────────────────────────────────────
  const hoyIso = new Date().toISOString().split('T')[0];
  const ventasHoy = sales.filter((s) => isToday(s.createdAt));
  const totalHoy = ventasHoy.reduce((sum, s) => sum + s.total, 0);
  const ticketPromedio = ventasHoy.length ? totalHoy / ventasHoy.length : 0;
  const piezasHoy = ventasHoy.reduce((sum, s) => sum + s.itemsSold, 0);
  const retirosHoy = retiros
    .filter((r) => r.fecha === hoyIso)
    .reduce((sum, r) => sum + r.monto, 0);

  const resumenPorMetodo = (() => {
    const resumen = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    for (const sale of ventasHoy) {
      if (sale.payments?.length) {
        for (const p of sale.payments) resumen[p.method] += p.amount;
      } else {
        resumen[sale.method] += sale.total;
      }
    }
    return resumen;
  })();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Punto de Venta"
        subtitle={`Caja ${POS_REGISTER} · Terminal ${POS_TERMINAL} · Cajero: ${cashierName}`}
        action={
          <Button
            variant="secondary"
            icon={<ReceiptText className="w-4 h-4" />}
            onClick={() => setShowHistory(true)}
          >
            Ventas de hoy ({ventasHoy.length})
          </Button>
        }
      />

      {/* Acceso por RBAC */}
      {!puedeCrear && (
        <EmptyState
          icon={<ShoppingCart className="w-10 h-10" />}
          title="Sin permiso para cobrar"
          subtitle="Tu rol no tiene el permiso de crear ventas (/ventas). Contacta a un administrador."
        />
      )}

      {puedeCrear && (
        <>
          {/* Stats del día */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              icon={<ShoppingCart className="w-5 h-5" />}
              value={ventasHoy.length}
              label="Ventas de hoy"
              color="primary"
            />
            <StatsCard
              icon={<Banknote className="w-5 h-5" />}
              value={formatCurrency(totalHoy)}
              label="Ingresos del día"
              color="success"
            />
            <StatsCard
              icon={<ReceiptText className="w-5 h-5" />}
              value={formatCurrency(ticketPromedio)}
              label="Ticket promedio"
              color="info"
            />
            <StatsCard
              icon={<Plus className="w-5 h-5" />}
              value={piezasHoy}
              label="Artículos vendidos"
              color="warning"
            />
          </div>

          {/* Tabs */}
          <Tabs
            defaultTab="pos"
            tabs={[
              { key: 'pos', label: 'Punto de Venta', icon: <ShoppingCart className="w-4 h-4" /> },
              { key: 'retiros', label: 'Retiros / Gastos', icon: <ArrowDownCircle className="w-4 h-4" /> },
              { key: 'corte', label: 'Corte del Día', icon: <CalendarDays className="w-4 h-4" /> },
            ]}
          >
            {/* ─── POS ─────────────────────────────────────────────────── */}
            <TabPanel tabKey="pos">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                {/* Izquierda: scanner + carrito */}
                <div className="lg:col-span-3 space-y-4">
                  <PosScanner products={PRODUCTS} onScan={addToCart} />

                  <div className={posClasses.card}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={posClasses.sectionTitle}>Carrito</h3>
                      <span className="text-xs font-bold text-slate-400">{itemsSold} art(s)</span>
                    </div>

                    {cart.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        Agrega productos con el scanner o la búsqueda.
                      </p>
                    ) : (
                      <>
                        <div>
                          {cart.map((item) => (
                            <CartItemRow
                              key={item.product.id}
                              item={item}
                              onIncrement={() => updateQty(item.product.id, 1)}
                              onDecrement={() => updateQty(item.product.id, -1)}
                              onRemove={() => removeItem(item.product.id)}
                            />
                          ))}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className={posClasses.cartTotalLabel}>Total</span>
                          <span className={posClasses.cartTotalValue}>{formatCurrency(total)}</span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => setCart([])}
                        >
                          Vaciar carrito
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Derecha: pago */}
                <div className="lg:col-span-2">
                  <PaymentPanel
                    total={total}
                    isAdmin={isAdmin}
                    disabled={cart.length === 0}
                    onPay={handlePay}
                    onRequestQr={setQrAmount}
                  />
                </div>
              </div>
            </TabPanel>

            {/* ─── RETIROS ─────────────────────────────────────────────── */}
            <TabPanel tabKey="retiros">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    icon={<ArrowDownCircle className="w-4 h-4" />}
                    onClick={() => setModalRetiro(true)}
                  >
                    Registrar retiro
                  </Button>
                </div>

                {retiros.length === 0 ? (
                  <EmptyState
                    icon={<ArrowDownCircle className="w-10 h-10" />}
                    title="Sin retiros registrados"
                    subtitle="Los gastos de caja chica aparecerán aquí (gasolina, refacciones, etc.)."
                  />
                ) : (
                  <div className="space-y-3">
                    {retiros.map((r) => (
                      <div key={r.id} className={posClasses.card}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                              <ArrowDownCircle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{r.concepto}</p>
                              <p className={posClasses.muted}>
                                {r.fecha} · {r.hora} · Autorizado por:{' '}
                                <span className="font-bold">{r.autorizadoPor}</span>
                              </p>
                            </div>
                          </div>
                          <span className="font-black text-red-500 text-lg whitespace-nowrap">
                            {formatCurrency(r.monto)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* ─── CORTE DEL DÍA ───────────────────────────────────────── */}
            <TabPanel tabKey="corte">
              <div className="max-w-xl mx-auto space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <label className="font-bold text-slate-700 text-sm">Corte de hoy</label>
                  <input
                    type="date"
                    value={hoyIso}
                    readOnly
                    className={`${inputClass} w-auto pointer-events-none opacity-70`}
                  />
                </div>

                <div className={posClasses.card}>
                  <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                    <ReceiptText className="w-5 h-5 text-primary" /> Resumen del Corte
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium text-sm">Ventas registradas</span>
                      <span className="font-black text-slate-900">{ventasHoy.length}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium text-sm">Ingresos totales (bruto)</span>
                      <span className="font-black text-slate-900">{formatCurrency(totalHoy)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium text-sm">IVA 16% del día</span>
                      <span className="font-black text-slate-700">
                        {formatCurrency(ventasHoy.reduce((sum, s) => sum + s.taxBreakdown.iva, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-green-600 font-medium text-sm">Efectivo cobrado</span>
                      <span className="font-black text-green-600">{formatCurrency(resumenPorMetodo.efectivo)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-blue-600 font-medium text-sm">Tarjeta</span>
                      <span className="font-black text-blue-600">{formatCurrency(resumenPorMetodo.tarjeta)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-indigo-600 font-medium text-sm">Transferencia / QR</span>
                      <span className="font-black text-indigo-600">{formatCurrency(resumenPorMetodo.transferencia)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-red-500 font-medium text-sm">Retiros de efectivo (hoy)</span>
                      <span className="font-black text-red-500">− {formatCurrency(retirosHoy)}</span>
                    </div>
                    <div className={`flex justify-between py-3 px-4 bg-slate-900 rounded-xl mt-2 ${resumenPorMetodo.efectivo - retirosHoy >= 0 ? '' : 'text-red-400'}`}>
                      <span className="text-white font-black text-sm">EFECTIVO EN CAJA</span>
                      <span className={`font-black text-xl ${resumenPorMetodo.efectivo - retirosHoy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(resumenPorMetodo.efectivo - retirosHoy)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </>
      )}

      {/* ─── Modales ─────────────────────────────────────────────────────── */}

      <QrModal amount={qrAmount ?? 0} onClose={() => setQrAmount(null)} open={qrAmount !== null} />

      {lastSale && (
        <TicketPreview sale={lastSale} businessInfo={BUSINESS_INFO} onClose={() => setLastSale(null)} />
      )}

      <SalesHistoryModal
        sales={sales}
        onClose={() => setShowHistory(false)}
        onReprint={(sale) => printTicket(sale, BUSINESS_INFO)}
        open={showHistory}
      />

      <Modal
        isOpen={modalRetiro}
        onClose={() => setModalRetiro(false)}
        onConfirm={handleRetiro}
        title="Retiro de Efectivo"
        confirmLabel="Registrar Retiro"
      >
        <ModalField label="Concepto *">
          <input
            className={inputClass}
            placeholder="Ej: Gasolina, refacción urgente..."
            value={formRetiro.concepto}
            onChange={(e) => setFormRetiro({ ...formRetiro, concepto: e.target.value })}
          />
        </ModalField>
        <ModalField label="Monto (MXN) *">
          <input
            type="number"
            className={inputClass}
            placeholder="0.00"
            value={formRetiro.monto}
            onChange={(e) => setFormRetiro({ ...formRetiro, monto: e.target.value })}
          />
        </ModalField>
        <ModalField label="Autorizado por">
          <input
            className={inputClass}
            placeholder="Gerencia / Jefe de Patio"
            value={formRetiro.autorizadoPor}
            onChange={(e) => setFormRetiro({ ...formRetiro, autorizadoPor: e.target.value })}
          />
        </ModalField>
      </Modal>
    </div>
  );
}