"use client";

import React from 'react';
import {
  Calendar, Truck,
  BarChart2, CheckCircle2, AlertCircle, Clock, Users
} from 'lucide-react';
import {
  Proyecto,
  trabajadores as allTrabajadores,
  maquinaria as allMaquinaria,
  despachosFlota
} from '@/lib/data';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Separator } from '@/components/ui/Separator';
import { formatDate } from '@/lib/formatters';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: Proyecto;
}

const estadoBadgeVariant = {
  'En Proceso': 'primary',
  'Finalizado': 'success',
  'Pausado': 'neutral',
} as const;

export default function ProjectDetailsModal({
  isOpen,
  onClose,
  proyecto
}: ProjectDetailsModalProps) {

  // Filter Workers assigned to this project
  const trabajadoresAsignados = allTrabajadores.filter(t =>
    t.proyectos.some(p => proyecto.nombre.toLowerCase().includes(p.toLowerCase()))
  );

  // Filter Machinery assigned via dispatch
  const despachosActivos = despachosFlota.filter(d => d.proyectoId === proyecto.id);
  const maquinariaAsignada = allMaquinaria.filter(m =>
    despachosActivos.some(d => d.maquinaId === m.id)
  );

  // S-Curve calculations
  const historico = proyecto.historicoProgreso || [];
  const hasHistory = historico.length > 0;

  const svgWidth = 540;
  const svgHeight = 240;
  const padX = 40;
  const padY = 30;

  const getX = (idx: number) => padX + (idx / Math.max(1, historico.length - 1)) * (svgWidth - 2 * padX);
  const getY = (val: number) => svgHeight - padY - (val / 100) * (svgHeight - 2 * padY);

  let planPath = "";
  let realPath = "";
  if (hasHistory) {
    planPath = historico.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(h.planificado)}`).join(' ');
    realPath = historico.map((h, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(h.real)}`).join(' ');
  }

  // Financial Health Indices (EVM - Earned Value Management)
  // Valor Ganado (EV) = Presupuesto * Progreso Real
  const valorGanado = proyecto.presupuesto * (proyecto.progreso / 100);
  const costoReal = proyecto.gastado;
  // CPI = EV / AC. If > 1, under budget (good).
  const cpi = costoReal > 0 ? valorGanado / costoReal : 1;

  // Planificado Actual (de la curva S o aproximado)
  const ultimoHito = historico[historico.length - 1];
  const planificadoProgreso = ultimoHito ? ultimoHito.planificado : proyecto.progreso;
  // SPI = EV / PV. If > 1, ahead of schedule.
  const spi = planificadoProgreso > 0 ? proyecto.progreso / planificadoProgreso : 1;

  return (
    <Modal open={isOpen} onClose={onClose} size="full" contentClassName="sm:max-w-4xl">
      <ModalHeader
        title={proyecto.nombre}
        subtitle={`${proyecto.cliente} · ${formatDate(proyecto.fechaInicio)} al ${formatDate(proyecto.fechaFin)}`}
        onClose={onClose}
      />

      <ModalBody>
        {/* Estado */}
        <div className="flex items-center gap-2 mb-5">
          <Badge variant={estadoBadgeVariant[proyecto.estado]} size="md">{proyecto.estado}</Badge>
          <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Vigencia del proyecto
          </span>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1 & 2: S-Curve Graph & Financial Health */}
          <div className="lg:col-span-2 space-y-6">

            {/* S-Curve Card */}
            <Card className="flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Curva S: Progreso de Obra</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Comparativa de avance acumulado Planificado vs. Real</p>
                </div>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="w-3 h-0.5 bg-primary border-t-2 border-primary inline-block" /> Planificado
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <span className="w-3 h-0.5 bg-slate-800 border-t-2 border-slate-800 inline-block" /> Real
                  </span>
                </div>
              </div>

              {/* Chart Plot */}
              <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden">
                {hasHistory ? (
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((val) => (
                      <g key={val}>
                        <line
                          x1={padX}
                          y1={getY(val)}
                          x2={svgWidth - padX}
                          y2={getY(val)}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padX - 8}
                          y={getY(val) + 4}
                          textAnchor="end"
                          className="text-[9px] font-bold fill-slate-400"
                        >
                          {val}%
                        </text>
                      </g>
                    ))}

                    {/* Planned line */}
                    <path
                      d={planPath}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_2px_4px_rgba(249,115,22,0.2)]"
                    />

                    {/* Real line */}
                    <path
                      d={realPath}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_2px_4px_rgba(15,23,42,0.2)]"
                    />

                    {/* Month labels & nodes */}
                    {historico.map((h, i) => {
                      const px = getX(i);
                      const pyPlan = getY(h.planificado);
                      const pyReal = getY(h.real);

                      return (
                        <g key={`${h.fecha}-${i}`}>
                          {/* Label */}
                          <text
                            x={px}
                            y={svgHeight - 10}
                            textAnchor="middle"
                            className="text-[10px] font-black fill-slate-400 uppercase tracking-widest"
                          >
                            {h.fecha}
                          </text>

                          {/* Planned dot */}
                          <circle
                            cx={px}
                            cy={pyPlan}
                            r="4"
                            fill="#ffffff"
                            stroke="#f97316"
                            strokeWidth="2.5"
                            className="cursor-pointer transition-all hover:r-6"
                          />
                          <text x={px} y={pyPlan - 8} textAnchor="middle" className="text-[8px] font-black fill-primary">
                            {h.planificado}%
                          </text>

                          {/* Real dot */}
                          <circle
                            cx={px}
                            cy={pyReal}
                            r="4"
                            fill="#ffffff"
                            stroke="#0f172a"
                            strokeWidth="2.5"
                            className="cursor-pointer transition-all hover:r-6"
                          />
                          <text x={px} y={pyReal + 12} textAnchor="middle" className="text-[8px] font-black fill-slate-800">
                            {h.real}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <EmptyState
                    title="Sin registros históricos"
                    subtitle="Este proyecto aún no tiene hitos de progreso registrados."
                    className="py-8"
                  />
                )}
              </div>
            </Card>

            {/* Financial Health Indices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card padding="sm" className="flex items-start gap-4">
                <div className={`p-3 rounded-xl text-white shrink-0 ${cpi >= 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desempeño Costo (CPI)</span>
                    {cpi >= 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  </div>
                  <h4 className="text-xl font-black text-slate-900">{cpi.toFixed(2)}</h4>
                  <p className="text-[10px] font-medium text-slate-500">
                    {cpi >= 1 ? 'Bajo el presupuesto asignado.' : 'Gastando más de lo planificado.'}
                  </p>
                </div>
              </Card>

              <Card padding="sm" className="flex items-start gap-4">
                <div className={`p-3 rounded-xl text-white shrink-0 ${spi >= 1 ? 'bg-green-500' : 'bg-amber-500'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desempeño Tiempo (SPI)</span>
                    {spi >= 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <h4 className="text-xl font-black text-slate-900">{spi.toFixed(2)}</h4>
                  <p className="text-[10px] font-medium text-slate-500">
                    {spi >= 1 ? 'Al corriente u obra adelantada.' : 'Presenta un desfase de tiempo.'}
                  </p>
                </div>
              </Card>
            </div>

          </div>

          {/* Column 3: Resource Assignments */}
          <div className="space-y-6">

            {/* Financial Summary & Real Profitability */}
            <Card className="bg-slate-900 border-slate-900 text-white space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-black text-white/70 text-xs uppercase tracking-widest">
                  Rentabilidad y Costo Real
                </h3>
                <Badge
                  variant={(proyecto.margenUtilidadPorcentaje ?? 15) >= 20 ? 'success' : (proyecto.margenUtilidadPorcentaje ?? 15) > 0 ? 'warning' : 'error'}
                  size="sm"
                >
                  Margen: +{proyecto.margenUtilidadPorcentaje ?? 15}%
                </Badge>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-white/60">Presupuesto Contratado:</span>
                  <span className="font-black text-white">{formatCurrency(proyecto.presupuesto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-emerald-400">Ingreso Facturado/Cobrado:</span>
                  <span className="font-black text-emerald-400">{formatCurrency(proyecto.ingresoCobrado ?? proyecto.presupuesto * 0.8)}</span>
                </div>

                <Separator className="bg-white/10 my-2" />

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-white/70">
                    <span>👷 Nómina y Horas Extras:</span>
                    <span className="font-bold text-white">{formatCurrency(proyecto.gastoNomina ?? 380000)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>⛽ Diésel de Maquinaria:</span>
                    <span className="font-bold text-white">{formatCurrency(proyecto.gastoCombustible ?? 245000)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>🔧 Refacciones y Mantenimiento:</span>
                    <span className="font-bold text-white">{formatCurrency(proyecto.gastoMantenimiento ?? 110000)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>🧱 Materiales y Criba:</span>
                    <span className="font-bold text-white">{formatCurrency(proyecto.gastoMateriales ?? 215000)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[10px] font-black uppercase text-white/70">Utilidad Neta Real:</span>
                  <span className={`text-lg font-black ${(proyecto.utilidadReal ?? 70000) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(proyecto.utilidadReal ?? 70000)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Workers Assigned */}
            <Card padding="sm" className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Personal en Obra</h3>
                <Badge variant="neutral" size="sm">{trabajadoresAsignados.length}</Badge>
              </div>
              <div className="space-y-3 max-h-[140px] overflow-y-auto scrollbar-none">
                {trabajadoresAsignados.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={t.nombre} size="sm" color="primary" />
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{t.nombre}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{t.puesto}</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  </div>
                ))}
                {trabajadoresAsignados.length === 0 && (
                  <EmptyState
                    icon={<Users size={28} />}
                    title="Sin personal registrado"
                    subtitle="No hay trabajadores asignados a este proyecto."
                    className="py-4"
                  />
                )}
              </div>
            </Card>

            {/* Machinery Assigned */}
            <Card padding="sm" className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Flota Asignada</h3>
                <Badge variant="neutral" size="sm">{maquinariaAsignada.length}</Badge>
              </div>
              <div className="space-y-3 max-h-[140px] overflow-y-auto scrollbar-none">
                {maquinariaAsignada.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{m.id}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{m.nombre}</p>
                      </div>
                    </div>
                    <Badge
                      variant={m.estado === 'Encendida' || m.estado === 'Movimiento' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {m.estado}
                    </Badge>
                  </div>
                ))}
                {maquinariaAsignada.length === 0 && (
                  <EmptyState
                    icon={<Truck size={28} />}
                    title="Sin maquinaria asignada"
                    subtitle="No hay despachos activos hacia este proyecto."
                    className="py-4"
                  />
                )}
              </div>
            </Card>

          </div>

        </div>
      </ModalBody>
    </Modal>
  );
}
