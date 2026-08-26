"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, FileText, CheckCircle2, AlertCircle, Calendar, Loader2 } from 'lucide-react';
import type { Maquina } from '@svr-erp/shared';
import type { TrabajadorDTO, BitacoraRentaDTO } from '@/lib/api';
import { bitacorasRentaApi } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import Modal, { ModalField, inputClass, selectClass } from '@/components/layout/Modal';
import { Portal } from '@/components/ui/Portal';
import { Overlay } from '@/components/ui/Overlay';

interface BitacorasRentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajador?: TrabajadorDTO | null;
  maquinaria: Maquina[];
  puedeCrear?: boolean;
  onBitacoraCreada?: () => void;
}

export default function BitacorasRentaModal({
  isOpen,
  onClose,
  trabajador,
  maquinaria,
  puedeCrear,
  onBitacoraCreada,
}: BitacorasRentaModalProps) {
  const { showToast } = useToast();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const [bitacoras, setBitacoras] = useState<BitacoraRentaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    maquinaId: trabajador?.maquinaAsignadaId ?? maquinaria[0]?.id ?? '',
    fecha: new Date().toISOString().split('T')[0],
    cliente: 'Inmobiliaria ARCO',
    obraUbicacion: 'Fraccionamiento Valle Sur',
    horaInicio: '07:00',
    horaFin: '17:00',
    horasEfectivas: '8.0',
    horasExtras: '2.0',
    horometroInicial: '1245.0',
    horometroFinal: '1255.0',
    actividadRealizada: 'Excavación y carga de material en frente de obra.',
    nombreResidente: 'Ing. Roberto Garza',
    cargoResidente: 'Residente de Obra del Cliente',
    tarifaHora: '1450',
    firmado: true,
  });

  const fetchBitacoras = useCallback(async () => {
    setLoading(true);
    const res = await bitacorasRentaApi.listar({ trabajadorId: trabajador?.id, limit: 100 });
    if (res.success) setBitacoras(res.data.items);
    setLoading(false);
  }, [trabajador?.id]);

  useEffect(() => {
    if (isOpen) fetchBitacoras();
  }, [isOpen, fetchBitacoras]);

  if (!isOpen) return null;

  const handleCaptureSubmit = async () => {
    if (!trabajador) return;
    setSubmitting(true);
    const res = await bitacorasRentaApi.crear({
      trabajadorId: trabajador.id,
      maquinaId: form.maquinaId,
      fecha: form.fecha,
      cliente: form.cliente,
      obraUbicacion: form.obraUbicacion,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      horasEfectivas: parseFloat(form.horasEfectivas) || 0,
      horasExtras: parseFloat(form.horasExtras) || 0,
      horometroInicial: parseFloat(form.horometroInicial) || 0,
      horometroFinal: parseFloat(form.horometroFinal) || 0,
      actividadRealizada: form.actividadRealizada,
      tarifaHoraRenta: parseFloat(form.tarifaHora) || 1450,
      firmado: form.firmado,
      nombreResidente: form.firmado ? form.nombreResidente : undefined,
      cargoResidente: form.firmado ? form.cargoResidente : undefined,
    });
    setSubmitting(false);

    if (res.success) {
      setCaptureModalOpen(false);
      showToast(`✅ Hoja de Bitácora ${res.data.folio} registrada (${fmt.format(res.data.importeTotalRenta)} a facturar).`, 'success');
      fetchBitacoras();
      onBitacoraCreada?.();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  return (
    <Portal>
      <Overlay onClick={onClose} blur className="z-[9999] p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-[fadeScaleIn_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
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
                    Hojas de Bitácora de Renta: {trabajador?.nombre}
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
              {puedeCrear && (
                <button
                  onClick={() => setCaptureModalOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" /> + Capturar Hoja
                </button>
              )}

              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Facturable</span>
                  <span className="text-xl font-black text-emerald-700">
                    {fmt.format(bitacoras.reduce((s, b) => s + b.importeTotalRenta, 0))}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : bitacoras.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-sm">Sin hojas de bitácora registradas para este operador.</p>
                </div>
              ) : (
                bitacoras.map((b) => (
                  <div key={b.id} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">{b.folio}</span>
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
                        <span className="text-xs font-black text-slate-900">{fmt.format(b.importeTotalRenta)}</span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({b.horasEfectivas + b.horasExtras}h @ ${b.tarifaHoraRenta}/hr)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <p className="text-[9px] font-black uppercase text-slate-400">¿Para quién y dónde?</p>
                        <p className="font-black text-slate-900">{b.cliente}</p>
                        <p className="text-slate-500 text-[11px] truncate">{b.obraUbicacion}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <p className="text-[9px] font-black uppercase text-slate-400">Horario &amp; Horómetros</p>
                        <p className="font-bold text-slate-900">
                          {b.horaInicio} - {b.horaFin} ({b.horasEfectivas}h + {b.horasExtras}h extra)
                        </p>
                        <p className="text-slate-500 font-mono text-[10px]">
                          Horómetro: {b.horometroInicial} ➔ {b.horometroFinal} ({(b.horometroFinal - b.horometroInicial).toFixed(1)} hrs)
                        </p>
                      </div>

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
              Total de hojas registradas: <strong>{bitacoras.length}</strong>
            </span>
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
              Cerrar
            </button>
          </div>
        </div>

        {/* Modal Capturar Hoja */}
        {captureModalOpen && (
          <Modal
            isOpen={captureModalOpen}
            onClose={() => setCaptureModalOpen(false)}
            onConfirm={handleCaptureSubmit}
            title="Capturar Hoja de Bitácora Diaria de Renta"
            confirmLabel={submitting ? 'Guardando…' : 'Guardar Hoja de Bitácora'}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Cliente / Contratista *">
                  <input className={inputClass} value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
                </ModalField>
                <ModalField label="Obra o Frente *">
                  <input className={inputClass} value={form.obraUbicacion} onChange={(e) => setForm({ ...form, obraUbicacion: e.target.value })} />
                </ModalField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Máquina Operada *">
                  <select className={selectClass} value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}>
                    {maquinaria.map((m) => (
                      <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
                    ))}
                  </select>
                </ModalField>
                <ModalField label="Fecha de Servicio">
                  <input type="date" className={inputClass} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </ModalField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ModalField label="Hora Inicio">
                  <input type="time" className={inputClass} value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
                </ModalField>
                <ModalField label="Hora Fin">
                  <input type="time" className={inputClass} value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} />
                </ModalField>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <ModalField label="Horas Efectivas">
                  <input type="number" step="0.5" className={inputClass} value={form.horasEfectivas} onChange={(e) => setForm({ ...form, horasEfectivas: e.target.value })} />
                </ModalField>
                <ModalField label="Horas Extras">
                  <input type="number" step="0.5" className={inputClass} value={form.horasExtras} onChange={(e) => setForm({ ...form, horasExtras: e.target.value })} />
                </ModalField>
                <ModalField label="Tarifa Renta ($/hr)">
                  <input type="number" className={inputClass} value={form.tarifaHora} onChange={(e) => setForm({ ...form, tarifaHora: e.target.value })} />
                </ModalField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Horómetro Inicial">
                  <input type="number" step="0.1" className={inputClass} value={form.horometroInicial} onChange={(e) => setForm({ ...form, horometroInicial: e.target.value })} />
                </ModalField>
                <ModalField label="Horómetro Final">
                  <input type="number" step="0.1" className={inputClass} value={form.horometroFinal} onChange={(e) => setForm({ ...form, horometroFinal: e.target.value })} />
                </ModalField>
              </div>

              <ModalField label="Trabajo Realizado / Notas de Campo">
                <textarea rows={2} className={inputClass} value={form.actividadRealizada} onChange={(e) => setForm({ ...form, actividadRealizada: e.target.value })} />
              </ModalField>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.firmado} onChange={(e) => setForm({ ...form, firmado: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                  <span className="text-xs font-black text-slate-800">¿La hoja viene firmada / con Vo.Bo. del residente del cliente?</span>
                </label>

                {form.firmado && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <input placeholder="Nombre del residente" className={inputClass} value={form.nombreResidente} onChange={(e) => setForm({ ...form, nombreResidente: e.target.value })} />
                    <input placeholder="Cargo" className={inputClass} value={form.cargoResidente} onChange={(e) => setForm({ ...form, cargoResidente: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </Overlay>
    </Portal>
  );
}
