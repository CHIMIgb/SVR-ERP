"use client";

import React, { useState } from 'react';
import type { NominaRowDTO } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Portal } from '@/components/ui/Portal';
import { formatCurrency } from '@/lib/formatters';

interface RecibosNominaModalProps {
  isOpen: boolean;
  onClose: () => void;
  workersList: NominaRowDTO[];
  periodoLabel: string;
  periodoCodigo: string;
  /** Abre el modal mostrando solo el recibo de este registro de nómina (si no, todos). */
  trabajadorInicialId?: string;
}

/** Lo que va en el sobre: el neto menos lo que ya se transfirió por SPEI (igual que calcula la API). */
function efectivoEnSobre(t: NominaRowDTO): number {
  return t.sueldoEfectivo + t.totalPercepciones - t.totalDeducciones;
}

/**
 * Recibo en papel. Siempre blanco, también en modo oscuro: es un documento que se imprime y firma.
 */
function Recibo({ t, periodoLabel, periodoCodigo }: { t: NominaRowDTO; periodoLabel: string; periodoCodigo: string }) {
  const sobre = efectivoEnSobre(t);
  return (
    <article className="bg-white text-slate-900 rounded-2xl p-5 border-2 border-dashed border-slate-300 break-inside-avoid print:rounded-none print:border-slate-400">
      <header className="border-b border-slate-200 pb-3 mb-3">
        <div className="flex items-start justify-between gap-3">
          <h4 className="min-w-0 font-black text-sm uppercase leading-tight">SVR Constructora S.A. de C.V.</h4>
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{t.metodoPago}</span>
        </div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Recibo de nómina · {periodoLabel.split(':')[0]}</p>
        <p className="text-[9px] text-slate-400 font-mono break-all">Folio {periodoCodigo}-{t.id.slice(0, 8)}</p>
      </header>

      <div className="flex items-start justify-between gap-3 mb-3 text-xs">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{t.trabajadorNombre}</p>
          <p className="text-slate-600 truncate">{t.puesto}</p>
        </div>
        <p className="shrink-0 text-right text-slate-500">
          Días laborados <span className="font-semibold text-slate-800">{t.diasTrabajados}/6</span>
        </p>
      </div>

      <dl className="space-y-1 text-xs mb-3">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-600">Sueldo fiscal (transferencia SPEI)</dt>
          <dd className="font-semibold tabular-nums">{formatCurrency(t.sueldoFiscal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-600">Complemento en efectivo</dt>
          <dd className="font-semibold tabular-nums">{formatCurrency(t.sueldoEfectivo)}</dd>
        </div>
        {t.percepciones.map((p) => (
          <div key={p.id} className="flex justify-between gap-3">
            <dt className="text-slate-600 min-w-0 break-words">{p.concepto}</dt>
            <dd className="font-semibold tabular-nums text-green-700">+{formatCurrency(p.monto)}</dd>
          </div>
        ))}
        {t.deducciones.map((d) => (
          <div key={d.id} className="flex justify-between gap-3">
            <dt className="text-slate-600 min-w-0 break-words">{d.concepto}</dt>
            <dd className="font-semibold tabular-nums text-red-700">−{formatCurrency(d.monto)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 pt-2 mt-1 border-t border-slate-200 text-sm font-bold">
          <dt>Total neto</dt>
          <dd className="tabular-nums">{formatCurrency(t.totalNeto)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-1">
        <span>Efectivo en sobre: <strong className="tabular-nums">{formatCurrency(sobre)}</strong></span>
        <span>Transferencia: <strong className="tabular-nums">{formatCurrency(t.sueldoFiscal)}</strong></span>
      </div>
      {sobre < 0 && (
        <p className="text-[10px] text-red-700 mb-1">
          Las deducciones superan el efectivo: la diferencia se debe cubrir de la transferencia.
        </p>
      )}

      <footer className="pt-6 text-center">
        <div className="w-48 h-px mx-auto bg-slate-400 mb-1" />
        <p className="text-[10px] font-semibold text-slate-700">Firma de conformidad del trabajador</p>
        <p className="text-[9px] text-slate-400">Recibí a mi entera satisfacción el importe neto desglosado en este recibo.</p>
      </footer>
    </article>
  );
}

export default function RecibosNominaModal({
  isOpen,
  onClose,
  workersList,
  periodoLabel,
  periodoCodigo,
  trabajadorInicialId,
}: RecibosNominaModalProps) {
  const { showToast } = useToast();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(trabajadorInicialId ?? 'todos');

  // Si el trabajador elegido ya no está en la lista (p. ej. se recargó la nómina), se muestran todos.
  const seleccion = selectedWorkerId !== 'todos' && workersList.some((w) => w.id === selectedWorkerId)
    ? selectedWorkerId
    : 'todos';
  const displayedWorkers = seleccion === 'todos' ? workersList : workersList.filter((w) => w.id === seleccion);

  const imprimir = () => {
    try {
      window.print();
    } catch (error) {
      showToast(`El navegador no permitió imprimir: ${error instanceof Error ? error.message : 'error desconocido'}.`, 'error');
    }
  };

  const opciones = [
    { value: 'todos', label: `Todos (${workersList.length})` },
    ...workersList.map((w) => ({ value: w.id, label: w.trabajadorNombre })),
  ];

  return (
    <>
      <Modal open={isOpen} onClose={onClose} size="full">
        <ModalHeader title="Recibos y sobres de efectivo" subtitle={periodoLabel} onClose={onClose} />

        <ModalBody className="space-y-4">
          {workersList.length === 0 ? (
            <p className="text-sm text-ui-500 py-8 text-center">No hay trabajadores en la nómina de este periodo.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="sm:w-72">
                  <Select
                    aria-label="Recibos a mostrar"
                    placeholder="Trabajador"
                    value={seleccion}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    options={opciones}
                  />
                </div>
                <Button onClick={imprimir} disabled={displayedWorkers.length === 0} className="w-full sm:w-auto">
                  Imprimir {displayedWorkers.length === 1 ? 'recibo' : `${displayedWorkers.length} recibos`}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 sm:p-4 rounded-xl bg-ui-100">
                {displayedWorkers.map((t) => (
                  <Recibo key={t.id} t={t} periodoLabel={periodoLabel} periodoCodigo={periodoCodigo} />
                ))}
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <p className="text-xs text-ui-500 sm:mr-auto text-center sm:text-left">
            Hoja carta, dos recibos por fila. Se imprimen solo los recibos, sin el resto de la pantalla.
          </p>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </ModalFooter>
      </Modal>

      {/* Copia solo para imprimir (ver `.solo-impresion` en globals.css). */}
      {isOpen && displayedWorkers.length > 0 && (
        <Portal>
          <div className="solo-impresion">
            <div className="grid grid-cols-2 gap-4">
              {displayedWorkers.map((t) => (
                <Recibo key={t.id} t={t} periodoLabel={periodoLabel} periodoCodigo={periodoCodigo} />
              ))}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
