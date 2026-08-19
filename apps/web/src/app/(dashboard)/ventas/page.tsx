"use client";

import React, { useState } from 'react';
import {
  Plus, Search, ShoppingCart, DollarSign, TrendingDown,
  ArrowDownCircle, CheckCircle2, Clock, X,
  CreditCard, Banknote, ReceiptText, CalendarDays, AlertCircle
} from 'lucide-react';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type MetodoPago = 'Contado' | 'Crédito';
type EstadoVenta = 'Cobrada' | 'Pendiente' | 'Abonada';

interface VentaContado {
  id: string;
  folio: string;
  cliente: string;
  tipoMaterial: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fecha: string;
  hora: string;
  metodoPago: MetodoPago;
  estado: EstadoVenta;
  pagado: number;
  operador: string;
}

interface RetiroEfectivo {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  hora: string;
  autorizadoPor: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ventasIniciales: VentaContado[] = [
  { id: 'V001', folio: 'F-0001', cliente: 'Constructora Omega', tipoMaterial: 'Arena de río', unidad: 'm³', cantidad: 15, precioUnitario: 350, total: 5250, fecha: '2026-08-15', hora: '08:30 AM', metodoPago: 'Contado', estado: 'Cobrada', pagado: 5250, operador: 'Ana Martínez' },
  { id: 'V002', folio: 'F-0002', cliente: 'Ing. Roberto Vega', tipoMaterial: 'Grava 3/4"', unidad: 'm³', cantidad: 8, precioUnitario: 420, total: 3360, fecha: '2026-08-15', hora: '10:15 AM', metodoPago: 'Crédito', estado: 'Pendiente', pagado: 0, operador: 'Ana Martínez' },
  { id: 'V003', folio: 'F-0003', cliente: 'Ferretera del Norte', tipoMaterial: 'Criba fina', unidad: 'm³', cantidad: 20, precioUnitario: 280, total: 5600, fecha: '2026-08-14', hora: '14:00 PM', metodoPago: 'Crédito', estado: 'Abonada', pagado: 2800, operador: 'Ana Martínez' },
  { id: 'V004', folio: 'F-0004', cliente: 'Almacenes Roca', tipoMaterial: 'Tezontle', unidad: 'm³', cantidad: 5, precioUnitario: 500, total: 2500, fecha: '2026-08-14', hora: '09:00 AM', metodoPago: 'Contado', estado: 'Cobrada', pagado: 2500, operador: 'Ana Martínez' },
];

const retirosIniciales: RetiroEfectivo[] = [
  { id: 'R001', concepto: 'Gasolina camioneta de reparto', monto: 800, fecha: '2026-08-15', hora: '07:00 AM', autorizadoPor: 'Gerencia' },
  { id: 'R002', concepto: 'Refacción urgente manguera', monto: 350, fecha: '2026-08-15', hora: '11:30 AM', autorizadoPor: 'Jefe de Patio' },
  { id: 'R003', concepto: 'Comida personal de obra', monto: 600, fecha: '2026-08-14', hora: '13:00 PM', autorizadoPor: 'Gerencia' },
];

const tiposMaterial = ['Arena de río', 'Grava 3/4"', 'Grava 1/2"', 'Criba fina', 'Criba gruesa', 'Tezontle', 'Tepetate', 'Milpa'];
const unidades = ['m³', 'Tonelada', 'Viaje', 'Pieza'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const estadoColor: Record<EstadoVenta, string> = {
  Cobrada: 'bg-green-100 text-green-700',
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Abonada: 'bg-blue-100 text-blue-700',
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function VentasPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'ventas' | 'retiros' | 'corte'>('ventas');
  const [ventas, setVentas] = useState<VentaContado[]>(ventasIniciales);
  const [retiros, setRetiros] = useState<RetiroEfectivo[]>(retirosIniciales);
  const [search, setSearch] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);

  // Modals
  const [modalVenta, setModalVenta] = useState(false);
  const [modalRetiro, setModalRetiro] = useState(false);
  const [modalAbono, setModalAbono] = useState<VentaContado | null>(null);
  const [montoAbono, setMontoAbono] = useState('');

  const [formVenta, setFormVenta] = useState({
    cliente: '', tipoMaterial: 'Arena de río', unidad: 'm³',
    cantidad: '', precioUnitario: '', metodoPago: 'Contado', operador: 'Ana Martínez',
  });
  const [formRetiro, setFormRetiro] = useState({ concepto: '', monto: '', autorizadoPor: '' });

  // Stats del día
  const hoy = new Date().toISOString().split('T')[0];
  const ventasHoy = ventas.filter(v => v.fecha === hoy);
  const ingresosBrutos = ventasHoy.reduce((a, v) => a + v.total, 0);
  const cobradoHoy = ventasHoy.filter(v => v.estado === 'Cobrada').reduce((a, v) => a + v.pagado, 0);
  const totalRetiros = retiros.filter(r => r.fecha === hoy).reduce((a, r) => a + r.monto, 0);
  const cajaFinal = cobradoHoy - totalRetiros;
  const pendienteCobro = ventas.filter(v => v.estado !== 'Cobrada').reduce((a, v) => a + (v.total - v.pagado), 0);

  const ventasFiltradas = ventas.filter(v => {
    const matchSearch = v.cliente.toLowerCase().includes(search.toLowerCase()) ||
      v.tipoMaterial.toLowerCase().includes(search.toLowerCase()) ||
      v.folio.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleNuevaVenta = () => {
    if (!formVenta.cliente.trim() || !formVenta.cantidad || !formVenta.precioUnitario) {
      showToast('Cliente, cantidad y precio son obligatorios.', 'error');
      return;
    }
    const cantidad = parseFloat(formVenta.cantidad);
    const precio = parseFloat(formVenta.precioUnitario);
    const total = cantidad * precio;
    const folio = `F-${String(ventas.length + 1).padStart(4, '0')}`;
    const ahora = new Date();
    const nueva: VentaContado = {
      id: `V${Date.now()}`,
      folio,
      cliente: formVenta.cliente,
      tipoMaterial: formVenta.tipoMaterial,
      unidad: formVenta.unidad,
      cantidad,
      precioUnitario: precio,
      total,
      fecha: ahora.toISOString().split('T')[0],
      hora: ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      metodoPago: formVenta.metodoPago as MetodoPago,
      estado: formVenta.metodoPago === 'Contado' ? 'Cobrada' : 'Pendiente',
      pagado: formVenta.metodoPago === 'Contado' ? total : 0,
      operador: formVenta.operador,
    };
    setVentas(prev => [nueva, ...prev]);
    setModalVenta(false);
    setFormVenta({ cliente: '', tipoMaterial: 'Arena de río', unidad: 'm³', cantidad: '', precioUnitario: '', metodoPago: 'Contado', operador: 'Ana Martínez' });
    showToast(`✅ Venta ${folio} registrada — ${fmt(total)}`, 'success');
  };

  const handleRetiro = () => {
    if (!formRetiro.concepto.trim() || !formRetiro.monto) {
      showToast('Concepto y monto son obligatorios.', 'error');
      return;
    }
    const ahora = new Date();
    const nuevo: RetiroEfectivo = {
      id: `R${Date.now()}`,
      concepto: formRetiro.concepto,
      monto: parseFloat(formRetiro.monto),
      fecha: ahora.toISOString().split('T')[0],
      hora: ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      autorizadoPor: formRetiro.autorizadoPor || 'Sin especificar',
    };
    setRetiros(prev => [nuevo, ...prev]);
    setModalRetiro(false);
    setFormRetiro({ concepto: '', monto: '', autorizadoPor: '' });
    showToast(`✅ Retiro de ${fmt(nuevo.monto)} registrado.`, 'success');
  };

  const handleAbono = () => {
    if (!modalAbono) return;
    const abono = parseFloat(montoAbono);
    if (!abono || abono <= 0) { showToast('Monto inválido.', 'error'); return; }
    const pendiente = modalAbono.total - modalAbono.pagado;
    if (abono > pendiente) { showToast(`Máximo ${fmt(pendiente)}`, 'error'); return; }
    setVentas(prev => prev.map(v => {
      if (v.id !== modalAbono.id) return v;
      const nuevoPagado = v.pagado + abono;
      return { ...v, pagado: nuevoPagado, estado: nuevoPagado >= v.total ? 'Cobrada' : 'Abonada' };
    }));
    setMontoAbono('');
    setModalAbono(null);
    showToast(`✅ Abono de ${fmt(abono)} registrado.`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Punto de Venta</h1>
          <p className="text-slate-500 font-medium">Ventas de contado y crédito · Caja chica · Corte del día</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={() => setModalVenta(true)}>
            <Plus className="w-4 h-4" /> Nueva Venta
          </button>
          <button
            onClick={() => setModalRetiro(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 font-bold text-sm hover:bg-red-100 transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" /> Retiro
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-green-500 py-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cobrado Hoy</p>
          <h4 className="text-xl font-black text-green-600">{fmt(cobradoHoy)}</h4>
        </div>
        <div className="card border-l-4 border-l-red-400 py-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Retiros Hoy</p>
          <h4 className="text-xl font-black text-red-500">{fmt(totalRetiros)}</h4>
        </div>
        <div className="card border-l-4 border-l-primary py-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Caja Final</p>
          <h4 className={`text-xl font-black ${cajaFinal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{fmt(cajaFinal)}</h4>
        </div>
        <div className="card border-l-4 border-l-yellow-400 py-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Por Cobrar</p>
          <h4 className="text-xl font-black text-yellow-600">{fmt(pendienteCobro)}</h4>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['ventas', 'retiros', 'corte'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'corte' ? 'Corte del Día' : t === 'retiros' ? 'Retiros / Gastos' : 'Ventas'}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab === 'ventas' && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por folio, cliente o material..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
          />
        </div>
      )}

      {/* ─── VENTAS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'ventas' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cant.</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pago</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ventasFiltradas.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-primary text-xs">{v.folio}</p>
                      <p className="text-[10px] text-slate-400">{v.fecha} · {v.hora}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-xs">{v.cliente}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700 text-xs">{v.tipoMaterial}</p>
                      <p className="text-[10px] text-slate-400">{v.cantidad} {v.unidad} × {fmt(v.precioUnitario)}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{v.cantidad} {v.unidad}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{fmt(v.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${v.metodoPago === 'Contado' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                        {v.metodoPago === 'Contado' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        {v.metodoPago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${estadoColor[v.estado]}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {v.estado !== 'Cobrada' && (
                        <button
                          onClick={() => setModalAbono(v)}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 whitespace-nowrap"
                        >
                          <DollarSign className="w-3 h-3" /> Abonar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── RETIROS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'retiros' && (
        <div className="space-y-3">
          {retiros.map(r => (
            <div key={r.id} className="card flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{r.concepto}</p>
                  <p className="text-[10px] text-slate-400">{r.fecha} · {r.hora} · Autorizado por: <span className="font-bold">{r.autorizadoPor}</span></p>
                </div>
              </div>
              <span className="font-black text-red-500 text-lg">{fmt(r.monto)}</span>
            </div>
          ))}
          {retiros.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-medium">Sin retiros registrados.</div>
          )}
        </div>
      )}

      {/* ─── CORTE DEL DÍA TAB ───────────────────────────────────────────────── */}
      {tab === 'corte' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <label className="font-bold text-slate-700 text-sm">Fecha del corte</label>
            <input type="date" className={`${inputClass} w-auto`} value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} />
          </div>

          {(() => {
            const vFecha = ventas.filter(v => v.fecha === fechaFiltro);
            const rFecha = retiros.filter(r => r.fecha === fechaFiltro);
            const cobrado = vFecha.filter(v => v.estado === 'Cobrada').reduce((a, v) => a + v.pagado, 0);
            const abonos = vFecha.filter(v => v.estado === 'Abonada').reduce((a, v) => a + v.pagado, 0);
            const retirado = rFecha.reduce((a, r) => a + r.monto, 0);
            const caja = cobrado + abonos - retirado;

            return (
              <>
                <div className="card">
                  <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                    <ReceiptText className="w-5 h-5 text-primary" /> Resumen del Corte
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium text-sm">Ventas registradas</span>
                      <span className="font-black text-slate-900">{vFecha.length}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium text-sm">Ingresos totales (bruto)</span>
                      <span className="font-black text-slate-900">{fmt(vFecha.reduce((a, v) => a + v.total, 0))}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-green-600 font-medium text-sm">Ventas contado cobradas</span>
                      <span className="font-black text-green-600">{fmt(cobrado)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-blue-600 font-medium text-sm">Abonos recibidos</span>
                      <span className="font-black text-blue-600">{fmt(abonos)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-red-500 font-medium text-sm">Retiros de efectivo</span>
                      <span className="font-black text-red-500">- {fmt(retirado)}</span>
                    </div>
                    <div className="flex justify-between py-3 bg-slate-900 rounded-xl px-4 mt-2">
                      <span className="text-white font-black text-sm">EFECTIVO EN CAJA</span>
                      <span className={`font-black text-xl ${caja >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(caja)}</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-black text-slate-700 mb-3 text-sm">Detalle de Ventas</h3>
                  <div className="space-y-2">
                    {vFecha.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin ventas en esta fecha.</p>}
                    {vFecha.map(v => (
                      <div key={v.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 text-sm">
                        <div>
                          <span className="font-black text-primary text-xs">{v.folio}</span>
                          <span className="text-slate-600 font-medium ml-2 text-xs">{v.cliente}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900">{fmt(v.total)}</span>
                          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${estadoColor[v.estado]}`}>{v.estado}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ─── Modal Nueva Venta ────────────────────────────────────────────────── */}
      <Modal isOpen={modalVenta} onClose={() => setModalVenta(false)} onConfirm={handleNuevaVenta} title="Nueva Venta" confirmLabel="Registrar Venta">
        <ModalField label="Cliente *">
          <input className={inputClass} placeholder="Nombre o empresa" value={formVenta.cliente} onChange={e => setFormVenta({ ...formVenta, cliente: e.target.value })} />
        </ModalField>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Tipo de Material *">
            <select className={selectClass} value={formVenta.tipoMaterial} onChange={e => setFormVenta({ ...formVenta, tipoMaterial: e.target.value })}>
              {tiposMaterial.map(m => <option key={m}>{m}</option>)}
            </select>
          </ModalField>
          <ModalField label="Unidad">
            <select className={selectClass} value={formVenta.unidad} onChange={e => setFormVenta({ ...formVenta, unidad: e.target.value })}>
              {unidades.map(u => <option key={u}>{u}</option>)}
            </select>
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Cantidad *">
            <input type="number" className={inputClass} placeholder="0" value={formVenta.cantidad} onChange={e => setFormVenta({ ...formVenta, cantidad: e.target.value })} />
          </ModalField>
          <ModalField label="Precio unitario (MXN) *">
            <input type="number" className={inputClass} placeholder="0.00" value={formVenta.precioUnitario} onChange={e => setFormVenta({ ...formVenta, precioUnitario: e.target.value })} />
          </ModalField>
        </div>
        {formVenta.cantidad && formVenta.precioUnitario && (
          <div className="bg-primary/10 text-primary font-black text-sm px-4 py-3 rounded-xl">
            Total: {fmt(parseFloat(formVenta.cantidad || '0') * parseFloat(formVenta.precioUnitario || '0'))}
          </div>
        )}
        <ModalField label="Forma de Pago">
          <select className={selectClass} value={formVenta.metodoPago} onChange={e => setFormVenta({ ...formVenta, metodoPago: e.target.value })}>
            <option value="Contado">Contado (efectivo)</option>
            <option value="Crédito">Crédito</option>
          </select>
        </ModalField>
      </Modal>

      {/* ─── Modal Retiro de Efectivo ────────────────────────────────────────── */}
      <Modal isOpen={modalRetiro} onClose={() => setModalRetiro(false)} onConfirm={handleRetiro} title="Retiro de Efectivo" confirmLabel="Registrar Retiro">
        <ModalField label="Concepto *">
          <input className={inputClass} placeholder="Ej: Gasolina, refacción urgente..." value={formRetiro.concepto} onChange={e => setFormRetiro({ ...formRetiro, concepto: e.target.value })} />
        </ModalField>
        <ModalField label="Monto (MXN) *">
          <input type="number" className={inputClass} placeholder="0.00" value={formRetiro.monto} onChange={e => setFormRetiro({ ...formRetiro, monto: e.target.value })} />
        </ModalField>
        <ModalField label="Autorizado por">
          <input className={inputClass} placeholder="Gerencia / Jefe de Patio" value={formRetiro.autorizadoPor} onChange={e => setFormRetiro({ ...formRetiro, autorizadoPor: e.target.value })} />
        </ModalField>
      </Modal>

      {/* ─── Modal Abono ─────────────────────────────────────────────────────── */}
      {modalAbono && (
        <Modal isOpen={!!modalAbono} onClose={() => { setModalAbono(null); setMontoAbono(''); }} onConfirm={handleAbono} title="Registrar Abono" confirmLabel="Confirmar Abono">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <p className="font-bold text-slate-700">{modalAbono.cliente}</p>
            <p className="text-xs text-slate-500">{modalAbono.tipoMaterial} · {modalAbono.folio}</p>
            <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-500 text-xs">Pendiente</span>
              <span className="font-black text-red-600">{fmt(modalAbono.total - modalAbono.pagado)}</span>
            </div>
          </div>
          <ModalField label="Monto del Abono *">
            <input type="number" className={inputClass} placeholder="0.00" value={montoAbono} onChange={e => setMontoAbono(e.target.value)} />
          </ModalField>
        </Modal>
      )}
    </div>
  );
}
