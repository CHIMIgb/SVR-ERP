"use client";

import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import type { NominaRowDTO } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface RecibosNominaModalProps {
  isOpen: boolean;
  onClose: () => void;
  workersList: NominaRowDTO[];
  periodoLabel: string;
  periodoCodigo: string;
}

export default function RecibosNominaModal({
  isOpen,
  onClose,
  workersList,
  periodoLabel,
  periodoCodigo,
}: RecibosNominaModalProps) {
  const { showToast } = useToast();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('todos');

  const handlePrint = () => {
    window.print();
    showToast('Enviando recibos de nómina a la impresora...', 'success');
  };

  const displayedWorkers = selectedWorkerId === 'todos'
    ? workersList
    : workersList.filter((w) => w.id === selectedWorkerId);

  return (
    <Modal open={isOpen} onClose={onClose} size="full" contentClassName="overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Recibos de Nómina y Sobres de Efectivo</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {periodoLabel} · SVR Constructora
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="todos">Todos ({workersList.length} empleados)</option>
              {workersList.map((w) => (
                <option key={w.id} value={w.id}>{w.trabajadorNombre} — {w.puesto}</option>
              ))}
            </select>

            <Button size="sm" icon={<Printer size={14} />} onClick={handlePrint}>
              Imprimir Recibos
            </Button>
          </div>
        </div>

        {/* Printable Receipts Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {displayedWorkers.map((t) => {
              const efectivoEnSobre = t.sueldoEfectivo + t.totalPercepciones - t.totalDeducciones;

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-300 shadow-sm print:border-slate-400 print:shadow-none print:break-inside-avoid relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm tracking-tight uppercase">SVR CONSTRUCTORA S.A. DE C.V.</h4>
                      <p className="text-[10px] font-bold text-slate-400">RECIBO DE NÓMINA · {periodoLabel.split(':')[0]?.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                        {t.metodoPago}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">FOLIO: {periodoCodigo}-{t.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 mb-4 border border-slate-100 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{t.trabajadorNombre}</p>
                        <p className="text-[11px] font-semibold text-slate-600">{t.puesto}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-medium">
                        <p>Categoría: <strong className="text-slate-800">{t.categoriaPuesto}</strong></p>
                        <p>Días laborados: <strong className="text-slate-800">{t.diasTrabajados}/6</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Sueldo Fiscal (Transferencia SPEI):</span>
                      <span className="font-bold text-slate-800">{fmt.format(t.sueldoFiscal)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Complemento en Efectivo:</span>
                      <span className="font-bold text-primary">{fmt.format(t.sueldoEfectivo)}</span>
                    </div>

                    {t.percepciones.map((p) => (
                      <div key={p.id} className="flex justify-between text-green-700 font-semibold">
                        <span>{p.concepto}:</span>
                        <span className="font-black">+{fmt.format(p.monto)}</span>
                      </div>
                    ))}

                    {t.deducciones.map((d) => (
                      <div key={d.id} className="flex justify-between text-red-600 font-semibold">
                        <span>{d.concepto}:</span>
                        <span className="font-black">−{fmt.format(d.monto)}</span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black text-slate-900 text-sm">
                      <span>TOTAL NETO PERCIBIDO:</span>
                      <span className="text-base text-slate-900">{fmt.format(t.totalNeto)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 text-[11px] font-bold text-orange-950 flex justify-between mb-6">
                    <span>Efectivo en Sobre: <strong>{fmt.format(efectivoEnSobre)}</strong></span>
                    <span>SPEI Tarjeta: <strong>{fmt.format(t.sueldoFiscal)}</strong></span>
                  </div>

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
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            <Button icon={<Printer size={16} />} onClick={handlePrint}>Imprimir Todos</Button>
          </div>
        </div>

    </Modal>
  );
}
