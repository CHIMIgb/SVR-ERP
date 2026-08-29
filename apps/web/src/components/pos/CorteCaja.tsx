'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Clock,
  CreditCard,
  Lock,
  Printer,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalBody, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { posClasses } from './pos.styles';
import { cn } from '@/lib/utils';
import { ventasApi, TurnoConfig } from '@/lib/api';
import {
  BUSINESS_INFO,
  CASH_BILLS,
  CASH_COINS,
  CASH_DENOMINATIONS,
  formatTicketDate,
  generateClosureHtml,
  isToday,
  itemSubtotal,
  itemUnitName,
} from '@/lib/pos';
import type { POSSale } from '@/lib/pos';
import { usePOS } from '@/components/pos/POSProvider';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency } from '@svr-erp/shared/utils/currency';

interface CorteCajaProps {
  sales: POSSale[];
  cashierName: string;
  /** Retiros registrados en la sección "Retiros / Gastos" (se descuentan del arqueo). */
  retiros: Array<{ id: string; concepto: string; monto: number; fecha: string; autorizadoPor: string }>;
}

/** Configuración del turno (fallback si el backend no responde). */
const DEFAULT_TURN: TurnoConfig = {
  apertura: '07:00',
  cierre: '20:00',
  toleranciaMinutos: 30,
  formato: '24h',
};

/** "07:00" -> {h:7,m:0} */
function parseHM(s: string): { h: number; m: number } {
  const [h, m] = s.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

const GROUP_ORDER = ['efectivo', 'tarjeta', 'transferencia'] as const;
type SaleGroup = (typeof GROUP_ORDER)[number];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function groupName(group: SaleGroup): string {
  return group === 'efectivo'
    ? 'Efectivo'
    : group === 'tarjeta'
      ? 'Tarjeta'
      : 'Transferencia';
}

function paymentLabel(sale: POSSale): string {
  switch (sale.method) {
    case 'efectivo':
      return 'Efectivo';
    case 'tarjeta':
      return 'Tarjeta';
    case 'transferencia':
      return 'Transferencia';
  }
}

/**
 * Cierre de caja (replica del prototipo mobile): apertura del turno,
 * arqueo por denominaciones, cierre y ticket imprimible.
 */
export function CorteCaja({ sales, cashierName, retiros }: CorteCajaProps) {
  // Turno de caja compartido (sobrevive al navegar entre Pos y Corte)
  const { register, setRegister } = usePOS();
  const { showToast } = useToast();
  const closed = register.closed;
  const openingAmount = register.openingAmount;

  // Config real del turno (apertura/cierre 24h + tolerancia) desde el backend
  const [turnoConfig, setTurnoConfig] = useState<TurnoConfig>(DEFAULT_TURN);

  // Si el cierre del día ya existe en BD, bloquear el turno al cargar;
  // además carga la config real y registra la apertura del turno si falta.
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [cierre, config, apertura] = await Promise.all([
          ventasApi.cierreHoy(),
          ventasApi.config(),
          ventasApi.aperturaHoy(),
        ]);
        if (!activo) return;
        if (cierre.success && cierre.data.existe) {
          setRegister((prev) => ({ ...prev, closed: true }));
        }
        if (config.success) setTurnoConfig(config.data);

        if (apertura.success && apertura.data.existe && apertura.data.registro) {
          // Precargar el fondo inicial real desde la BD (sobrevive a recargas):
          // así el "Fondo inicial" del cierre aparece automático con el valor
          // registrado en aperturas_caja, aunque el cajero haya recargado.
          setRegister((prev) => ({
            ...prev,
            openingAmount: String(apertura.data.registro!.fondoInicial),
          }));
        } else if (apertura.success && !apertura.data.existe) {
          // Registrar la apertura del turno (fondo inicial actual o 0)
          await ventasApi.crearApertura({
            fondoInicial: Number(openingAmount) || 0,
          });
        }
      } catch {
        // no rompe la UI si el backend no responde
      }
    })();
    return () => {
      activo = false;
    };
    // Correr una sola vez al montar (usa setRegister/openingAmount del momento).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notas y fondo del siguiente turno
  const [notes, setNotes] = useState(register.notes);
  const [nextTurnCash, setNextTurnCash] = useState(register.nextTurnCash);

  // Arqueo por denominaciones (solo importa durante este turno)
  const [counts, setCounts] = useState<Record<number, string>>({});

  // Modal de resumen + confirmación de diferencia
  const [showSummary, setShowSummary] = useState(false);
  const [confirmDifference, setConfirmDifference] = useState(false);

  // ── Métricas del día ────────────────────────────────────────────────────
  const todaySales = useMemo(() => sales.filter((s) => isToday(s.createdAt)), [sales]);
  const totalSales = todaySales.reduce((sum, s) => sum + s.total, 0);

  const metodos = useMemo(() => {
    const resumen = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    for (const sale of todaySales) {
      if (sale.payments?.length) {
        for (const p of sale.payments) resumen[p.method] += p.amount;
      } else {
        resumen[sale.method] += sale.total;
      }
    }
    return resumen;
  }, [todaySales]);

  const salesByGroup = useMemo(() => {
    const groups: Record<SaleGroup, POSSale[]> = {
      efectivo: [],
      tarjeta: [],
      transferencia: [],
    };
    for (const sale of todaySales) {
      groups[sale.method].push(sale);
    }
    return groups;
  }, [todaySales]);

  // ── Arqueo ──────────────────────────────────────────────────────────────
  const initial = Number(openingAmount) || 0;
  const hoyIso = new Date().toISOString().split('T')[0];
  const retirosHoy = retiros.filter((r) => r.fecha === hoyIso);
  const totalRetirements = retirosHoy.reduce((sum, r) => sum + r.monto, 0);
  const expectedCash = initial + metodos.efectivo - totalRetirements;
  const counted = CASH_DENOMINATIONS.reduce((sum, d) => sum + (Number(counts[d]) || 0) * d, 0);
  const hasDifference = counted !== expectedCash;
  const difference = counted - expectedCash;

  // ── Ventana de cierre ────────────────────────────────────────────────────
  const now = new Date();
  const { h: cH, m: cM } = parseHM(turnoConfig.cierre);
  const closingStart = new Date();
  closingStart.setHours(cH, cM - turnoConfig.toleranciaMinutos, 0, 0);
  const closingEnd = new Date();
  closingEnd.setHours(cH, cM + turnoConfig.toleranciaMinutos, 0, 0);
  const allowed = now >= closingStart && now <= closingEnd;

  const hour = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // ── Acciones ─────────────────────────────────────────────────────────────
  const handleClose = async () => {
    if (!closed && (!allowed || counted <= 0)) return;
    if (hasDifference && !confirmDifference) {
      setConfirmDifference(true);
      return;
    }

    // Persistir el cierre en la BD
    const denominacionesArray = CASH_DENOMINATIONS.filter((d) => (Number(counts[d]) || 0) > 0);
    const denominaciones: Record<string, number> = {};
    for (const d of denominacionesArray) denominaciones[String(d)] = Number(counts[d]) || 0;

    try {
      const res = await ventasApi.crearCierre({
        denominaciones,
        efectivoInicial: initial,
        fondoSiguiente: Number(nextTurnCash) || 0,
        notas: notes.trim() || undefined,
      });
      if (!res.success) {
        showToast(res.error?.message ?? 'No se pudo registrar el cierre de caja.', 'error');
        return;
      }
    } catch {
      showToast('No se pudo conectar con el servidor para registrar el cierre.', 'error');
      return;
    }

    setRegister((prev) => ({
      ...prev,
      closed: true,
      notes,
      nextTurnCash,
    }));
    setShowSummary(true);
  };

  /** Inicia un nuevo corte (siguiente turno) y resetea el arqueo. */
  const handleNewCorte = () => {
    setRegister({
      openingAmount: '',
      closed: false,
      notes: '',
      nextTurnCash: '',
    });
    setNotes('');
    setNextTurnCash('');
    setCounts({});
    setConfirmDifference(false);
  };

  const handlePrint = () => {
    const groups = GROUP_ORDER.map((group) => ({
      name: groupName(group),
      count: salesByGroup[group].length,
      subtotal: salesByGroup[group].reduce((sum, s) => sum + s.total, 0),
    }));
    generateClosureHtml({
      businessInfo: BUSINESS_INFO,
      registerName: `CAJA-PV · TER-01`,
      time: hour,
      cashierName,
      salesCount: todaySales.length,
      totalSales,
      groups,
      retirements: retirosHoy.map((r) => ({
        amount: r.monto,
        reason: r.concepto,
        authorizedBy: r.autorizadoPor,
      })),
      initial,
      cashSales: metodos.efectivo,
      totalRetirements,
      expectedCash,
      counted,
      difference,
      denominations: CASH_DENOMINATIONS.filter((d) => (Number(counts[d]) || 0) > 0).map((d) => ({
        value: d,
        count: Number(counts[d]) || 0,
      })),
      nextTurnCash: Number(nextTurnCash) || 0,
      notes: notes.trim() || undefined,
    });
  };

  const countedDenominations = CASH_DENOMINATIONS.filter((d) => (Number(counts[d]) || 0) > 0);

  // ── Estado: turno cerrado (siguiente turno disponible en el horario) ─────
  if (closed) {
    return (
      <div className="max-w-xl mx-auto">
        <div className={posClasses.card}>
          <div className={cn(posClasses.alertBox, 'bg-amber-50 border-amber-200 text-amber-700')}>
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-medium">
              El turno de hoy ya cerró. El siguiente corte se habilitará en el horario de
              apertura configurado.
            </p>
          </div>
          <Button variant="secondary" className="mt-3" icon={<RefreshCw className="w-4 h-4" />} onClick={handleNewCorte}>
            Nuevo corte
          </Button>
        </div>
      </div>
    );
  }

  // ── Vista principal: cierre ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Resumen del día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={posClasses.summaryCard}>
          <Banknote className="w-5 h-5 text-green-600" />
          <span className={posClasses.summaryValue}>{formatCurrency(totalSales)}</span>
          <span className={posClasses.summaryLabel}>Total ventas</span>
        </div>
        <div className={posClasses.summaryCard}>
          <Wallet className="w-5 h-5 text-primary" />
          <span className={posClasses.summaryValue}>{formatCurrency(metodos.efectivo)}</span>
          <span className={posClasses.summaryLabel}>Efectivo</span>
        </div>
        <div className={posClasses.summaryCard}>
          <CreditCard className="w-5 h-5 text-blue-600" />
          <span className={posClasses.summaryValue}>{formatCurrency(metodos.tarjeta)}</span>
          <span className={posClasses.summaryLabel}>Tarjeta</span>
        </div>
        <div className={posClasses.summaryCard}>
          <Banknote className="w-5 h-5 text-indigo-600" />
          <span className={posClasses.summaryValue}>{formatCurrency(metodos.transferencia)}</span>
          <span className={posClasses.summaryLabel}>Transferencia</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Columna izquierda (notas): baja en mobile tras el arqueo ── */}
        <div className="space-y-4 order-2 lg:order-1">
          {/* Notas */}
          <div className={posClasses.card}>
            <h3 className={cn(posClasses.sectionTitle, 'mb-3')}>Notas del cierre</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones, incidencias, diferencias..."
              rows={4}
            />
          </div>
        </div>

        {/* ── Columna derecha (arqueo): primero en mobile ── */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Horario permitido */}
          <div className={posClasses.card}>
            <h3 className={cn(posClasses.sectionTitle, 'mb-2')}>Horario permitido</h3>
            <div className={cn(posClasses.alertBox, 'bg-blue-50 border-blue-200 text-blue-700')}>
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">
                Turno de {turnoConfig.apertura} a {turnoConfig.cierre} hrs · Cierre:{' '}
                {`${pad(closingStart.getHours())}:${pad(closingStart.getMinutes())} a ${pad(closingEnd.getHours())}:${pad(closingEnd.getMinutes())} hrs.`}
              </p>
            </div>
            {!allowed && (
              <div className={cn(posClasses.alertBox, 'bg-red-50 border-red-200 text-red-700 mt-2')}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium">
                  Ahora mismo no está permitido cerrar caja. Espera la ventana configurada.
                </p>
              </div>
            )}
          </div>

          {/* Arqueo */}
          <div className={posClasses.card}>
            <h3 className={cn(posClasses.sectionTitle, 'mb-2')}>Arqueo de efectivo</h3>
            <div className="mb-3">
              <Input
                label="Fondo inicial del turno"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="0.00"
                value={openingAmount}
                onChange={(e) =>
                  setRegister((prev) => ({ ...prev, openingAmount: e.target.value }))
                }
              />
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Efectivo esperado: {formatCurrency(expectedCash)}
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Billetes
                </p>
                <div className={cn('grid gap-1.5', 'grid-cols-3')}>
                  {CASH_BILLS.map((d) => (
                    <div key={d} className={posClasses.denomEntry}>
                      <p className={posClasses.denomLabel}>${d.toLocaleString('es-MX')}</p>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        className={posClasses.denomInput}
                        value={counts[d] ?? ''}
                        onChange={(e) => setCounts((prev) => ({ ...prev, [d]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Monedas
                </p>
                <div className={cn('grid gap-1.5', 'grid-cols-4')}>
                  {CASH_COINS.map((d) => (
                    <div key={d} className={posClasses.denomEntry}>
                      <p className={posClasses.denomLabel}>${d.toLocaleString('es-MX')}</p>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        className={posClasses.denomInput}
                        value={counts[d] ?? ''}
                        onChange={(e) => setCounts((prev) => ({ ...prev, [d]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Total contado</span>
                <span className={posClasses.resultValue}>{formatCurrency(counted)}</span>
              </div>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Efectivo esperado</span>
                <span className={posClasses.resultValue}>{formatCurrency(expectedCash)}</span>
              </div>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Diferencia</span>
                <span
                  className={cn(
                    posClasses.resultValue,
                    difference >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {difference > 0 ? '+' : ''}
                  {formatCurrency(difference)}
                  {difference > 0 ? ' · A favor' : difference < 0 ? ' · En contra' : ''}
                </span>
              </div>
            </div>

            {/* Fondo siguiente turno + cerrar */}
            <div className="mt-3">
              <Input
                label="Fondo para siguiente turno"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="0.00"
                value={nextTurnCash}
                onChange={(e) => setNextTurnCash(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              fullWidth
              className="mt-3"
              icon={<Lock className="w-4 h-4" />}
              onClick={handleClose}
              disabled={!allowed || counted <= 0}
            >
              Cerrar caja
            </Button>
            {counted <= 0 && (
              <p className="text-[11px] text-red-500 mt-2">
                Registra el conteo por denominaciones para cerrar.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirmación de diferencia en el cierre ── */}
      <Modal open={confirmDifference} onClose={() => setConfirmDifference(false)} size="md">
        <ModalHeader
          title="Diferencia en el arqueo"
          subtitle="El efectivo contado no coincide con el esperado"
        />
        <ModalBody>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-sm font-medium text-slate-500">Diferencia</p>
              <p
                className={cn(
                  'text-2xl font-black mt-1',
                  difference >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {difference > 0 ? '+' : ''}
                {formatCurrency(difference)}
                {difference > 0 ? ' · A favor' : difference < 0 ? ' · En contra' : ''}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              {difference < 0
                ? 'Hay un faltante en la caja. Asegúrate de revisar el arqueo y registra una nota antes de cerrar.'
                : 'Hay un sobrante en la caja. Revisa el arqueo y registra una nota antes de cerrar.'}
            </p>
            <label className="block">
              <span className="text-xs font-bold text-slate-500 mb-1 block">
                Nota obligatoria
              </span>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explica el motivo de la diferencia..."
                rows={3}
              />
            </label>
          </div>
        </ModalBody>
        <ModalFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDifference(false)}>
            Revisar arqueo
          </Button>
          <Button
            variant="primary"
            onClick={handleClose}
            disabled={!notes.trim()}
          >
            Confirmar y cerrar
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal resumen del cierre ── */}
      <Modal open={showSummary} onClose={() => setShowSummary(false)} size="lg">
        <ModalHeader
          title="Cierre de caja registrado"
          subtitle={`CAJA-PV · ${hour} hrs · ${cashierName}`}
        />
        <ModalBody>
          <div className="max-h-[60vh] overflow-y-auto scrollbar-none space-y-4">
            <div className={cn(posClasses.alertBox, 'bg-amber-50 border-amber-200 text-amber-700')}>
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">
                Pendiente de aprobación del Administrador.
              </p>
            </div>

            {/* Ventas por grupo */}
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2">
                Ventas del día
              </p>
              <div className="space-y-2">
                {GROUP_ORDER.map((group) => {
                  const grupo = salesByGroup[group];
                  const subtotal = grupo.reduce((sum, s) => sum + s.total, 0);
                  return (
                    <div key={group} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">
                          {groupName(group)} · {grupo.length} venta{grupo.length !== 1 ? 's' : ''}
                        </span>
                        <span className="font-black text-slate-900">{formatCurrency(subtotal)}</span>
                      </div>
                      {grupo.length === 0 ? (
                        <p className={posClasses.historyMeta}>Sin ventas en {groupName(group).toLowerCase()}.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {grupo.map((sale) => {
                            const { time } = formatTicketDate(sale.createdAt);
                            return (
                              <div key={sale.id} className="bg-slate-50 rounded-lg p-2">
                                <div className="flex justify-between">
                                  <span className="text-xs font-black text-primary">
                                    {sale.ticketNumber} · {time}
                                  </span>
                                  <span className="text-xs font-black text-slate-800">
                                    {formatCurrency(sale.total)}
                                  </span>
                                </div>
                                <p className={posClasses.historyMeta}>
                                  {sale.customer || 'Público en general'} · Pago:{' '}
                                  {paymentLabel(sale)}
                                  {sale.discountPct ? ` · −${sale.discountPct}%` : ''}
                                </p>
                                {sale.items.map((item, index) => (
                                  <div
                                    key={`${sale.id}-${item.product.id}-${index}`}
                                    className="flex justify-between text-[11px] text-slate-600 pl-2"
                                  >
                                    <span>
                                      {item.quantity} × {item.product.name} ({itemUnitName(item)})
                                    </span>
                                    <span>{formatCurrency(itemSubtotal(item))}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retiros del turno */}
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2">
                Retiros del turno
              </p>
              {retirosHoy.length === 0 ? (
                <p className={posClasses.historyMeta}>Sin retiros registrados.</p>
              ) : (
                retirosHoy.map((r) => (
                  <p key={r.id} className={posClasses.historyMeta}>
                    −{formatCurrency(r.monto)} · {r.concepto} · Autorizado por {r.autorizadoPor}
                  </p>
                ))
              )}
            </div>

            {/* Arqueo */}
            <div className="rounded-lg border border-slate-100 p-3 space-y-1">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2">
                Arqueo de efectivo
              </p>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Efectivo inicial</span>
                <span className={posClasses.resultValue}>{formatCurrency(initial)}</span>
              </div>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Ventas en efectivo</span>
                <span className={posClasses.resultValue}>{formatCurrency(metodos.efectivo)}</span>
              </div>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Retiros (−)</span>
                <span className={posClasses.resultValue}>−{formatCurrency(totalRetirements)}</span>
              </div>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Efectivo esperado</span>
                <span className={posClasses.resultValue}>{formatCurrency(expectedCash)}</span>
              </div>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Efectivo contado</span>
                <span className={posClasses.resultValue}>{formatCurrency(counted)}</span>
              </div>
              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Diferencia</span>
                <span
                  className={cn(
                    posClasses.resultValue,
                    difference >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {difference > 0 ? '+' : ''}
                  {formatCurrency(difference)}
                  {difference > 0 ? ' · A favor' : difference < 0 ? ' · En contra' : ''}
                </span>
              </div>

              <p className="text-xs font-black text-slate-500 uppercase tracking-wide pt-2">
                Billetes y monedas contados
              </p>
              {countedDenominations.length === 0 ? (
                <p className={posClasses.historyMeta}>Sin denominaciones registradas.</p>
              ) : (
                countedDenominations.map((d) => (
                  <div key={d} className={posClasses.resultRow}>
                    <span className={posClasses.resultLabel}>
                      {Number(counts[d])} × ${d.toLocaleString('es-MX')}
                    </span>
                    <span className={posClasses.resultValue}>
                      {formatCurrency((Number(counts[d]) || 0) * d)}
                    </span>
                  </div>
                ))
              )}

              <div className={posClasses.resultRow}>
                <span className={posClasses.resultLabel}>Fondo para el siguiente turno</span>
                <span className={posClasses.resultValue}>
                  {formatCurrency(Number(nextTurnCash) || 0)}
                </span>
              </div>
              {notes.trim() && (
                <p className="text-xs text-slate-500 pt-1">
                  <strong>Observaciones:</strong> {notes}
                </p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowSummary(false)}>
            Entendido
          </Button>
          <Button variant="primary" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Imprimir / Guardar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}