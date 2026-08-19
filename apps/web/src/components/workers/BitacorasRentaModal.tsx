"use client";

import React, { useState } from 'react';
import { 
  X, Plus, FileText, CheckCircle2, Clock, Truck, 
  Building2, User, DollarSign, AlertCircle, Search,
  Calendar, ShieldCheck, Download, ExternalLink, Printer
} from 'lucide-react';
import { BitacoraRentaDiaria, Trabajador, maquinaria } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';

interface BitacorasRentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajador?: Trabajador | null;
  bitacoras: BitacoraRentaDiaria[];
  onAgregarBitacora: (nueva: BitacoraRentaDiaria) => void;
}

export default function BitacorasRentaModal({
  isOpen,
  onClose,
  trabajador,
  bitacoras,
  onAgregarBitacora
}: BitacorasRentaModalProps) {
  const { showToast } = useToast();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [selectedBitacora, setSelectedBitacora] = useState<BitacoraRentaDiaria | null>(null);

  // New Bitácora form
  const [form, setForm] = useState({
    trabajadorId: trabajador?.id ?? 'T001',
    maquinaId: trabajador?.maquinaAsignadaId ?? 'M001',
    fecha: new Date().toISOString().split('T')[0],
    cliente: 'Inmobiliaria ARCO',
    obraUbicacion: 'Fraccionamiento Valle Sur',
    horaInicio: '07:00 AM',
    horaFin: '05:00 PM',
    horasEfectivas: '8.0',
    horasExtras: '2.0',
    horometroInicial: '1245.0',
    horometroFinal: '1255.0',
    actividadRealizada: 'Excavación y carga de material en frente de obra.',
    nombreResidente: 'Ing. Roberto Garza',
    cargoResidente: 'Residente de Obra del Cliente',
    tarifaHora: '1450',
    firmado: true
  });

  if (!isOpen) return null;

  const filteredBitacoras = trabajador
    ? bitacoras.filter(b => b.trabajadorId === trabajador.id)
    : bitacoras;

  const handleCaptureSubmit = () => {
    const hrsEf = parseFloat(form.horasEfectivas) || 8.0;
    const hrsEx = parseFloat(form.horasExtras) || 0;
    const tarifa = parseFloat(form.tarifaHora) || 1450;
    const totalHrs = hrsEf + hrsEx;
    const importe = totalHrs * tarifa;

    const nueva: BitacoraRentaDiaria = {
      id: `B${Date.now()}`,
      folio: `BIT-2025-${String(bitacoras.length + 1).padStart(3, '0')}`,
      trabajadorId: form.trabajadorId,
      trabajadorNombre: trabajador?.nombre ?? 'Operador SVR',
      maquinaId: form.maquinaId,
      maquinaNombre: maquinaria.find(m => m.id === form.maquinaId)?.nombre ?? 'Maquinaria Pesada',
      fecha: form.fecha,
      cliente: form.cliente,
      obraUbicacion: form.obraUbicacion,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      horasEfectivas: hrsEf,
      horasExtras: hrsEx,
      horometroInicial: parseFloat(form.horometroInicial) || 1000,
      horometroFinal: parseFloat(form.horometroFinal) || 1010,
      actividadRealizada: form.actividadRealizada,
      firmaCliente: {
        firmado: form.firmado,
        nombreResidente: form.nombreResidente,
        cargoResidente: form.cargoResidente,
        fechaFirma: form.firmado ? `${form.fecha} 05:30 PM` : undefined
      },
      estadoCobro: form.firmado ? 'Listo para Facturar' : 'Pendiente Firma',
      tarifaHoraRenta: tarifa,
      importeTotalRenta: importe
    };

    onAgregarBitacora(nueva);
    setCaptureModalOpen(false);
    showToast(`✅ Hoja de Bitácora ${nueva.folio} registrada (${fmt.format(importe)} a facturar).`, 'success');
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-[fadeScaleIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  {trabajador ? `Hojas de Bitácora de Renta: ${trabajador.nombre}` : 'Concentrado de Bitácoras de Renta (Tareo de Clientes)'}
                </h3>
                {trabajador && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white">
                    {trabajador.categoriaPuesto}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Partes diarios de trabajo cuando el operador y máquina laboran rentados para clientes externos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCaptureModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> + Capturar Hoja
            </button>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          
          {/* Summary Banner */}
          {trabajador && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary text-white rounded-xl flex items-center justify-center font-black text-xs">
                  {trabajador.avatar}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{trabajador.nombre}</h4>
                  <p className="text-xs font-bold text-primary">{trabajador.puesto}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Máquina Asignada: <strong className="text-slate-800">{trabajador.maquinaAsignadaNombre ?? 'Sin asignar'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Facturable Periodo</span>
                <span className="text-xl font-black text-emerald-700">
                  {fmt.format(filteredBitacoras.reduce((s, b) => s + b.importeTotalRenta, 0))}
                </span>
              </div>
            </div>
          )}

          {/* List of Bitácoras */}
          <div className="space-y-3">
            {filteredBitacoras.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-bold text-sm">Sin hojas de bitácora registradas para este operador.</p>
                <p className="text-xs mt-1">Haz clic en "+ Capturar Hoja" para registrar la primera bitácora.</p>
              </div>
            ) : (
              filteredBitacoras.map(b => (
                <div 
                  key={b.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all space-y-3"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {b.folio}
                      </span>
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.fecha}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        b.estadoCobro === 'Facturado' ? 'bg-blue-100 text-blue-800' :
                        b.estadoCobro === 'Listo para Facturar' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {b.estadoCobro}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">
                        {fmt.format(b.importeTotalRenta)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({b.horasEfectivas + b.horasExtras}h @ ${b.tarifaHoraRenta}/hr)
                      </span>
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    
                    {/* Cliente & Obra */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-400">¿Para quién y dónde?</p>
                      <p className="font-black text-slate-900">{b.cliente}</p>
                      <p className="text-slate-500 text-[11px] truncate">{b.obraUbicacion}</p>
                    </div>

                    {/* Horarios & Horómetro */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-400">Horario &amp; Horómetros</p>
                      <p className="font-bold text-slate-900">
                        {b.horaInicio} - {b.horaFin} ({b.horasEfectivas}h + {b.horasExtras}h extra)
                      </p>
                      <p className="text-slate-500 font-mono text-[10px]">
                        Horómetro: {b.horometroInicial} ➔ {b.horometroFinal} ({b.horometroFinal - b.horometroInicial} hrs)
                      </p>
                    </div>

                    {/* Vo.Bo. y Firma del Cliente */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-400">Vo.Bo. del Residente en Obra</p>
                      {b.firmaCliente.firmado ? (
                        <div className="text-emerald-700 font-bold flex items-start gap-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                          <div>
                            <p className="font-black text-emerald-900">{b.firmaCliente.nombreResidente}</p>
                            <p className="text-[9px] text-emerald-700">{b.firmaCliente.cargoResidente}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" /> Pendiente de firma de campo
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Notas / Actividad diaria realizada */}
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs">
                    <p className="text-[9px] font-black uppercase text-amber-900 mb-0.5">Notas Diarias / Trabajo Realizado:</p>
                    <p className="text-slate-700 font-medium leading-relaxed">{b.actividadRealizada}</p>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Total de hojas registradas: <strong>{filteredBitacoras.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* ── MODAL CAPTURAR NUEVA HOJA DE BITÁCORA ── */}
      {captureModalOpen && (
        <Modal
          isOpen={captureModalOpen}
          onClose={() => setCaptureModalOpen(false)}
          onConfirm={handleCaptureSubmit}
          title="Capturar Hoja de Bitácora Diaria de Renta"
          confirmLabel="Guardar Hoja de Bitácora"
        >
          <div className="space-y-3">
            
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Cliente / Contratista *">
                <input
                  className={inputClass}
                  placeholder="Ej: Inmobiliaria ARCO"
                  value={form.cliente}
                  onChange={e => setForm({ ...form, cliente: e.target.value })}
                />
              </ModalField>

              <ModalField label="Obra o Frente *">
                <input
                  className={inputClass}
                  placeholder="Ej: Fracc. Valle Sur - Mza 4"
                  value={form.obraUbicacion}
                  onChange={e => setForm({ ...form, obraUbicacion: e.target.value })}
                />
              </ModalField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Máquina Operada *">
                <select
                  className={selectClass}
                  value={form.maquinaId}
                  onChange={e => setForm({ ...form, maquinaId: e.target.value })}
                >
                  {maquinaria.map(m => (
                    <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
                  ))}
                </select>
              </ModalField>

              <ModalField label="Fecha de Servicio">
                <input
                  type="date"
                  className={inputClass}
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                />
              </ModalField>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <ModalField label="Horas Efectivas">
                <input
                  type="number"
                  step="0.5"
                  className={inputClass}
                  value={form.horasEfectivas}
                  onChange={e => setForm({ ...form, horasEfectivas: e.target.value })}
                />
              </ModalField>

              <ModalField label="Horas Extras">
                <input
                  type="number"
                  step="0.5"
                  className={inputClass}
                  value={form.horasExtras}
                  onChange={e => setForm({ ...form, horasExtras: e.target.value })}
                />
              </ModalField>

              <ModalField label="Tarifa Renta ($/hr)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.tarifaHora}
                  onChange={e => setForm({ ...form, tarifaHora: e.target.value })}
                />
              </ModalField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Horómetro Inicial">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={form.horometroInicial}
                  onChange={e => setForm({ ...form, horometroInicial: e.target.value })}
                />
              </ModalField>

              <ModalField label="Horómetro Final">
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={form.horometroFinal}
                  onChange={e => setForm({ ...form, horometroFinal: e.target.value })}
                />
              </ModalField>
            </div>

            <ModalField label="Trabajo Realizado / Notas de Campo">
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Detalla la actividad (ej: excavación de zanja pluvial 80m, afine de talud y carga a volteo)..."
                value={form.actividadRealizada}
                onChange={e => setForm({ ...form, actividadRealizada: e.target.value })}
              />
            </ModalField>

            {/* Vo.Bo. del Cliente */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.firmado}
                  onChange={e => setForm({ ...form, firmado: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-black text-slate-800">
                  ¿La hoja viene firmada / con Vo.Bo. del residente del cliente?
                </span>
              </label>

              {form.firmado && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <input
                    placeholder="Nombre del residente que firmó"
                    className={inputClass}
                    value={form.nombreResidente}
                    onChange={e => setForm({ ...form, nombreResidente: e.target.value })}
                  />
                  <input
                    placeholder="Cargo (ej: Residente de Obra)"
                    className={inputClass}
                    value={form.cargoResidente}
                    onChange={e => setForm({ ...form, cargoResidente: e.target.value })}
                  />
                </div>
              )}
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
