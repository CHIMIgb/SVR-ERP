"use client";

import React from 'react';
import {
  Calendar, Truck, Users,
  BarChart2, CheckCircle2, AlertCircle, Clock,
  Banknote, TrendingUp, Fuel, Wrench, Package,
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
import { LineChart } from '@/components/ui/Charts';
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

/* Iconos minimalistas para los renglones financieros */
const finIconColors = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-600',
  info: 'bg-blue-100 text-blue-600',
  warning: 'bg-amber-100 text-amber-600',
  error: 'bg-red-100 text-red-600',
  neutral: 'bg-slate-100 text-slate-500',
} as const;

type FinColor = keyof typeof finIconColors;

function FinRow({ icon, color, label, value }: {
  icon: React.ReactNode;
  color: FinColor;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${finIconColors[color]}`}>
          {icon}
        </div>
        <span className="font-semibold text-slate-600 truncate">{label}</span>
      </div>
      <span className="font-black text-slate-900 whitespace-nowrap">{value}</span>
    </div>
  );
}

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

  // S-Curve data
  const historico = proyecto.historicoProgreso || [];
  const hasHistory = historico.length > 0;

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

        <div className="space-y-6">

          {/* ═══ Fila 1: Curva S ═══ */}
          {hasHistory ? (
            <LineChart
              title="Curva S: Progreso de Obra"
              subtitle="Comparativa de avance acumulado Planificado vs. Real (%)"
              labels={historico.map((h) => h.fecha)}
              series={[
                { name: 'Planificado', data: historico.map((h) => h.planificado), color: '#ed8238' },
                { name: 'Real', data: historico.map((h) => h.real), color: '#1e293b' },
              ]}
              height={260}
              showLegend
            />
          ) : (
            <Card>
              <EmptyState
                icon={<BarChart2 size={32} />}
                title="Sin registros históricos"
                subtitle="Este proyecto aún no tiene hitos de progreso registrados."
                className="py-10"
              />
            </Card>
          )}

          {/* ═══ Fila 2: Rentabilidad y Costo Real ═══ */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                Rentabilidad y Costo Real
              </h3>
              <Badge
                variant={(proyecto.margenUtilidadPorcentaje ?? 0) >= 20 ? 'success' : (proyecto.margenUtilidadPorcentaje ?? 0) > 0 ? 'warning' : 'error'}
                size="sm"
              >
                Margen: +{proyecto.margenUtilidadPorcentaje ?? 0}%
              </Badge>
            </div>

            <div className="space-y-2.5">
              <FinRow icon={<Banknote className="w-4 h-4" />} color="primary" label="Presupuesto Contratado" value={formatCurrency(proyecto.presupuesto)} />
              <FinRow icon={<TrendingUp className="w-4 h-4" />} color="success" label="Ingreso Facturado/Cobrado" value={formatCurrency(proyecto.ingresoCobrado ?? 0)} />

              <Separator className="my-3" />

              <FinRow icon={<Users className="w-4 h-4" />} color="info" label="Nómina y Horas Extras" value={formatCurrency(proyecto.gastoNomina ?? 0)} />
              <FinRow icon={<Fuel className="w-4 h-4" />} color="warning" label="Diésel de Maquinaria" value={formatCurrency(proyecto.gastoCombustible ?? 0)} />
              <FinRow icon={<Wrench className="w-4 h-4" />} color="error" label="Refacciones y Mantenimiento" value={formatCurrency(proyecto.gastoMantenimiento ?? 0)} />
              <FinRow icon={<Package className="w-4 h-4" />} color="neutral" label="Materiales y Criba" value={formatCurrency(proyecto.gastoMateriales ?? 0)} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Utilidad Neta Real</span>
              <span className={`text-xl font-black ${(proyecto.utilidadReal ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(proyecto.utilidadReal ?? 0)}
              </span>
            </div>
          </Card>

          {/* ═══ Fila 3: Desempeño CPI y SPI ═══ */}
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

          {/* ═══ Fila 4: Personal y Flota ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Workers Assigned */}
            <Card padding="sm" className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Personal en Obra</h3>
                <Badge variant="neutral" size="sm">{trabajadoresAsignados.length}</Badge>
              </div>
              <div className="space-y-3 max-h-[180px] overflow-y-auto scrollbar-none">
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
              <div className="space-y-3 max-h-[180px] overflow-y-auto scrollbar-none">
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
