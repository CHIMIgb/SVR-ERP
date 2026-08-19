"use client";

import React, { useState } from 'react';
import { 
  X, Printer, DollarSign, Calendar, ShieldCheck, 
  AlertTriangle, FileText, UserX, CheckCircle2,
  Building2, Scale, Calculator, ArrowRight, Download
} from 'lucide-react';
import { Trabajador, trabajadores } from '@/lib/data';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';

interface LiquidacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajador?: Trabajador | null;
  onConfirmarBaja: (trabajadorId: string, tipo: string, montoTotal: number) => void;
}

export default function LiquidacionModal({
  isOpen,
  onClose,
  trabajador: initialTrabajador,
  onConfirmarBaja
}: LiquidacionModalProps) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    initialTrabajador?.id ?? trabajadores[0]?.id ?? ''
  );
  
  const worker = trabajadores.find(t => t.id === selectedWorkerId) ?? initialTrabajador ?? trabajadores[0];

  // Parameters
  const [tipoTerminacion, setTipoTerminacion] = useState<'Despido' | 'Renuncia' | 'Convenio'>('Despido');
  const [fechaBaja, setFechaBaja] = useState(new Date().toISOString().split('T')[0]);
  const [diasTrabajadosPeriodo, setDiasTrabajadosPeriodo] = useState('6');
  const [diasVacacionesPendientes, setDiasVacacionesPendientes] = useState('8');
  const [deduccionesPrestamos, setDeduccionesPrestamos] = useState('0');
  const [motivoBaja, setMotivoBaja] = useState('Recorte de personal / Cierre de frente de obra');
  const [viewMode, setViewMode] = useState<'calculadora' | 'carta_firma'>('calculadora');

  if (!isOpen || !worker) return null;

  // Antigüedad calculation
  const fechaIngreso = new Date(worker.fechaContratacion ?? '2023-01-15');
  const fechaFin = new Date(fechaBaja);
  const diffTime = Math.max(0, fechaFin.getTime() - fechaIngreso.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const aniosAntiguedad = Math.max(0.1, +(diffDays / 365.25).toFixed(2));

  // Sueldos
  const sueldoSemanalTotal = worker.sueldoFiscal + worker.sueldoEfectivo;
  const sueldoDiario = +(sueldoSemanalTotal / 6).toFixed(2); // Sueldo diario real
  const sueldoDiarioFiscal = +(worker.sueldoFiscal / 6).toFixed(2);

  // Cálculos de Ley Federal del Trabajo (LFT)
  const diasPeriodo = parseFloat(diasTrabajadosPeriodo) || 0;
  const diasVac = parseFloat(diasVacacionesPendientes) || 0;
  const prestamos = parseFloat(deduccionesPrestamos) || 0;

  // 1. Finiquito Proporcional
  const montoDiasTrabajados = +(diasPeriodo * sueldoDiario).toFixed(2);
  // Aguinaldo: 15 días / 365 * días trabajados en el año actual (aprox. 115 días si estamos en abril)
  const diasAguinaldoProp = +((diffDays % 365) * (15 / 365)).toFixed(2);
  const montoAguinaldo = +(diasAguinaldoProp * sueldoDiario).toFixed(2);
  // Vacaciones no disfrutadas + Prima Vacacional (25%)
  const montoVacaciones = +(diasVac * sueldoDiario).toFixed(2);
  const montoPrimaVacacional = +(montoVacaciones * 0.25).toFixed(2);

  const subtotalFiniquito = montoDiasTrabajados + montoAguinaldo + montoVacaciones + montoPrimaVacacional;

  // 2. Indemnizaciones de Ley (Solo en Despido Injustificado / Liquidación)
  let montoIndemnizacion90Dias = 0;
  let montoIndemnizacion20DiasPorAno = 0;
  let montoPrimaAntiguedad = 0;

  if (tipoTerminacion === 'Despido') {
    montoIndemnizacion90Dias = +(90 * sueldoDiario).toFixed(2); // 3 meses de salario
    montoIndemnizacion20DiasPorAno = +(20 * aniosAntiguedad * sueldoDiario).toFixed(2); // 20 días por año
    // Prima de antigüedad: 12 días por año (topado a 2 salarios mínimos aprox $500/día)
    const salarioTopado = Math.min(sueldoDiario, 498);
    montoPrimaAntiguedad = +(12 * aniosAntiguedad * salarioTopado).toFixed(2);
  } else if (tipoTerminacion === 'Convenio') {
    // Convenio acordado: Finiquito + 45 días de gratificación
    montoIndemnizacion90Dias = +(45 * sueldoDiario).toFixed(2);
  }

  const subtotalIndemnizaciones = montoIndemnizacion90Dias + montoIndemnizacion20DiasPorAno + montoPrimaAntiguedad;
  const granTotalNeto = Math.max(0, +(subtotalFiniquito + subtotalIndemnizaciones - prestamos).toFixed(2));

  const handlePrint = () => {
    window.print();
  };

  const handleEjecutarBaja = () => {
    onConfirmarBaja(worker.id, tipoTerminacion, granTotalNeto);
    showToast(`⚖️ Baja y Liquidación de ${worker.nombre} registrada por ${fmt.format(granTotalNeto)}.`, 'success');
    addNotification({
      titulo: `⚖️ Empleado Liquidado: ${worker.nombre}`,
      mensaje: `Se procesó la baja por ${tipoTerminacion}. Importe total a liquidar: ${fmt.format(granTotalNeto)}. Equipo liberado.`,
      tipo: 'alerta'
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh] animate-[fadeScaleIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Calculadora de Finiquito y Liquidación Laboral
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/40">
                  Ley Federal del Trabajo
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Cálculo de indemnizaciones constitucionales, partes proporcionales y generación de convenio con firma.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('calculadora')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                  viewMode === 'calculadora' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Calculadora
              </button>
              <button
                onClick={() => setViewMode('carta_firma')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                  viewMode === 'carta_firma' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🖨️ Carta con Firma
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* ── VISTA 1: CALCULADORA Y PARÁMETROS ── */}
          {viewMode === 'calculadora' && (
            <>
              {/* Worker & Parameters Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Worker Selector */}
                <div className="card p-4 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Empleado a Liquidar</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary"
                    value={selectedWorkerId}
                    onChange={e => setSelectedWorkerId(e.target.value)}
                  >
                    {trabajadores.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} — {t.puesto} ({t.categoriaPuesto})</option>
                    ))}
                  </select>

                  <div className="pt-2 text-[11px] space-y-1 text-slate-500">
                    <p>Fecha Ingreso: <strong className="text-slate-800">{worker.fechaContratacion ?? '2023-01-15'}</strong></p>
                    <p>Antigüedad: <strong className="text-slate-800">{aniosAntiguedad} años</strong> ({diffDays} días)</p>
                    <p>Sueldo Diario: <strong className="text-emerald-700">{fmt.format(sueldoDiario)}/día</strong></p>
                    {worker.maquinaAsignadaNombre && (
                      <p className="text-orange-700 font-bold">🚜 Equipo Asignado: {worker.maquinaAsignadaNombre}</p>
                    )}
                  </div>
                </div>

                {/* Separation Type */}
                <div className="card p-4 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Motivo de Separación</label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'Despido', label: '⚖️ Despido / Liquidación LFT', desc: 'Indemnización 90 días + 20 días/año' },
                      { id: 'Renuncia', label: '📄 Renuncia Voluntaria / Fin Obra', desc: 'Solo finiquito proporcional' },
                      { id: 'Convenio', label: '🤝 Convenio Mutuo Acordado', desc: 'Finiquito + 45 días gratificación' }
                    ].map(t => (
                      <label 
                        key={t.id}
                        className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                          tipoTerminacion === t.id 
                            ? 'border-primary bg-primary/5 text-slate-900 font-bold' 
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipoTerminacion"
                          checked={tipoTerminacion === t.id}
                          onChange={() => setTipoTerminacion(t.id as any)}
                          className="mt-0.5"
                        />
                        <div className="text-xs">
                          <p className="font-bold">{t.label}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{t.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Adjustments */}
                <div className="card p-4 space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Variables de Ajuste</label>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500">Días laborados semana actual</span>
                      <input
                        type="number"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={diasTrabajadosPeriodo}
                        onChange={e => setDiasTrabajadosPeriodo(e.target.value)}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500">Vacaciones pendientes (días)</span>
                      <input
                        type="number"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        value={diasVacacionesPendientes}
                        onChange={e => setDiasVacacionesPendientes(e.target.value)}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500">Deducción / Préstamo ($ MXN)</span>
                      <input
                        type="number"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-red-600"
                        value={deduccionesPrestamos}
                        onChange={e => setDeduccionesPrestamos(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Detailed Financial Breakdown Card */}
              <div className="card p-6 space-y-4 border border-slate-200 shadow-sm bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-black text-slate-900 text-base">Desglose de Conceptos a Liquidar</h4>
                  <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Sueldo Base Diario: {fmt.format(sueldoDiario)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left: Finiquito Proporcional */}
                  <div className="space-y-2 text-xs">
                    <p className="font-black uppercase text-slate-400 text-[10px] tracking-wider border-b border-slate-100 pb-1">
                      1. Finiquito de Prestaciones Devengadas
                    </p>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-600">Sueldo Días Laborados ({diasPeriodo} días):</span>
                      <strong className="text-slate-900">{fmt.format(montoDiasTrabajados)}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-600">Aguinaldo Proporcional ({diasAguinaldoProp} días):</span>
                      <strong className="text-slate-900">{fmt.format(montoAguinaldo)}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-600">Vacaciones No Gozadas ({diasVac} días):</span>
                      <strong className="text-slate-900">{fmt.format(montoVacaciones)}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-600">Prima Vacacional (25%):</span>
                      <strong className="text-slate-900">{fmt.format(montoPrimaVacacional)}</strong>
                    </div>

                    <div className="flex justify-between pt-1 font-black text-slate-800">
                      <span>Subtotal Finiquito:</span>
                      <span className="text-emerald-700">{fmt.format(subtotalFiniquito)}</span>
                    </div>
                  </div>

                  {/* Right: Indemnizaciones LFT */}
                  <div className="space-y-2 text-xs">
                    <p className="font-black uppercase text-slate-400 text-[10px] tracking-wider border-b border-slate-100 pb-1">
                      2. Indemnizaciones y Gratificaciones
                    </p>

                    {tipoTerminacion === 'Despido' ? (
                      <>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">Indemnización Constitucional (90 días):</span>
                          <strong className="text-red-700 font-bold">{fmt.format(montoIndemnizacion90Dias)}</strong>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">20 días por año ({aniosAntiguedad} años):</span>
                          <strong className="text-red-700 font-bold">{fmt.format(montoIndemnizacion20DiasPorAno)}</strong>
                        </div>

                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">Prima de Antigüedad (12 días/año topada):</span>
                          <strong className="text-red-700 font-bold">{fmt.format(montoPrimaAntiguedad)}</strong>
                        </div>
                      </>
                    ) : tipoTerminacion === 'Convenio' ? (
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Gratificación por Convenio (45 días):</span>
                        <strong className="text-blue-700 font-bold">{fmt.format(montoIndemnizacion90Dias)}</strong>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-400 font-medium">
                        No aplican indemnizaciones constitucionales por tratarse de Renuncia Voluntaria o Fin de Obra.
                      </div>
                    )}

                    {prestamos > 0 && (
                      <div className="flex justify-between py-1 border-b border-slate-50 text-red-600 font-bold">
                        <span>(−) Deducciones / Préstamos:</span>
                        <span>−{fmt.format(prestamos)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-1 font-black text-slate-800">
                      <span>Subtotal Indemnización:</span>
                      <span className="text-red-700">{fmt.format(subtotalIndemnizaciones)}</span>
                    </div>
                  </div>

                </div>

                {/* Grand Total Bar */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 shadow-lg">
                  <div>
                    <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">
                      Total Neto a Pagar al Trabajador
                    </span>
                    <h3 className="text-3xl font-black text-emerald-400">
                      {fmt.format(granTotalNeto)}
                    </h3>
                  </div>

                  <div className="text-right text-xs font-bold text-slate-300">
                    <p>Sueldo Fiscal (SPEI): <span className="text-white">{fmt.format(Math.min(worker.sueldoFiscal * 2, granTotalNeto))}</span></p>
                    <p>Efectivo en Sobre: <span className="text-orange-400">{fmt.format(Math.max(0, granTotalNeto - (worker.sueldoFiscal * 2)))}</span></p>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ── VISTA 2: CARTA FINIQUITO FORMAL CON FIRMA PARA IMPRIMIR ── */}
          {viewMode === 'carta_firma' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-slate-900 space-y-6 font-serif">
              
              {/* Header Empresa */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight font-sans text-slate-900">CONSTRUCTORA SVR S.A. DE C.V.</h2>
                  <p className="text-xs font-sans text-slate-500 font-medium">R.F.C. SVR-180420-KL9 · Infraestructura &amp; Movimiento de Tierras</p>
                  <p className="text-xs font-sans text-slate-500">Oficina Central: Av. Insurgentes Sur 1450, Piso 8, CDMX</p>
                </div>
                <div className="text-right font-sans">
                  <span className="text-xs font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-md">
                    CONVENIO DE FINIQUITO
                  </span>
                  <p className="text-xs font-bold text-slate-500 mt-1">Fecha: {fechaBaja}</p>
                </div>
              </div>

              {/* Declaración Legal */}
              <div className="space-y-3 text-xs leading-relaxed text-slate-800 text-justify">
                <p>
                  En la Ciudad de México, a <strong>{fechaBaja}</strong>, se reúnen por una parte <strong>CONSTRUCTORA SVR S.A. DE C.V.</strong> (en lo sucesivo "EL PATRÓN") y por la otra el C. <strong>{worker.nombre}</strong> (en lo sucesivo "EL TRABAJADOR"), quien desempeñaba el puesto de <strong>{worker.puesto} ({worker.categoriaPuesto})</strong> habiendo ingresado a laborar el día <strong>{worker.fechaContratacion ?? '2023-01-15'}</strong> con una antigüedad de <strong>{aniosAntiguedad} años</strong>.
                </p>

                <p>
                  Ambas partes convienen en dar por terminada la relación de trabajo de forma definitiva bajo el concepto de <strong>{tipoTerminacion === 'Despido' ? 'LIQUIDACIÓN E INDEMNIZACIÓN LABORAL' : tipoTerminacion === 'Renuncia' ? 'RENUNCIA VOLUNTARIA' : 'CONVENIO MUTUO'}</strong>.
                </p>

                <p>
                  EL TRABAJADOR manifiesta recibir en este acto a su entera satisfacción la cantidad neta total de:
                </p>

                {/* Monto Destacado */}
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

              {/* Firmas */}
              <div className="grid grid-cols-2 gap-12 pt-8 font-sans">
                <div className="text-center space-y-2">
                  <div className="border-b-2 border-slate-900 h-16 flex items-end justify-center pb-1">
                    <span className="text-xs font-mono text-slate-400">____________________________</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 uppercase">{worker.nombre}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Firma del Trabajador (Recibí de Conformidad)</p>
                </div>

                <div className="text-center space-y-2">
                  <div className="border-b-2 border-slate-900 h-16 flex items-end justify-center pb-1">
                    <span className="text-xs font-mono text-slate-400">____________________________</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 uppercase">Ing. Carlos Morales / RRHH</p>
                  <p className="text-[10px] text-slate-500 font-medium">Por CONSTRUCTORA SVR S.A. DE C.V.</p>
                </div>
              </div>

              {/* Botón Imprimir */}
              <div className="pt-4 flex justify-end gap-2 font-sans border-t border-slate-100">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-orange-400" /> Imprimir Carta Finiquito
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
          <div className="text-xs text-slate-300">
            Al confirmar la liquidación, el trabajador pasará a estatus <strong>Inactivo</strong> y se liberará su equipo asignado.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleEjecutarBaja}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-red-600/30"
            >
              <UserX className="w-4 h-4" /> Confirmar Baja y Liquidación ({fmt.format(granTotalNeto)})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
