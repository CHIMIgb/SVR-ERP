"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Printer, UserX, Loader2 } from 'lucide-react';
import type { TrabajadorDTO } from '@/lib/api';
import { trabajadoresApi } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface LiquidacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajador?: TrabajadorDTO | null;
  onLiquidado: () => void;
}

export default function LiquidacionModal({
  isOpen,
  onClose,
  trabajador: initialTrabajador,
  onLiquidado,
}: LiquidacionModalProps) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  // Lista completa de trabajadores activos para el selector — independiente
  // de cualquier paginación que tenga la página que abre este modal.
  const [activos, setActivos] = useState<TrabajadorDTO[]>(initialTrabajador ? [initialTrabajador] : []);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(initialTrabajador?.id ?? '');

  const fetchActivos = useCallback(async () => {
    const res = await trabajadoresApi.listar({ estado: 'Activo', limit: 100 });
    if (res.success) {
      setActivos(res.data.items);
      setSelectedWorkerId((prev) => prev || initialTrabajador?.id || res.data.items[0]?.id || '');
    }
  }, [initialTrabajador?.id]);

  useEffect(() => {
    if (isOpen) fetchActivos();
  }, [isOpen, fetchActivos]);

  const worker = activos.find((t) => t.id === selectedWorkerId) ?? initialTrabajador ?? activos[0];

  const [tipoTerminacion, setTipoTerminacion] = useState<'Despido' | 'Renuncia' | 'Convenio'>('Despido');
  const [diasTrabajadosPeriodo, setDiasTrabajadosPeriodo] = useState('6');
  const [diasVacacionesPendientes, setDiasVacacionesPendientes] = useState('8');
  const [deduccionesPrestamos, setDeduccionesPrestamos] = useState('0');
  const [viewMode, setViewMode] = useState<'calculadora' | 'carta_firma'>('calculadora');
  const [submitting, setSubmitting] = useState(false);

  const fechaBaja = new Date().toISOString().split('T')[0];

  const handlePrint = () => window.print();

  const handleEjecutarBaja = async () => {
    if (!worker) return;
    setSubmitting(true);
    const res = await trabajadoresApi.liquidar(worker.id, {
      tipoTerminacion,
      diasTrabajadosPeriodo: parseFloat(diasTrabajadosPeriodo) || 0,
      diasVacacionesPendientes: parseFloat(diasVacacionesPendientes) || 0,
      deduccionesPrestamos: parseFloat(deduccionesPrestamos) || 0,
    });
    setSubmitting(false);

    if (res.success) {
      showToast(`Baja y liquidación de ${worker.nombre} registrada por ${fmt.format(res.data.granTotalNeto)}.`, 'success');
      addNotification({
        titulo: `Empleado Liquidado: ${worker.nombre}`,
        mensaje: `Se procesó la baja por ${tipoTerminacion}. Importe total a liquidar: ${fmt.format(res.data.granTotalNeto)}. Equipo liberado.`,
        tipo: 'alerta',
      });
      onLiquidado();
      onClose();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (!worker) return null;

  // Cálculo client-side solo para PREVISUALIZAR mientras se ajustan los
  // parámetros — el servidor recalcula todo con la misma fórmula al confirmar
  // y es la única fuente de verdad de lo que finalmente se paga y se audita.
  const fechaIngreso = new Date(worker.fechaContratacion ?? '2023-01-15');
  const diffDays = Math.max(0, Math.ceil((new Date(fechaBaja).getTime() - fechaIngreso.getTime()) / 86400000));
  const aniosAntiguedad = Math.max(0.1, +(diffDays / 365.25).toFixed(2));
  const sueldoDiario = +((worker.sueldoFiscal + worker.sueldoEfectivo) / 6).toFixed(2);
  const diasPeriodo = parseFloat(diasTrabajadosPeriodo) || 0;
  const diasVac = parseFloat(diasVacacionesPendientes) || 0;
  const prestamos = parseFloat(deduccionesPrestamos) || 0;
  const montoDiasTrabajados = +(diasPeriodo * sueldoDiario).toFixed(2);
  const diasAguinaldoProp = +((diffDays % 365) * (15 / 365)).toFixed(2);
  const montoAguinaldo = +(diasAguinaldoProp * sueldoDiario).toFixed(2);
  const montoVacaciones = +(diasVac * sueldoDiario).toFixed(2);
  const montoPrimaVacacional = +(montoVacaciones * 0.25).toFixed(2);
  const subtotalFiniquito = montoDiasTrabajados + montoAguinaldo + montoVacaciones + montoPrimaVacacional;
  let montoIndemnizacion90Dias = 0;
  let montoIndemnizacion20DiasPorAno = 0;
  let montoPrimaAntiguedad = 0;
  if (tipoTerminacion === 'Despido') {
    montoIndemnizacion90Dias = +(90 * sueldoDiario).toFixed(2);
    montoIndemnizacion20DiasPorAno = +(20 * aniosAntiguedad * sueldoDiario).toFixed(2);
    const salarioTopado = Math.min(sueldoDiario, 498);
    montoPrimaAntiguedad = +(12 * aniosAntiguedad * salarioTopado).toFixed(2);
  } else if (tipoTerminacion === 'Convenio') {
    montoIndemnizacion90Dias = +(45 * sueldoDiario).toFixed(2);
  }
  const subtotalIndemnizaciones = montoIndemnizacion90Dias + montoIndemnizacion20DiasPorAno + montoPrimaAntiguedad;
  const granTotalNeto = Math.max(0, +(subtotalFiniquito + subtotalIndemnizaciones - prestamos).toFixed(2));

  return (
    <Modal open={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title="Calculadora de Finiquito y Liquidación Laboral"
        subtitle="Cálculo de indemnizaciones constitucionales, partes proporcionales y generación de convenio con firma (Ley Federal del Trabajo)."
        onClose={onClose}
      />

      <ModalBody>
        <div className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button onClick={() => setViewMode('calculadora')} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'calculadora' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              Calculadora
            </button>
            <button onClick={() => setViewMode('carta_firma')} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'carta_firma' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              Carta con Firma
            </button>
          </div>

          {viewMode === 'calculadora' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="sm" className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Empleado a Liquidar</label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary" value={selectedWorkerId} onChange={(e) => setSelectedWorkerId(e.target.value)}>
                    {activos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre} — {t.puesto} ({t.categoriaPuesto})</option>
                    ))}
                  </select>

                  <div className="pt-2 text-[11px] space-y-1 text-slate-500">
                    <p>Fecha Ingreso: <strong className="text-slate-800">{worker.fechaContratacion ?? '2023-01-15'}</strong></p>
                    <p>Antigüedad: <strong className="text-slate-800">{aniosAntiguedad} años</strong> ({diffDays} días)</p>
                    <p>Sueldo Diario: <strong className="text-emerald-700">{fmt.format(sueldoDiario)}/día</strong></p>
                    {worker.maquinaAsignadaNombre && <p className="text-orange-700 font-bold">Equipo Asignado: {worker.maquinaAsignadaNombre}</p>}
                  </div>
                </Card>

                <Card padding="sm" className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Motivo de Separación</label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'Despido', label: 'Despido / Liquidación LFT', desc: 'Indemnización 90 días + 20 días/año' },
                      { id: 'Renuncia', label: 'Renuncia Voluntaria / Fin Obra', desc: 'Solo finiquito proporcional' },
                      { id: 'Convenio', label: 'Convenio Mutuo Acordado', desc: 'Finiquito + 45 días gratificación' },
                    ].map((t) => (
                      <label key={t.id} className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all ${tipoTerminacion === t.id ? 'border-primary bg-primary/5 text-slate-900 font-bold' : 'border-slate-200 bg-white text-slate-600'}`}>
                        <input type="radio" name="tipoTerminacion" checked={tipoTerminacion === t.id} onChange={() => setTipoTerminacion(t.id as 'Despido' | 'Renuncia' | 'Convenio')} className="mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold">{t.label}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{t.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </Card>

                <Card padding="sm" className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Variables de Ajuste</label>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500">Días laborados semana actual</span>
                      <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" value={diasTrabajadosPeriodo} onChange={(e) => setDiasTrabajadosPeriodo(e.target.value)} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500">Vacaciones pendientes (días)</span>
                      <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" value={diasVacacionesPendientes} onChange={(e) => setDiasVacacionesPendientes(e.target.value)} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500">Deducción / Préstamo ($ MXN)</span>
                      <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-red-600" value={deduccionesPrestamos} onChange={(e) => setDeduccionesPrestamos(e.target.value)} />
                    </div>
                  </div>
                </Card>
              </div>

              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-slate-900 text-base">Desglose de Conceptos a Liquidar</h4>
                  <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Sueldo Base Diario: {fmt.format(sueldoDiario)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-xs">
                    <p className="font-black uppercase text-slate-400 text-[10px] tracking-wider border-b border-slate-100 pb-1">1. Finiquito de Prestaciones Devengadas</p>
                    <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">Sueldo Días Laborados ({diasPeriodo} días):</span><strong className="text-slate-900">{fmt.format(montoDiasTrabajados)}</strong></div>
                    <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">Aguinaldo Proporcional ({diasAguinaldoProp} días):</span><strong className="text-slate-900">{fmt.format(montoAguinaldo)}</strong></div>
                    <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">Vacaciones No Gozadas ({diasVac} días):</span><strong className="text-slate-900">{fmt.format(montoVacaciones)}</strong></div>
                    <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">Prima Vacacional (25%):</span><strong className="text-slate-900">{fmt.format(montoPrimaVacacional)}</strong></div>
                    <div className="flex justify-between pt-1 font-black text-slate-800"><span>Subtotal Finiquito:</span><span className="text-emerald-700">{fmt.format(subtotalFiniquito)}</span></div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-black uppercase text-slate-400 text-[10px] tracking-wider border-b border-slate-100 pb-1">2. Indemnizaciones y Gratificaciones</p>
                    {tipoTerminacion === 'Despido' ? (
                      <>
                        <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">Indemnización Constitucional (90 días):</span><strong className="text-red-700 font-bold">{fmt.format(montoIndemnizacion90Dias)}</strong></div>
                        <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">20 días por año ({aniosAntiguedad} años):</span><strong className="text-red-700 font-bold">{fmt.format(montoIndemnizacion20DiasPorAno)}</strong></div>
                        <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">Prima de Antigüedad (12 días/año topada):</span><strong className="text-red-700 font-bold">{fmt.format(montoPrimaAntiguedad)}</strong></div>
                      </>
                    ) : tipoTerminacion === 'Convenio' ? (
                      <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-600">Gratificación por Convenio (45 días):</span><strong className="text-blue-700 font-bold">{fmt.format(montoIndemnizacion90Dias)}</strong></div>
                    ) : (
                      <div className="py-6 text-center text-slate-400 font-medium">No aplican indemnizaciones constitucionales por tratarse de Renuncia Voluntaria o Fin de Obra.</div>
                    )}
                    {prestamos > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-50 text-red-600 font-bold"><span>(−) Deducciones / Préstamos:</span><span>−{fmt.format(prestamos)}</span></div>
                    )}
                    <div className="flex justify-between pt-1 font-black text-slate-800"><span>Subtotal Indemnización:</span><span className="text-red-700">{fmt.format(subtotalIndemnizaciones)}</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 shadow-lg">
                  <div>
                    <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">Total Neto a Pagar al Trabajador</span>
                    <h3 className="text-3xl font-black text-emerald-400">{fmt.format(granTotalNeto)}</h3>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-300">
                    <p>Sueldo Fiscal (SPEI): <span className="text-white">{fmt.format(Math.min(worker.sueldoFiscal * 2, granTotalNeto))}</span></p>
                    <p>Efectivo en Sobre: <span className="text-orange-400">{fmt.format(Math.max(0, granTotalNeto - worker.sueldoFiscal * 2))}</span></p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {viewMode === 'carta_firma' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-slate-900 space-y-6 font-serif">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight font-sans text-slate-900">CONSTRUCTORA SVR S.A. DE C.V.</h2>
                  <p className="text-xs font-sans text-slate-500 font-medium">R.F.C. SVR-180420-KL9 · Infraestructura &amp; Movimiento de Tierras</p>
                  <p className="text-xs font-sans text-slate-500">Oficina Central: Av. Insurgentes Sur 1450, Piso 8, CDMX</p>
                </div>
                <div className="text-right font-sans">
                  <span className="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-md">CONVENIO DE FINIQUITO</span>
                  <p className="text-xs font-bold text-slate-500 mt-1">Fecha: {fechaBaja}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-800 text-justify">
                <p>
                  En la Ciudad de México, a <strong>{fechaBaja}</strong>, se reúnen por una parte <strong>CONSTRUCTORA SVR S.A. DE C.V.</strong> (en lo sucesivo &quot;EL PATRÓN&quot;) y por la otra el C. <strong>{worker.nombre}</strong> (en lo sucesivo &quot;EL TRABAJADOR&quot;), quien desempeñaba el puesto de <strong>{worker.puesto} ({worker.categoriaPuesto})</strong> habiendo ingresado a laborar el día <strong>{worker.fechaContratacion ?? '2023-01-15'}</strong> con una antigüedad de <strong>{aniosAntiguedad} años</strong>.
                </p>
                <p>
                  Ambas partes convienen en dar por terminada la relación de trabajo de forma definitiva bajo el concepto de <strong>{tipoTerminacion === 'Despido' ? 'LIQUIDACIÓN E INDEMNIZACIÓN LABORAL' : tipoTerminacion === 'Renuncia' ? 'RENUNCIA VOLUNTARIA' : 'CONVENIO MUTUO'}</strong>.
                </p>
                <p>EL TRABAJADOR manifiesta recibir en este acto a su entera satisfacción la cantidad neta total de:</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 text-center font-sans">
                  <span className="text-xs font-bold uppercase text-slate-500">Cantidad Total Recibida</span>
                  <p className="text-2xl font-black text-slate-900">{fmt.format(granTotalNeto)} MXN</p>
                  <p className="text-[10px] text-slate-600 italic">
                    (Desglose: Finiquito de prestaciones: {fmt.format(subtotalFiniquito)} | Indemnizaciones: {fmt.format(subtotalIndemnizaciones)} | Deducciones: {fmt.format(prestamos)})
                  </p>
                </div>
                <p>
                  EL TRABAJADOR otorga el más amplio finiquito que en derecho proceda a favor de CONSTRUCTORA SVR S.A. DE C.V., manifestando expresamente que durante el tiempo que prestó sus servicios le fueron pagados puntualmente todos sus salarios ordinarios, horas extras, aguinaldos, vacaciones, primas vacacionales y demás prestaciones de ley, no reservándose acción ni derecho alguno de naturaleza civil, laboral, penal o mercantil en contra de la empresa.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-12 pt-8 font-sans">
                <div className="text-center space-y-2">
                  <div className="border-b-2 border-slate-900 h-16 flex items-end justify-center pb-1"><span className="text-xs font-mono text-slate-400">____________________________</span></div>
                  <p className="text-xs font-black text-slate-900 uppercase">{worker.nombre}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Firma del Trabajador (Recibí de Conformidad)</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="border-b-2 border-slate-900 h-16 flex items-end justify-center pb-1"><span className="text-xs font-mono text-slate-400">____________________________</span></div>
                  <p className="text-xs font-black text-slate-900 uppercase">Ing. Carlos Morales / RRHH</p>
                  <p className="text-[10px] text-slate-500 font-medium">Por CONSTRUCTORA SVR S.A. DE C.V.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 font-sans border-t border-slate-100">
                <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>
                  Imprimir Carta Finiquito
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="text-xs text-slate-500 mr-auto">
          Al confirmar la liquidación, el trabajador pasará a estatus <strong>Inactivo</strong> y se liberará su equipo asignado.
        </div>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button
          variant="danger"
          icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
          disabled={submitting}
          onClick={handleEjecutarBaja}
        >
          Confirmar Baja y Liquidación ({fmt.format(granTotalNeto)})
        </Button>
      </ModalFooter>
    </Modal>
  );
}
