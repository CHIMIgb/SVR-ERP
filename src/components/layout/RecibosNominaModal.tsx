"use client";

import React, { useState } from 'react';
import { X, Printer, Download, Banknote, CreditCard, Wallet, User, CheckCircle } from 'lucide-react';
import { trabajadores, Trabajador } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';

interface RecibosNominaModalProps {
  isOpen: boolean;
  onClose: () => void;
  workersList?: typeof trabajadores;
}

export default function RecibosNominaModal({
  isOpen,
  onClose,
  workersList = trabajadores
}: RecibosNominaModalProps) {
  const { showToast } = useToast();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('todos');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    showToast('🖨️ Enviando recibos de nómina a la impresora...', 'success');
  };

  const displayedWorkers = selectedWorkerId === 'todos'
    ? workersList
    : workersList.filter(w => w.id === selectedWorkerId);

  const calcNeto = (t: Trabajador) => {
    const horasExtra = (t.horasExtraSemana ?? 0) * (t.tarifaHoraExtra ?? 0);
    const descuentos = t.descuentosSemana ?? 0;
    return t.sueldoFiscal + t.sueldoEfectivo + horasExtra - descuentos;
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
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Recibos de Nómina y Sobres de Efectivo</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Semana 17 (21 al 26 de Abril 2025) · SVR Constructora
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={selectedWorkerId}
              onChange={e => setSelectedWorkerId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="todos">Todos ({workersList.length} empleados)</option>
              {workersList.map(w => (
                <option key={w.id} value={w.id}>{w.nombre} — {w.puesto}</option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" /> Imprimir Recibos
            </button>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipts Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {displayedWorkers.map(t => {
              const extras = (t.horasExtraSemana ?? 0) * (t.tarifaHoraExtra ?? 0);
              const descs = t.descuentosSemana ?? 0;
              const neto = calcNeto(t);
              const efectivoEnSobre = t.sueldoEfectivo + extras - descs;

              return (
                <div 
                  key={t.id}
                  className="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-300 shadow-sm print:border-slate-400 print:shadow-none print:break-inside-avoid relative overflow-hidden"
                >
                  {/* Watermark / Logo background */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm tracking-tight uppercase">SVR CONSTRUCTORA S.A. DE C.V.</h4>
                      <p className="text-[10px] font-bold text-slate-400">RECIBO DE NÓMINA SEMANAL · SEMANA 17</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                        {t.metodoPago}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">FOLIO: REC-{t.id}-S17</p>
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="bg-slate-50 rounded-2xl p-3 mb-4 border border-slate-100 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{t.nombre}</p>
                        <p className="text-[11px] font-semibold text-slate-600">{t.puesto}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-medium">
                        <p>ID: <strong className="text-slate-800">{t.id}</strong></p>
                        <p>Obra: <strong className="text-slate-800">{t.proyectos[0] ?? 'General'}</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Sueldo Fiscal (Transferencia SPEI):</span>
                      <span className="font-bold text-slate-800">{fmt.format(t.sueldoFiscal)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Complemento en Efectivo:</span>
                      <span className="font-bold text-primary">{fmt.format(t.sueldoEfectivo)}</span>
                    </div>

                    {extras > 0 && (
                      <div className="flex justify-between text-green-700 font-semibold">
                        <span>Horas Extras ({t.horasExtraSemana}h @ ${t.tarifaHoraExtra}/hr):</span>
                        <span className="font-black">+{fmt.format(extras)}</span>
                      </div>
                    )}

                    {descs > 0 && (
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>Deducciones / Faltas ({t.conceptoDescuento}):</span>
                        <span className="font-black">−{fmt.format(descs)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black text-slate-900 text-sm">
                      <span>TOTAL NETO PERCIBIDO:</span>
                      <span className="text-base text-slate-900">{fmt.format(neto)}</span>
                    </div>
                  </div>

                  {/* Delivery Breakdown Box */}
                  <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 text-[11px] font-bold text-orange-950 flex justify-between mb-6">
                    <span>💵 Efectivo en Sobre: <strong>{fmt.format(efectivoEnSobre)}</strong></span>
                    <span>💳 SPEI Tarjeta: <strong>{fmt.format(t.sueldoFiscal)}</strong></span>
                  </div>

                  {/* Signature Line */}
                  <div className="pt-4 border-t border-slate-200 text-center">
                    <div className="w-48 h-8 mx-auto border-b border-slate-400 mb-1" />
                    <p className="text-[10px] font-bold text-slate-700">FIRMA DE CONFORMIDAD DEL TRABAJADOR</p>
                    <p className="text-[8px] text-slate-400">Recibí a mi entera satisfacción el importe neto desglosado en este recibo.</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            Se generaron <strong>{displayedWorkers.length} recibos</strong> listos para impresión en papel carta o sobre.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" /> Imprimir Todos
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
