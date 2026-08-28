"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ReceiptText,
  ShoppingCart,
  ArrowDownCircle,
  Trash2,
  Banknote,
  Lock,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import Modal, { ModalField, inputClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';
import { useAuth } from '@/hooks/useAuth';

import { ProductPicker } from '@/components/pos/ProductPicker';
import { CartItemRow } from '@/components/pos/CartItemRow';
import { PaymentPanel } from '@/components/pos/PaymentPanel';
import { QrModal } from '@/components/pos/QrModal';
import { TicketPreview } from '@/components/pos/TicketPreview';
import { SalesHistoryModal } from '@/components/pos/SalesHistoryModal';
import { posClasses } from '@/components/pos/pos.styles';
import { usePOS, type Retiro } from '@/components/pos/POSProvider';

import {
  BUSINESS_INFO,
  POS_REGISTER,
  POS_TERMINAL,
  PRODUCTS,
  buildPaymentDetails,
  calculateTaxBreakdown,
  calculateTotal,
  cartLineKey,
  generateSaleFolio,
  generateTicketNumber,
  isToday,
  printTicket,
} from '@/lib/pos';
import type { CartItem, Payment, PaymentMethod, POSSale, Product } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

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

  // Carrito (local) + ventas/retiros/turno (compartidos con /ventas/corte)
  const { sales, retiros, setRetiros, addSale } = usePOS();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modales del POS
  const [qrAmount, setQrAmount] = useState<number | null>(null);
  const [lastSale, setLastSale] = useState<POSSale | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [modalRetiro, setModalRetiro] = useState(false);
  const [formRetiro, setFormRetiro] = useState({ concepto: '', monto: '', autorizadoPor: '' });
  const router = useRouter();

  const total = useMemo(() => calculateTotal(cart), [cart]);
  const itemsSold = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // ── Carrito ──────────────────────────────────────────────────────────────
  const addProduct = (product: Product, unit: string, quantity: number) => {
    const qty = Math.floor(Math.max(1, quantity));
    setCart((prev) => {
      const lineKey = `${product.id}:${unit}`;
      const existing = prev.find((i) => cartLineKey(i) === lineKey);
      if (existing) {
        if (existing.quantity + qty > product.stock) {
          showToast(`Stock máximo (${product.stock} ${unit}).`, 'error');
          return prev;
        }
        return prev.map((i) =>
          cartLineKey(i) === lineKey ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { product, unit, quantity: qty }];
    });
  };

  const updateQty = (lineKey: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (cartLineKey(i) !== lineKey) return [i];
        const qty = i.quantity + delta;
        if (qty <= 0) return [];
        if (qty > i.product.stock) {
          showToast(`Stock máximo (${i.product.stock} ${i.unit ?? i.product.unit}).`, 'error');
          return [i];
        }
        return [{ ...i, quantity: qty }];
      }),
    );
  };

  const removeItem = (lineKey: string) => {
    setCart((prev) => prev.filter((i) => cartLineKey(i) !== lineKey));
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

    addSale(sale);
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
  const ventasHoy = sales.filter((s) => isToday(s.createdAt));
  const totalHoy = ventasHoy.reduce((sum, s) => sum + s.total, 0);
  const ticketPromedio = ventasHoy.length ? totalHoy / ventasHoy.length : 0;
  const piezasHoy = ventasHoy.reduce((sum, s) => sum + s.itemsSold, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Punto de Venta"
        subtitle={`Caja ${POS_REGISTER} · Terminal ${POS_TERMINAL} · Cajero: ${cashierName}`}
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              icon={<ReceiptText className="w-4 h-4" />}
              onClick={() => setShowHistory(true)}
            >
              Ventas de hoy ({ventasHoy.length})
            </Button>
            <Button variant="primary" icon={<Lock className="w-4 h-4" />} onClick={() => router.push('/ventas/corte')}>
              Corte del Día
            </Button>
          </div>
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
            ]}
          >
            {/* ─── POS ─────────────────────────────────────────────────── */}
            <TabPanel tabKey="pos">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                {/* Izquierda: elegir producto + carrito */}
                <div className="lg:col-span-3 space-y-4">
                  <ProductPicker products={PRODUCTS} onAdd={addProduct} />

                  <div className={posClasses.card}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={posClasses.sectionTitle}>Carrito</h3>
                      <span className="text-xs font-bold text-slate-400">{itemsSold} art(s)</span>
                    </div>

                    {cart.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        Elige el material, la medida y presiona Agregar.
                      </p>
                    ) : (
                      <>
                        <div>
                          {cart.map((item) => (
                            <CartItemRow
                              key={cartLineKey(item)}
                              item={item}
                              onIncrement={() => updateQty(cartLineKey(item), 1)}
                              onDecrement={() => updateQty(cartLineKey(item), -1)}
                              onRemove={() => removeItem(cartLineKey(item))}
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