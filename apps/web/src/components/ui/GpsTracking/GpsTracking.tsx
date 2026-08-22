'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { gpsClasses } from './GpsTracking.styles';
import {
  Truck, Pause, WifiOff, AlertTriangle,
  Fuel, Thermometer, Gauge, Clock, MapPin,
  ChevronRight, Activity,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

export type MachineStatus = 'moving' | 'idle' | 'offline' | 'alert';

export interface GpsMachine {
  id: string;
  name: string;
  type: string;
  status: MachineStatus;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  fuel: number;
  temperature: number;
  hours: number;
  lastUpdate: string;
  operator?: string;
  project?: string;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  time: string;
  speed: number;
}

/* ────────────────────────────────────────────────────────────────
   Status Config
   ──────────────────────────────────────────────────────────────── */

const statusConfig: Record<MachineStatus, { icon: React.ReactNode; color: string; label: string }> = {
  moving: { icon: <Truck size={14} />, color: 'bg-green-500', label: 'En movimiento' },
  idle: { icon: <Pause size={14} />, color: 'bg-amber-500', label: 'Detenido' },
  offline: { icon: <WifiOff size={14} />, color: 'bg-slate-400', label: 'Sin señal' },
  alert: { icon: <AlertTriangle size={14} />, color: 'bg-red-500', label: 'Alerta' },
};

/* ────────────────────────────────────────────────────────────────
   LiveIndicator
   ──────────────────────────────────────────────────────────────── */

export function LiveIndicator() {
  return (
    <div className={gpsClasses.liveDot}>
      <div className={gpsClasses.livePulse} />
      <span className={gpsClasses.liveText}>EN VIVO</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MachineMarker
   ──────────────────────────────────────────────────────────────── */

export interface MachineMarkerProps {
  machine: GpsMachine;
  isSelected?: boolean;
  onClick?: () => void;
  /** Posicion en porcentaje (0-100) dentro del mapa */
  x: number;
  y: number;
}

export function MachineMarker({ machine, isSelected, onClick, x, y }: MachineMarkerProps) {
  const config = statusConfig[machine.status];

  return (
    <div
      className={cn(gpsClasses.marker, isSelected && 'z-30 scale-110')}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
    >
      {/* Pulse ring */}
      {machine.status === 'moving' && (
        <div className={cn(gpsClasses.markerPulse, config.color)} />
      )}

      {/* Icon */}
      <div
        className={cn(
          gpsClasses.markerIcon,
          config.color,
          isSelected && 'ring-2 ring-white ring-offset-2'
        )}
      >
        <Truck size={20} className="text-white" />
      </div>

      {/* Label */}
      <div className={gpsClasses.markerLabel}>
        {machine.name}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SpeedGauge
   ──────────────────────────────────────────────────────────────── */

export interface SpeedGaugeProps {
  speed: number;
  maxSpeed?: number;
  className?: string;
}

export function SpeedGauge({ speed, maxSpeed = 80, className }: SpeedGaugeProps) {
  const percentage = Math.min((speed / maxSpeed) * 100, 100);
  const rotation = (percentage / 100) * 270;

  return (
    <div className={cn(gpsClasses.gauge, className)}>
      <div className={gpsClasses.gaugeBg} />
      <div
        className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-500"
        style={{
          clipPath: `polygon(0 0, ${percentage}% 0, ${percentage}% ${100 - percentage}%, 0 ${100 - percentage}%)`,
        }}
      />
      <div className={gpsClasses.gaugeText}>
        <span className={gpsClasses.gaugeValue}>{speed}</span>
        <span className={gpsClasses.gaugeUnit}>km/h</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   TrackingPanel
   ──────────────────────────────────────────────────────────────── */

export interface TrackingPanelProps {
  machine: GpsMachine;
  className?: string;
}

export function TrackingPanel({ machine, className }: TrackingPanelProps) {
  const config = statusConfig[machine.status];

  return (
    <div className={cn(gpsClasses.panel, className)}>
      <div className={gpsClasses.panelHeader}>
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.color)}>
            <Truck size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{machine.name}</h3>
            <p className="text-xs text-slate-500">{machine.type}</p>
          </div>
        </div>
        <StatusBadge status={machine.status} />
      </div>

      <div className={gpsClasses.panelBody}>
        {/* Velocidad */}
        <div className="flex items-center gap-4">
          <SpeedGauge speed={machine.speed} />
          <div className="flex-1 space-y-2">
            <div className={gpsClasses.panelRow}>
              <span className={gpsClasses.panelLabel}>Combustible</span>
              <div className="flex items-center gap-2">
                <Fuel size={14} className="text-slate-400" />
                <span className={cn(gpsClasses.panelValue, machine.fuel < 20 && 'text-red-600')}>
                  {machine.fuel}%
                </span>
              </div>
            </div>
            <div className={gpsClasses.panelRow}>
              <span className={gpsClasses.panelLabel}>Motor</span>
              <div className="flex items-center gap-2">
                <Thermometer size={14} className="text-slate-400" />
                <span className={cn(gpsClasses.panelValue, machine.temperature > 90 && 'text-red-600')}>
                  {machine.temperature}°C
                </span>
              </div>
            </div>
            <div className={gpsClasses.panelRow}>
              <span className={gpsClasses.panelLabel}>Horas</span>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span className={gpsClasses.panelValue}>{machine.hours}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {machine.operator && (
            <div className="flex items-center justify-between">
              <span className={gpsClasses.panelLabel}>Operador</span>
              <span className={gpsClasses.panelValue}>{machine.operator}</span>
            </div>
          )}
          {machine.project && (
            <div className="flex items-center justify-between">
              <span className={gpsClasses.panelLabel}>Proyecto</span>
              <span className={gpsClasses.panelValue}>{machine.project}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className={gpsClasses.panelLabel}>Ubicacion</span>
            <span className="text-xs font-mono text-slate-600">
              {machine.lat.toFixed(6)}, {machine.lng.toFixed(6)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={gpsClasses.panelLabel}>Ultima actualizacion</span>
            <span className={gpsClasses.panelValue}>{machine.lastUpdate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   StatusBadge
   ──────────────────────────────────────────────────────────────── */

export interface StatusBadgeProps {
  status: MachineStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const styleMap: Record<MachineStatus, string> = {
    moving: gpsClasses.statusMoving,
    idle: gpsClasses.statusIdle,
    offline: gpsClasses.statusOffline,
    alert: gpsClasses.statusAlert,
  };

  return (
    <span className={cn(styleMap[status], className)}>
      {config.icon}
      {config.label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────
   Timeline
   ──────────────────────────────────────────────────────────────── */

export interface TimelineEvent {
  time: string;
  text: string;
  speed?: number;
}

export interface GpsTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function GpsTimeline({ events, className }: GpsTimelineProps) {
  return (
    <div className={cn(gpsClasses.timeline, className)}>
      {events.map((event, i) => (
        <div key={i} className={gpsClasses.timelineItem}>
          {i < events.length - 1 && <div className={gpsClasses.timelineLine} />}
          <div className={gpsClasses.timelineDot} />
          <div className={gpsClasses.timelineContent}>
            <span className={gpsClasses.timelineTime}>{event.time}</span>
            <p className={gpsClasses.timelineText}>{event.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   GpsMap (Simulado)
   ──────────────────────────────────────────────────────────────── */

export interface GpsMapProps {
  machines: GpsMachine[];
  selectedId?: string;
  onSelect?: (machine: GpsMachine) => void;
  height?: string;
  className?: string;
}

export function GpsMap({ machines, selectedId, onSelect, height = '400px', className }: GpsMapProps) {
  return (
    <div
      className={cn(gpsClasses.mapContainer, className)}
      style={{ height }}
    >
      {/* Grid pattern (simulates map) */}
      <div className={gpsClasses.mapGrid} />

      {/* Map overlay */}
      <div className={gpsClasses.mapOverlay} />

      {/* Road lines (simulated) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 10 90 Q 30 50 50 60 T 90 20" stroke="#cbd5e1" strokeWidth="0.8" fill="none" strokeDasharray="2 1" />
        <path d="M 5 30 Q 40 40 60 70 T 95 50" stroke="#cbd5e1" strokeWidth="0.5" fill="none" />
      </svg>

      {/* Machine markers */}
      {machines.map((machine, i) => {
        // Simulated positions distributed across the map
        const positions = [
          { x: 15, y: 20 },
          { x: 45, y: 35 },
          { x: 70, y: 25 },
          { x: 30, y: 65 },
          { x: 80, y: 60 },
          { x: 55, y: 75 },
        ];
        const pos = positions[i % positions.length];

        return (
          <MachineMarker
            key={machine.id}
            machine={machine}
            x={pos.x}
            y={pos.y}
            isSelected={machine.id === selectedId}
            onClick={() => onSelect?.(machine)}
          />
        );
      })}

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 text-[10px] font-semibold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Movimiento
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Detenido
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Sin señal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Alerta
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MachineList
   ──────────────────────────────────────────────────────────────── */

export interface MachineListProps {
  machines: GpsMachine[];
  selectedId?: string;
  onSelect?: (machine: GpsMachine) => void;
  className?: string;
}

export function MachineList({ machines, selectedId, onSelect, className }: MachineListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {machines.map((machine) => {
        const config = statusConfig[machine.status];
        const isSelected = machine.id === selectedId;

        return (
          <div
            key={machine.id}
            onClick={() => onSelect?.(machine)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200',
              isSelected
                ? 'bg-primary/5 border-primary/30 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            )}
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.color)}>
              <Truck size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 truncate">{machine.name}</span>
                <StatusBadge status={machine.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Gauge size={12} />
                  {machine.speed} km/h
                </span>
                <span className="flex items-center gap-1">
                  <Fuel size={12} />
                  {machine.fuel}%
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
          </div>
        );
      })}
    </div>
  );
}
