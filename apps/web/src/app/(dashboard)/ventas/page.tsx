"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  ReceiptText,
  ShoppingCart,
  ArrowDownCircle,
  Trash2,
  Banknote,
  RefreshCw,
  Clock,
  UserRound,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal, ModalField, modalInputClass } from '@/components/ui/Modal';
import { useToast } from '@/components/layout/Toast';
import { useAuth } from '@/hooks/useAuth';
import { clientesApi, type ClienteDTO } from '@/lib/api';

import { ProductPicker } from '@/components/pos/ProductPicker';
import { CartItemRow } from '@/components/pos/CartItemRow';
import { PaymentPanel } from '@/components/pos/PaymentPanel';
import { TicketPreview } from '@/components/pos/TicketPreview';
import { SalesHistoryModal } from '@/components/pos/SalesHistoryModal';
import { posClasses } from '@/components/pos/pos.styles';
import { usePOS, type Retiro } from '@/components/pos/POSProvider';

import {
  BUSINESS_INFO,
  POS_REGISTER,
  POS_TERMINAL,
  calculateTotal,
  cartLineKey,
  isToday,
  printTicket,
  productUnitPrice,
} from '@/lib/pos';
import {
  materialToProduct,
  ventaDtoToSale,
  ventasApi,
  type TurnoConfig,
} from '@/lib/api';
import type { CreateVentaInput } from '@/lib/api';
import { generateUUID } from '@/lib/utils';
import type { CartItem, Payment, PaymentMethod, POSSale, Product } from '@/lib/pos';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { mensajeErrorApi } from '@/lib/api';

function parseHM(s: string): { h: number; m: number } {
  const [h, m] = s.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VentasPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const vistaVentas = user?.vistas.find((v) => v.ruta === '/ventas');
  const puedeCrear = vistaVentas?.puedeCrear ?? false;
  const cashierName = user?.persona && user.persona.nombre
    ? `${user.persona.nombre} ${user.persona.apellidoPaterno ?? ''}`.trim()
    : 'Cajero';

  // Catálogo de materiales desde el backend. No hay fallback a mock:
  // el POS queda bloqueado hasta que cargue el catálogo real.
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogoCargado, setCatalogoCargado] = useState(false);

  // Horario de atención (se carga desde BD)
  const [turnoConfig, setTurnoConfig] = useState<TurnoConfig | null>(null);
  const [fueraDeHorario, setFueraDeHorario] = useState(false);

  // Carrito (local) + ventas/retiros/turno (compartidos con /ventas/corte)
  const { sales, retiros, setRetiros, addSale } = usePOS();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cargar catálogo BD + ventas/retiros del día (una vez al montar; reintento manual)
  const precargado = useRef(false);
  const [catalogoError, setCatalogoError] = useState(false);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCatalogoError(false);
    setCargandoCatalogo(true);
    try {
      // Cargar config de turno + catálogo en paralelo
      const [resConfig, res] = await Promise.all([
        ventasApi.config(),
        ventasApi.catalogos(),
      ]);
      if (resConfig.success) {
        const config = resConfig.data;
        setTurnoConfig(config);

        // Verificar fuera de horario con el valor recién obtenido (evita closure obsoleto)
        // Diseño: turnos nocturnos (apertura > cierre) no tienen ventana de ventas
        const now = new Date();
        const { h: aH, m: aM } = parseHM(config.apertura);
        const { h: cH, m: cM } = parseHM(config.cierre);
        const apertura = new Date();
        apertura.setHours(aH, aM, 0, 0);
        const cierre = new Date();
        cierre.setHours(cH, cM, 0, 0);
        // Nocturno: apertura > cierre → siempre fuera de ventana de ventas
        const esNocturno = apertura > cierre;
        const fuera = !esNocturno && (now < apertura || now > cierre);
        setFueraDeHorario(fuera);
      }

      if (res.success && res.data.materiales.length > 0) {
        const productos = res.data.materiales.map(materialToProduct);
        setProducts(productos);
        setCatalogoCargado(true);

        // Historial del día desde la BD (para el modal y el corte)
        const hoy = await ventasApi.hoy();
        if (hoy.success) {
          const ventas = hoy.data.ventas
            .map((v) => ventaDtoToSale(v, productos))
            .reverse(); // addSale prepende; invertimos para que quede: más reciente primero
          for (const venta of ventas) addSale(venta);
        }
      } else {
        setCatalogoError(true);
      }
    } catch {
      // sin catálogo BD: el POS queda bloqueado para no reenviar IDs mock inválidos
      setCatalogoError(true);
    }

    try {
      const resRetiros = await ventasApi.retiros();
      if (resRetiros.success) {
        setRetiros(
          resRetiros.data.items.map((r) => ({
            id: r.id,
            concepto: r.concepto,
            monto: r.monto,
            fecha: r.fecha,
            hora: r.hora,
            autorizadoPor: r.autorizadoPor,
          })),
        );
      }
    } catch {
      // no rompe la UI si el backend no responde
    }
    setCargandoCatalogo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (precargado.current) return;
    precargado.current = true;
    cargarDatos();
  }, [cargarDatos]);

  // Modales del POS
  const [lastSale, setLastSale] = useState<POSSale | null>(null);
  const [viewSale, setViewSale] = useState<POSSale | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [modalRetiro, setModalRetiro] = useState(false);
  const [formRetiro, setFormRetiro] = useState({ concepto: '', monto: '', autorizadoPor: '' });

  // ── Cliente de la venta (B3: catálogo real, null = Público en general) ──
  const [clientesPos, setClientesPos] = useState<ClienteDTO[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [modalCliente, setModalCliente] = useState(false);
  const [formCliente, setFormCliente] = useState({ nombre: '', empresa: '', telefono: '', correo: '' });
  const [creandoCliente, setCreandoCliente] = useState(false);

  useEffect(() => {
    clientesApi.listar({ limit: 100 }).then((res) => {
      if (res.success && res.data) setClientesPos(res.data.items);
    });
  }, []);

  const total = useMemo(() => calculateTotal(cart), [cart]);
  const itemsSold = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // ── Carrito ──────────────────────────────────────────────────────────────
  // Devuelve false si supera el stock (con toast inmediato) para que el
  // ProductPicker borre el input de cantidad.
  const addProduct = (product: Product, unit: string, quantity: number): boolean => {
    const qty = Math.floor(Math.max(1, quantity));
    const lineKey = `${product.id}:${unit}`;
    const enCarrito = cart.find((i) => cartLineKey(i) === lineKey)?.quantity ?? 0;
    if (enCarrito + qty > product.stock) {
      showToast(`Stock máximo (${product.stock} ${unit}).`, 'error');
      return false;
    }
    setCart((prev) => {
      const existing = prev.find((i) => cartLineKey(i) === lineKey);
      if (existing) {
        // Defensa extra contra doble-click: el precheck de arriba ya validó.
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
    return true;
  };

  /** Cantidad ya en carrito de un material+medida (validación al teclear). */
  const enCarritoDe = useCallback(
    (materialId: string, unit: string) =>
      cart.find((i) => cartLineKey(i) === `${materialId}:${unit}`)?.quantity ?? 0,
    [cart],
  );

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
  // Alta rápida de cliente (B3): crea en el catálogo y lo deja seleccionado.
  const handleCrearCliente = useCallback(async () => {
    if (!formCliente.nombre.trim() || !formCliente.correo.trim() || !formCliente.telefono.trim()) {
      showToast('Nombre, teléfono y correo son obligatorios.', 'error');
      return;
    }
    setCreandoCliente(true);
    try {
      const res = await clientesApi.crear({
        nombre: formCliente.nombre.trim(),
        empresa: formCliente.empresa.trim() || undefined,
        telefono: formCliente.telefono.trim(),
        correo: formCliente.correo.trim(),
      });
      if (res.success) {        setClientesPos((prev) => [...prev, res.data]);
        setClienteId(res.data.id);
        setModalCliente(false);
        setFormCliente({ nombre: '', empresa: '', telefono: '', correo: '' });
        showToast(`Cliente "${res.data.empresa || res.data.nombre}" creado y seleccionado.`, 'success');
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo crear el cliente.'), 'error');
      }
    } catch {
      showToast('Error de conexión al crear el cliente.', 'error');
    } finally {
      setCreandoCliente(false);
    }
  }, [formCliente, showToast]);

  // Guard anti doble-submit: evita insertar la venta más de una vez si el
  // botón "Cobrar" se presiona repetido mientras el request está en vuelo.
  const cobrando = useRef(false);
  const handlePay = async (
    payments: Payment[],
    method: PaymentMethod,
    cashReceived: number | undefined,
    change: number | undefined,
  ) => {
    if (cart.length === 0 || cobrando.current) return;
    if (!catalogoCargado) {
      showToast('Espera a que cargue el catálogo para poder cobrar.', 'error');
      return;
    }
    cobrando.current = true;

    const payload: CreateVentaInput = {
      cajero: cashierName,
      ...(clienteId ? { clienteId } : {}),
      terminal: POS_TERMINAL,
      caja: POS_REGISTER,
      idempotenciaKey: generateUUID(),
      items: cart.map((i) => ({
        materialId: i.product.id,
        medida: i.unit ?? i.product.unit,
        cantidad: i.quantity,
        precioUnitario: i.priceOverride ?? productUnitPrice(i.product, i.unit ?? i.product.unit),
      })),
      pagos: payments.map((p) => ({ metodo: p.method, monto: p.amount })),
      metodo: method,
      efectivoRecibido: cashReceived,
      cambio: change,
    };

    try {
      const res = await ventasApi.crear(payload);
      if (!res.success) {
        showToast(mensajeErrorApi(res.error, 'No se pudo registrar la venta.'), 'error');
        return;
      }
      const sale = ventaDtoToSale(res.data, products);
      addSale(sale);
      setCart([]);
      setLastSale(sale);
    } catch {
      showToast('No se pudo conectar con el servidor para registrar la venta.', 'error');
    } finally {
      cobrando.current = false;
    }
  };
  // ── Retiros ───────────────────────────────────────────────────────────────
  const handleRetiro = async () => {
    const monto = parseFloat(formRetiro.monto);
    if (!formRetiro.concepto.trim() || !monto || monto <= 0) {
      showToast('Concepto y monto son obligatorios.', 'error');
      return;
    }
    const autorizadoPor = formRetiro.autorizadoPor.trim() || 'Sin especificar';

    try {
      const res = await ventasApi.crearRetiro({
        concepto: formRetiro.concepto.trim(),
        monto,
        autorizadoPor,
      });
      if (!res.success) {
        showToast(mensajeErrorApi(res.error, 'No se pudo registrar el retiro.'), 'error');
        return;
      }
      const nuevo: Retiro = {
        id: res.data.id,
        concepto: res.data.concepto,
        monto: res.data.monto,
        fecha: res.data.fecha,
        hora: res.data.hora,
        autorizadoPor: res.data.autorizadoPor,
      };
      setRetiros((prev) => [nuevo, ...prev]);
      setModalRetiro(false);
      setFormRetiro({ concepto: '', monto: '', autorizadoPor: '' });
      showToast(`Retiro de ${formatCurrency(monto)} registrado.`, 'success');
    } catch {
      showToast('No se pudo conectar con el servidor para registrar el retiro.', 'error');
    }
  };

  // ── Métricas del día ──────────────────────────────────────────────────────
  const ventasHoy = sales.filter((s) => isToday(s.createdAt));
  const totalHoy = ventasHoy.reduce((sum, s) => sum + s.total, 0);
  const hoyIso = new Date().toISOString().split('T')[0];
  const retirosHoy = retiros.filter((r) => r.fecha === hoyIso);
  const totalRetirosHoy = retirosHoy.reduce((sum, r) => sum + r.monto, 0);
  // Ingresos del día netos: se descuentan los retiros/gastos del turno (efectivo).
  const ingresosNetos = totalHoy - totalRetirosHoy;
  const ticketPromedio = ventasHoy.length ? ingresosNetos / ventasHoy.length : 0;
  const piezasHoy = ventasHoy.reduce((sum, s) => sum + s.itemsSold, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Punto de Venta"
        subtitle={`Caja ${POS_REGISTER} · Terminal ${POS_TERMINAL} · Cajero: ${cashierName}`}
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              skeleton={cargandoCatalogo}
              variant="secondary"
              icon={<ReceiptText className="w-4 h-4" />}
              onClick={() => setShowHistory(true)}
            >
              Ventas de hoy ({ventasHoy.length})
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
          {/* Bloqueo por horario fuera de atención */}
          {fueraDeHorario && turnoConfig && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-red-900 font-bold text-lg">Fuera de horario de atención</p>
                  <p className="text-red-700 text-sm font-medium mt-1">
                    El turno es de <strong>{turnoConfig.apertura}</strong> a <strong>{turnoConfig.cierre}</strong> hrs.
                    El punto de venta solo está disponible dentro de este horario.
                  </p>
                </div>
              </div>
              <div className="text-xs text-red-600 font-medium shrink-0">
                Hora actual: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          {/* Stats del día */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              icon={<ShoppingCart className="w-5 h-5" />}
              value={ventasHoy.length}
              label="Ventas de hoy"
              color="primary"
              loading={cargandoCatalogo}
            />
            <StatsCard
              icon={<Banknote className="w-5 h-5" />}
              value={formatCurrency(ingresosNetos)}
              label="Ingresos del día (netos)"
              color="success"
              loading={cargandoCatalogo}
            />
            <StatsCard
              icon={<ReceiptText className="w-5 h-5" />}
              value={formatCurrency(ticketPromedio)}
              label="Ticket promedio"
              color="info"
              loading={cargandoCatalogo}
            />
            <StatsCard
              icon={<Plus className="w-5 h-5" />}
              value={piezasHoy}
              label="Artículos vendidos"
              color="warning"
              loading={cargandoCatalogo}
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
                  {!catalogoCargado && !catalogoError && (
                    <div className={posClasses.card}>
                      <Skeleton variant="card" />
                    </div>
                  )}
                  {!catalogoCargado && catalogoError && (
                    <div className={posClasses.card}>
                      <p className="text-sm text-red-600 mb-3">
                        No se pudo cargar el catálogo de materiales. Verifica que la API esté
                        corriendo y reintenta.
                      </p>
                      <Button
                        variant="primary"
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={() => cargarDatos()}
                        disabled={cargandoCatalogo}
                      >
                        {cargandoCatalogo ? 'Cargando...' : 'Reintentar'}
                      </Button>
                    </div>
                  )}
                  {catalogoCargado && (
                    <ProductPicker
                      products={products}
                      onAdd={addProduct}
                      enCarritoDe={enCarritoDe}
                    />
                  )}

                  <div className={posClasses.card}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={posClasses.sectionTitle}>Carrito</h3>
                      <span className="text-xs font-bold text-ui-400">{itemsSold} art(s)</span>
                    </div>

                    {/* Cliente de la venta (Público en general si no se elige) */}
                    <div className="flex items-center gap-2 mb-3">
                      <UserRound className="w-4 h-4 text-ui-400 shrink-0" />
                      <select
                        className="h-10 flex-1 min-w-0 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        aria-label="Cliente de la venta"
                      >
                        <option value="">Público en general</option>
                        {clientesPos.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.empresa || c.nombre}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setModalCliente(true)}
                      >
                        Nuevo
                      </Button>
                    </div>

                    {cart.length === 0 ? (
                      <p className="text-sm text-ui-400 text-center py-8">
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

                        <div className="mt-3 pt-3 border-t border-ui-100 flex items-center justify-between">
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
                    disabled={cart.length === 0 || !catalogoCargado}
                    onPay={handlePay}
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
                            <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                              <ArrowDownCircle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-ui-800 text-sm truncate">{r.concepto}</p>
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

      {lastSale && (
        <TicketPreview sale={lastSale} businessInfo={BUSINESS_INFO} onClose={() => setLastSale(null)} />
      )}

      {viewSale && (
        <TicketPreview sale={viewSale} businessInfo={BUSINESS_INFO} onClose={() => setViewSale(null)} />
      )}

      <SalesHistoryModal
        sales={sales}
        onClose={() => setShowHistory(false)}
        onReprint={(sale) => printTicket(sale, BUSINESS_INFO)}
        onView={(sale) => setViewSale(sale)}
        open={showHistory}
      />

      <FormModal
        open={modalRetiro}
        onClose={() => setModalRetiro(false)}
        onSubmit={handleRetiro}
        title="Retiro de Efectivo"
        submitLabel="Registrar Retiro"
      >
        <ModalField label="Concepto *" required>
          <input
            className={modalInputClass}
            placeholder="Ej: Gasolina, refacción urgente..."
            value={formRetiro.concepto}
            onChange={(e) => setFormRetiro({ ...formRetiro, concepto: e.target.value })}
          />
        </ModalField>
        <ModalField label="Monto (MXN) *" required>
          <input
            type="number"
            className={modalInputClass}
            placeholder="0.00"
            value={formRetiro.monto}
            onChange={(e) => setFormRetiro({ ...formRetiro, monto: e.target.value })}
          />
        </ModalField>
        <ModalField label="Autorizado por">
          <input
            className={modalInputClass}
            placeholder="Gerencia / Jefe de Patio"
            value={formRetiro.autorizadoPor}
            onChange={(e) => setFormRetiro({ ...formRetiro, autorizadoPor: e.target.value })}
          />
        </ModalField>
      </FormModal>

      {/* Alta rápida de cliente desde el POS (B3) */}
      <FormModal
        open={modalCliente}
        onClose={() => setModalCliente(false)}
        onSubmit={handleCrearCliente}
        title="Nuevo Cliente"
        subtitle="Alta rápida sin salir del punto de venta."
        submitLabel="Crear Cliente"
        isSubmitting={creandoCliente}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre" required>
            <input
              className={modalInputClass}
              placeholder="Nombre de contacto"
              value={formCliente.nombre}
              onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
            />
          </ModalField>
          <ModalField label="Empresa (opcional)">
            <input
              className={modalInputClass}
              placeholder="Solo si tiene empresa"
              value={formCliente.empresa}
              onChange={(e) => setFormCliente({ ...formCliente, empresa: e.target.value })}
            />
          </ModalField>
          <ModalField label="Teléfono" required>
            <input
              className={modalInputClass}
              placeholder="Ej: 322-123-4567"
              value={formCliente.telefono}
              onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
            />
          </ModalField>
          <ModalField label="Correo" required>
            <input
              className={modalInputClass}
              placeholder="correo@ejemplo.com"
              value={formCliente.correo}
              onChange={(e) => setFormCliente({ ...formCliente, correo: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>
    </div>
  );
}