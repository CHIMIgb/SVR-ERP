"use client";

import React, { useState } from 'react';
import {
  Search, DollarSign, AlertTriangle, CheckCircle2,
  TrendingUp, Clock, ChevronRight, Plus, CreditCard,
  Building2, CalendarDays, ReceiptText, FileText
} from 'lucide-react';
import Modal, { ModalField, inputClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type EstadoCuenta = 'Al corriente' | 'Atraso leve' | 'Atraso grave' | 'Saldado';

interface CuentaCliente {
  id: string;
  cliente: string;
  empresa: string;
  obra: string;
  totalObra: number;
  totalCobrado: number;
  fechaUltimoAbono: string;
  diasCredito: number;
  estado: EstadoCuenta;
}

interface Abono {
  id: string;
  cuentaId: string;
  clienteNombre: string;
  monto: number;
  fecha: string;
  referencia: string;
  formaPago: 'Transferencia' | 'Cheque' | 'Efectivo';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const cuentasIniciales: CuentaCliente[] = [
  {
    id: 'CC001', cliente: 'Ing. Alberto Ruiz', empresa: 'Inmobiliaria ARCO', obra: 'Fraccionamiento Valle Sur',
    totalObra: 1200000, totalCobrado: 950000, fechaUltimoAbono: '2026-08-10', diasCredito: 30, estado: 'Al corriente',
  },
  {
    id: 'CC002', cliente: 'Lic. Martha Silva', empresa: 'Gobierno CDMX', obra: 'Remodelación Centro Histórico',
    totalObra: 4500000, totalCobrado: 1200000, fechaUltimoAbono: '2026-07-15', diasCredito: 60, estado: 'Atraso leve',
  },
  {
    id: 'CC003', cliente: 'Arq. Fernanda Torres', empresa: 'Desarrollos Costa', obra: 'Residencial Lomas Norte',
    totalObra: 850000, totalCobrado: 850000, fechaUltimoAbono: '2026-08-01', diasCredito: 30, estado: 'Saldado',
  },
  {
    id: 'CC004', cliente: 'Ing. Marcos Linares', empresa: 'Constructora Omega', obra: 'Bodega Industrial Km 45',
    totalObra: 620000, totalCobrado: 80000, fechaUltimoAbono: '2026-06-20', diasCredito: 30, estado: 'Atraso grave',
  },
];

const abonosIniciales: Abono[] = [
  { id: 'AB001', cuentaId: 'CC001', clienteNombre: 'Inmobiliaria ARCO', monto: 200000, fecha: '2026-08-10', referencia: 'TRF-882211', formaPago: 'Transferencia' },
  { id: 'AB002', cuentaId: 'CC002', clienteNombre: 'Gobierno CDMX', monto: 500000, fecha: '2026-07-15', referencia: 'CHQ-004412', formaPago: 'Cheque' },
  { id: 'AB003', cuentaId: 'CC001', clienteNombre: 'Inmobiliaria ARCO', monto: 350000, fecha: '2026-07-01', referencia: 'TRF-774400', formaPago: 'Transferencia' },
  { id: 'AB004', cuentaId: 'CC004', clienteNombre: 'Constructora Omega', monto: 80000, fecha: '2026-06-20', referencia: 'EFE', formaPago: 'Efectivo' },
];

const estadoConfig: Record<EstadoCuenta, { color: string; bg: string; dot: string }> = {
  'Al corriente': { color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  'Atraso leve': { color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  'Atraso grave': { color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  'Saldado': { color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400' },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function CobranzaPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'cuentas' | 'abonos' | 'vencimientos'>('cuentas');
  const [cuentas, setCuentas] = useState<CuentaCliente[]>(cuentasIniciales);
  const [abonos, setAbonos] = useState<Abono[]>(abonosIniciales);
  const [search, setSearch] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaCliente | null>(null);
  const [modalAbono, setModalAbono] = useState(false);
  const [formAbono, setFormAbono] = useState({ monto: '', referencia: '', formaPago: 'Transferencia' });

  // Stats
  const totalPorCobrar = cuentas.reduce((a, c) => a + Math.max(0, c.totalObra - c.totalCobrado), 0);
  const enAtraso = cuentas.filter(c => c.estado === 'Atraso grave' || c.estado === 'Atraso leve').length;
  const totalCobrado = cuentas.reduce((a, c) => a + c.totalCobrado, 0);
  const totalObras = cuentas.reduce((a, c) => a + c.totalObra, 0);

  const cuentasFiltradas = cuentas.filter(c =>
    c.cliente.toLowerCase().includes(search.toLowerCase()) ||
    c.empresa.toLowerCase().includes(search.toLowerCase()) ||
    c.obra.toLowerCase().includes(search.toLowerCase())
  );

  const handleAbono = () => {
    if (!selectedCuenta) return;
    const monto = parseFloat(formAbono.monto);
    if (!monto || monto <= 0) { showToast('Ingresa un monto válido.', 'error'); return; }
    const pendiente = selectedCuenta.totalObra - selectedCuenta.totalCobrado;
    if (monto > pendiente) { showToast(`El abono no puede superar el saldo (${fmt(pendiente)}).`, 'error'); return; }

    const nuevo: Abono = {
      id: `AB${Date.now()}`,
      cuentaId: selectedCuenta.id,
      clienteNombre: selectedCuenta.empresa,
      monto,
      fecha: new Date().toISOString().split('T')[0],
      referencia: formAbono.referencia || 'Sin referencia',
      formaPago: formAbono.formaPago as Abono['formaPago'],
    };

    const nuevoTotalCobrado = selectedCuenta.totalCobrado + monto;
    const nuevoEstado: EstadoCuenta = nuevoTotalCobrado >= selectedCuenta.totalObra ? 'Saldado' : 'Al corriente';

    setCuentas(prev => prev.map(c =>
      c.id === selectedCuenta.id
        ? { ...c, totalCobrado: nuevoTotalCobrado, fechaUltimoAbono: nuevo.fecha, estado: nuevoEstado }
        : c
    ));
    setAbonos(prev => [nuevo, ...prev]);
    setModalAbono(false);
    setFormAbono({ monto: '', referencia: '', formaPago: 'Transferencia' });
    setSelectedCuenta(null);
    showToast(`✅ Abono de ${fmt(monto)} registrado para ${selectedCuenta.empresa}.`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Crédito y Cobranza</h1>
          <p className="text-slate-500 font-medium">Saldos por cliente · Estados de cuenta · Control de abonos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-red-500 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por Cobrar</p>
              <h4 className="text-lg font-black text-red-600">{fmt(totalPorCobrar)}</h4>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-yellow-400 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Atraso</p>
              <h4 className="text-lg font-black text-yellow-600">{enAtraso} clientes</h4>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-green-500 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobrado</p>
              <h4 className="text-lg font-black text-green-600">{fmt(totalCobrado)}</h4>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-primary py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 text-primary rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">% Cobrado</p>
              <h4 className="text-lg font-black text-slate-900">{totalObras > 0 ? Math.round((totalCobrado / totalObras) * 100) : 0}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['cuentas', 'abonos', 'vencimientos'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'cuentas' ? 'Cuentas por Cobrar' : t === 'abonos' ? 'Historial de Abonos' : 'Vencimientos'}
          </button>
        ))}
      </div>

      {/* Search */}
      {tab === 'cuentas' && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, empresa u obra..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
          />
        </div>
      )}

      {/* ─── CUENTAS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'cuentas' && (
        <div className="space-y-4">
          {cuentasFiltradas.map(c => {
            const saldo = c.totalObra - c.totalCobrado;
            const pct = Math.round((c.totalCobrado / c.totalObra) * 100);
            const cfg = estadoConfig[c.estado];
            return (
              <div key={c.id} className="card group hover:border-primary/30">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                      {c.empresa[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-sm">{c.empresa}</h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {c.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">{c.obra}</p>
                      <p className="text-[10px] text-slate-400">Último abono: {c.fechaUltimoAbono} · {c.diasCredito} días crédito</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex-1 min-w-48">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Cobrado</span>
                      <span className="font-bold text-slate-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-green-600 font-bold">{fmt(c.totalCobrado)}</span>
                      <span className="text-slate-400">de {fmt(c.totalObra)}</span>
                    </div>
                  </div>

                  {/* Right: saldo + action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
                      <p className={`font-black text-lg ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(saldo)}</p>
                    </div>
                    {saldo > 0 && (
                      <button
                        onClick={() => { setSelectedCuenta(c); setModalAbono(true); }}
                        className="btn-primary flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" /> Abonar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {cuentasFiltradas.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-medium">No se encontraron cuentas.</div>
          )}
        </div>
      )}

      {/* ─── ABONOS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'abonos' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencia</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {abonos.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">{a.fecha}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                          {a.clienteNombre[0]}
                        </div>
                        <span className="font-bold text-slate-700 text-xs">{a.clienteNombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{a.referencia}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        a.formaPago === 'Transferencia' ? 'bg-blue-100 text-blue-700' :
                        a.formaPago === 'Cheque' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {a.formaPago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-green-600 text-base">{fmt(a.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── VENCIMIENTOS TAB ────────────────────────────────────────────────── */}
      {tab === 'vencimientos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cuentas
              .filter(c => c.estado !== 'Saldado')
              .sort((a, b) => {
                const order: Record<EstadoCuenta, number> = { 'Atraso grave': 0, 'Atraso leve': 1, 'Al corriente': 2, 'Saldado': 3 };
                return order[a.estado] - order[b.estado];
              })
              .map(c => {
                const saldo = c.totalObra - c.totalCobrado;
                const cfg = estadoConfig[c.estado];
                const diasDesdeAbono = Math.floor(
                  (new Date().getTime() - new Date(c.fechaUltimoAbono).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={c.id} className={`card border-l-4 ${c.estado === 'Atraso grave' ? 'border-l-red-500' : c.estado === 'Atraso leve' ? 'border-l-yellow-400' : 'border-l-green-400'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-slate-900 text-sm">{c.empresa}</h3>
                        <p className="text-xs text-slate-500">{c.obra}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {c.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 rounded-xl p-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase">Saldo</p>
                        <p className="font-black text-red-600 text-sm">{fmt(saldo)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase">Días sin abono</p>
                        <p className={`font-black text-sm ${diasDesdeAbono > c.diasCredito ? 'text-red-600' : 'text-slate-700'}`}>{diasDesdeAbono}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase">Límite crédito</p>
                        <p className="font-black text-slate-700 text-sm">{c.diasCredito} días</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedCuenta(c); setModalAbono(true); }}
                      className="mt-3 w-full py-2 bg-primary/10 text-primary font-bold text-xs rounded-lg hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Registrar Abono
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── Modal Abono ─────────────────────────────────────────────────────── */}
      {selectedCuenta && (
        <Modal
          isOpen={modalAbono}
          onClose={() => { setModalAbono(false); setSelectedCuenta(null); setFormAbono({ monto: '', referencia: '', formaPago: 'Transferencia' }); }}
          onConfirm={handleAbono}
          title="Registrar Abono"
          confirmLabel="Confirmar Abono"
        >
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <p className="font-black text-slate-700">{selectedCuenta.empresa}</p>
            <p className="text-xs text-slate-500">{selectedCuenta.obra}</p>
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
              <div>
                <p className="text-[10px] text-slate-400">Total obra</p>
                <p className="font-black text-slate-700">{fmt(selectedCuenta.totalObra)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Saldo pendiente</p>
                <p className="font-black text-red-600">{fmt(selectedCuenta.totalObra - selectedCuenta.totalCobrado)}</p>
              </div>
            </div>
          </div>
          <ModalField label="Monto del Abono (MXN) *">
            <input
              type="number"
              className={inputClass}
              placeholder="0.00"
              value={formAbono.monto}
              onChange={e => setFormAbono({ ...formAbono, monto: e.target.value })}
            />
          </ModalField>
          <ModalField label="Forma de Pago">
            <select
              className={inputClass}
              value={formAbono.formaPago}
              onChange={e => setFormAbono({ ...formAbono, formaPago: e.target.value })}
            >
              <option value="Transferencia">Transferencia bancaria</option>
              <option value="Cheque">Cheque</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </ModalField>
          <ModalField label="Referencia / Folio de pago">
            <input
              className={inputClass}
              placeholder="TRF-000000 / CHQ-0000"
              value={formAbono.referencia}
              onChange={e => setFormAbono({ ...formAbono, referencia: e.target.value })}
            />
          </ModalField>
        </Modal>
      )}
    </div>
  );
}
