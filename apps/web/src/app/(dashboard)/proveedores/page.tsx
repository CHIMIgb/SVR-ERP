"use client";

import React, { useState } from 'react';
import {
  Plus, Search, Truck, FileText, CheckCircle2,
  Clock, AlertCircle, ChevronRight, X, DollarSign,
  Package, Phone, Mail, Building2, CreditCard
} from 'lucide-react';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { useToast } from '@/components/layout/Toast';

// ─── Data types ────────────────────────────────────────────────────────────────
interface Proveedor {
  id: string;
  nombre: string;
  empresa: string;
  telefono: string;
  correo: string;
  categoria: 'Refacciones' | 'Combustible' | 'Materiales' | 'Servicios' | 'Otros';
  saldoPendiente: number;
  totalCompras: number;
}

interface OrdenCompra {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  descripcion: string;
  monto: number;
  fecha: string;
  estado: 'Pendiente' | 'Aprobada' | 'Recibida' | 'Cancelada';
  pagado: number;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const proveedoresIniciales: Proveedor[] = [
  { id: 'PV001', nombre: 'Carlos Herrera', empresa: 'Refacciones CAT México', telefono: '555-1100', correo: 'cherrera@catmex.com', categoria: 'Refacciones', saldoPendiente: 12500, totalCompras: 85000 },
  { id: 'PV002', nombre: 'Daniela Ríos', empresa: 'Lubricantes Especializados', telefono: '555-2233', correo: 'drios@lubrispec.com', categoria: 'Refacciones', saldoPendiente: 4200, totalCompras: 32000 },
  { id: 'PV003', nombre: 'Jorge Sánchez', empresa: 'Diésel del Norte', telefono: '555-3344', correo: 'jsanchez@diesel.com', categoria: 'Combustible', saldoPendiente: 0, totalCompras: 145000 },
  { id: 'PV004', nombre: 'Lucía Morales', empresa: 'Michelin México', telefono: '555-4455', correo: 'lmorales@michelin.mx', categoria: 'Refacciones', saldoPendiente: 34000, totalCompras: 68000 },
];

const ordenesIniciales: OrdenCompra[] = [
  { id: 'OC001', proveedorId: 'PV001', proveedorNombre: 'Refacciones CAT México', descripcion: 'Filtros de aceite x12 + filtros de aire x6', monto: 8400, fecha: '2026-08-10', estado: 'Recibida', pagado: 8400 },
  { id: 'OC002', proveedorId: 'PV004', proveedorNombre: 'Michelin México', descripcion: 'Llantas 11R22.5 x4 para volteo', monto: 34000, fecha: '2026-08-12', estado: 'Aprobada', pagado: 0 },
  { id: 'OC003', proveedorId: 'PV002', proveedorNombre: 'Lubricantes Especializados', descripcion: 'Aceite hidráulico SAE 10W x20 galones', monto: 4200, fecha: '2026-08-14', estado: 'Pendiente', pagado: 0 },
  { id: 'OC004', proveedorId: 'PV001', proveedorNombre: 'Refacciones CAT México', descripcion: 'Manguera hidráulica 1" x10m + conectores', monto: 12500, fecha: '2026-08-15', estado: 'Pendiente', pagado: 0 },
];

const categoriaColor: Record<string, string> = {
  Refacciones: 'bg-blue-100 text-blue-700',
  Combustible: 'bg-orange-100 text-orange-700',
  Materiales: 'bg-green-100 text-green-700',
  Servicios: 'bg-purple-100 text-purple-700',
  Otros: 'bg-slate-100 text-slate-600',
};

const estadoConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Pendiente: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
  Aprobada: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  Recibida: { color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  Cancelada: { color: 'bg-red-100 text-red-700', icon: <X className="w-3 h-3" /> },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProveedoresPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'proveedores' | 'ordenes' | 'estados'>('proveedores');
  const [proveedores, setProveedores] = useState<Proveedor[]>(proveedoresIniciales);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(ordenesIniciales);
  const [search, setSearch] = useState('');

  // Modals
  const [modalProv, setModalProv] = useState(false);
  const [modalOC, setModalOC] = useState(false);
  const [modalAbono, setModalAbono] = useState<OrdenCompra | null>(null);

  const [formProv, setFormProv] = useState({ nombre: '', empresa: '', telefono: '', correo: '', categoria: 'Refacciones' });
  const [formOC, setFormOC] = useState({ proveedorId: '', descripcion: '', monto: '' });
  const [montoAbono, setMontoAbono] = useState('');

  // Stats
  const totalPendiente = proveedores.reduce((a, p) => a + p.saldoPendiente, 0);
  const totalCompras = proveedores.reduce((a, p) => a + p.totalCompras, 0);
  const ordenesActivas = ordenes.filter(o => o.estado === 'Pendiente' || o.estado === 'Aprobada').length;

  const filteredProv = proveedores.filter(p =>
    p.empresa.toLowerCase().includes(search.toLowerCase()) ||
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOC = ordenes.filter(o =>
    o.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    o.proveedorNombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleNuevoProveedor = () => {
    if (!formProv.nombre.trim() || !formProv.empresa.trim()) {
      showToast('Nombre y empresa son obligatorios.', 'error');
      return;
    }
    const nuevo: Proveedor = {
      id: `PV${Date.now()}`,
      nombre: formProv.nombre,
      empresa: formProv.empresa,
      telefono: formProv.telefono,
      correo: formProv.correo,
      categoria: formProv.categoria as Proveedor['categoria'],
      saldoPendiente: 0,
      totalCompras: 0,
    };
    setProveedores(prev => [nuevo, ...prev]);
    setModalProv(false);
    setFormProv({ nombre: '', empresa: '', telefono: '', correo: '', categoria: 'Refacciones' });
    showToast(`✅ Proveedor "${formProv.empresa}" agregado.`, 'success');
  };

  const handleNuevaOC = () => {
    if (!formOC.proveedorId || !formOC.descripcion.trim() || !formOC.monto) {
      showToast('Todos los campos son obligatorios.', 'error');
      return;
    }
    const prov = proveedores.find(p => p.id === formOC.proveedorId)!;
    const nueva: OrdenCompra = {
      id: `OC${Date.now()}`,
      proveedorId: formOC.proveedorId,
      proveedorNombre: prov.empresa,
      descripcion: formOC.descripcion,
      monto: parseFloat(formOC.monto),
      fecha: new Date().toISOString().split('T')[0],
      estado: 'Pendiente',
      pagado: 0,
    };
    setOrdenes(prev => [nueva, ...prev]);
    setProveedores(prev => prev.map(p =>
      p.id === formOC.proveedorId
        ? { ...p, saldoPendiente: p.saldoPendiente + parseFloat(formOC.monto), totalCompras: p.totalCompras + parseFloat(formOC.monto) }
        : p
    ));
    setModalOC(false);
    setFormOC({ proveedorId: '', descripcion: '', monto: '' });
    showToast(`✅ Orden de compra creada correctamente.`, 'success');
  };

  const handleAbono = () => {
    if (!modalAbono) return;
    const abono = parseFloat(montoAbono);
    if (!abono || abono <= 0) { showToast('Ingresa un monto válido.', 'error'); return; }
    const pendiente = modalAbono.monto - modalAbono.pagado;
    if (abono > pendiente) { showToast(`El abono no puede superar el saldo pendiente (${fmt(pendiente)}).`, 'error'); return; }

    setOrdenes(prev => prev.map(o => {
      if (o.id !== modalAbono.id) return o;
      const nuevoPagado = o.pagado + abono;
      return { ...o, pagado: nuevoPagado, estado: nuevoPagado >= o.monto ? 'Recibida' : o.estado };
    }));
    setProveedores(prev => prev.map(p =>
      p.id === modalAbono.proveedorId
        ? { ...p, saldoPendiente: Math.max(0, p.saldoPendiente - abono) }
        : p
    ));
    setMontoAbono('');
    setModalAbono(null);
    showToast(`✅ Abono de ${fmt(abono)} registrado.`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Proveedores</h1>
          <p className="text-slate-500 font-medium">Órdenes de compra, pagos y estados de cuenta.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center gap-2" onClick={() => setModalOC(true)}>
            <FileText className="w-4 h-4" /> Nueva Orden
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
            onClick={() => setModalProv(true)}
          >
            <Plus className="w-4 h-4" /> Proveedor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card border-l-4 border-l-red-500 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por Pagar</p>
              <h4 className="text-xl font-black text-slate-900">{fmt(totalPendiente)}</h4>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-primary py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-primary rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Órdenes Activas</p>
              <h4 className="text-xl font-black text-slate-900">{ordenesActivas}</h4>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-green-500 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Compras</p>
              <h4 className="text-xl font-black text-slate-900">{fmt(totalCompras)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['proveedores', 'ordenes', 'estados'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'ordenes' ? 'Órdenes de Compra' : t === 'estados' ? 'Estados de Cuenta' : 'Proveedores'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'proveedores' ? 'Buscar proveedor...' : 'Buscar orden...'}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
        />
      </div>

      {/* ─── PROVEEDORES TAB ──────────────────────────────────────────────────── */}
      {tab === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProv.map(p => (
            <div key={p.id} className="card group hover:border-primary/30">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg">
                    {p.empresa[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight text-sm">{p.empresa}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.nombre}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${categoriaColor[p.categoria]}`}>
                  {p.categoria}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Phone className="w-3.5 h-3.5" /> {p.telefono}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Mail className="w-3.5 h-3.5" /> {p.correo}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Saldo pendiente</span>
                  <span className={`font-black ${p.saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(p.saldoPendiente)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total compras</span>
                  <span className="font-black text-slate-700">{fmt(p.totalCompras)}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredProv.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400 font-medium">
              No se encontraron proveedores.
            </div>
          )}
        </div>
      )}

      {/* ─── ÓRDENES TAB ─────────────────────────────────────────────────────── */}
      {tab === 'ordenes' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagado</th>
                  <th className="text-center px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOC.map(o => {
                  const cfg = estadoConfig[o.estado];
                  const pendiente = o.monto - o.pagado;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-black text-primary text-xs">{o.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                            {o.proveedorNombre[0]}
                          </div>
                          <span className="font-bold text-slate-700 text-xs">{o.proveedorNombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium max-w-xs">
                        <p className="truncate text-xs">{o.descripcion}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium text-xs">{o.fecha}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{fmt(o.monto)}</td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <div className="font-black text-green-600 text-sm">{fmt(o.pagado)}</div>
                          {pendiente > 0 && <div className="text-[10px] text-red-500 font-bold">Resta: {fmt(pendiente)}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.color}`}>
                            {cfg.icon} {o.estado}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {pendiente > 0 && (
                          <button
                            onClick={() => setModalAbono(o)}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" /> Abonar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ESTADOS DE CUENTA TAB ───────────────────────────────────────────── */}
      {tab === 'estados' && (
        <div className="space-y-4">
          {proveedores.map(p => {
            const ocs = ordenes.filter(o => o.proveedorId === p.id);
            if (ocs.length === 0) return null;
            return (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                      {p.empresa[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">{p.empresa}</h3>
                      <p className="text-xs text-slate-500">{ocs.length} operaciones</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo pendiente</p>
                    <p className={`text-lg font-black ${p.saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {fmt(p.saldoPendiente)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {ocs.map(o => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-t border-slate-50 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400">{o.fecha}</span>
                        <span className="text-slate-700 font-medium text-xs">{o.descripcion}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-900">{fmt(o.monto)}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${estadoConfig[o.estado].color}`}>
                          {o.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total compras</span>
                  <span className="font-black text-slate-900">{fmt(p.totalCompras)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Nuevo Proveedor ─────────────────────────────────────────────── */}
      <Modal isOpen={modalProv} onClose={() => setModalProv(false)} onConfirm={handleNuevoProveedor} title="Nuevo Proveedor" confirmLabel="Agregar Proveedor">
        <ModalField label="Empresa *">
          <input className={inputClass} placeholder="Refacciones CAT México" value={formProv.empresa} onChange={e => setFormProv({ ...formProv, empresa: e.target.value })} />
        </ModalField>
        <ModalField label="Contacto *">
          <input className={inputClass} placeholder="Nombre del contacto" value={formProv.nombre} onChange={e => setFormProv({ ...formProv, nombre: e.target.value })} />
        </ModalField>
        <ModalField label="Categoría">
          <select className={selectClass} value={formProv.categoria} onChange={e => setFormProv({ ...formProv, categoria: e.target.value })}>
            <option>Refacciones</option>
            <option>Combustible</option>
            <option>Materiales</option>
            <option>Servicios</option>
            <option>Otros</option>
          </select>
        </ModalField>
        <ModalField label="Teléfono">
          <input className={inputClass} placeholder="555-0000" value={formProv.telefono} onChange={e => setFormProv({ ...formProv, telefono: e.target.value })} />
        </ModalField>
        <ModalField label="Correo">
          <input type="email" className={inputClass} placeholder="correo@empresa.com" value={formProv.correo} onChange={e => setFormProv({ ...formProv, correo: e.target.value })} />
        </ModalField>
      </Modal>

      {/* ─── Modal Nueva Orden de Compra ───────────────────────────────────────── */}
      <Modal isOpen={modalOC} onClose={() => setModalOC(false)} onConfirm={handleNuevaOC} title="Nueva Orden de Compra" confirmLabel="Crear Orden">
        <ModalField label="Proveedor *">
          <select className={selectClass} value={formOC.proveedorId} onChange={e => setFormOC({ ...formOC, proveedorId: e.target.value })}>
            <option value="">Seleccionar proveedor...</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.empresa}</option>)}
          </select>
        </ModalField>
        <ModalField label="Descripción *">
          <input className={inputClass} placeholder="Filtros de aceite x12, aceite SAE 15W-40..." value={formOC.descripcion} onChange={e => setFormOC({ ...formOC, descripcion: e.target.value })} />
        </ModalField>
        <ModalField label="Monto Total (MXN) *">
          <input type="number" className={inputClass} placeholder="5000" value={formOC.monto} onChange={e => setFormOC({ ...formOC, monto: e.target.value })} />
        </ModalField>
      </Modal>

      {/* ─── Modal Abono ──────────────────────────────────────────────────────── */}
      {modalAbono && (
        <Modal
          isOpen={!!modalAbono}
          onClose={() => { setModalAbono(null); setMontoAbono(''); }}
          onConfirm={handleAbono}
          title="Registrar Abono"
          confirmLabel="Registrar Pago"
        >
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
            <p className="font-bold text-slate-700">{modalAbono.proveedorNombre}</p>
            <p className="text-slate-500 text-xs">{modalAbono.descripcion}</p>
            <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-500 text-xs">Pendiente por pagar</span>
              <span className="font-black text-red-600">{fmt(modalAbono.monto - modalAbono.pagado)}</span>
            </div>
          </div>
          <ModalField label="Monto a Abonar (MXN) *">
            <input
              type="number"
              className={inputClass}
              placeholder="0.00"
              value={montoAbono}
              onChange={e => setMontoAbono(e.target.value)}
            />
          </ModalField>
        </Modal>
      )}
    </div>
  );
}
