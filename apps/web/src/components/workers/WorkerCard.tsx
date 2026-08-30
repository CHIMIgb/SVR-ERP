"use client";

import React from 'react';
import { Phone, Briefcase, Truck, Award, ClipboardList, Pencil, UserMinus } from 'lucide-react';
import type { TrabajadorDTO } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface WorkerCardProps {
  trabajador: TrabajadorDTO;
  bitacorasCount?: number;
  puedeEditar?: boolean;
  puedeEliminar?: boolean;
  onOpenBitacoras?: (t: TrabajadorDTO) => void;
  onEdit?: (t: TrabajadorDTO) => void;
  onLiquidar?: (t: TrabajadorDTO) => void;
}

const ESTADO_BADGE: Record<string, 'success' | 'neutral' | 'info'> = {
  Activo: 'success',
  Inactivo: 'neutral',
  Vacaciones: 'info',
};

export default function WorkerCard({
  trabajador,
  bitacorasCount = 0,
  puedeEditar,
  puedeEliminar,
  onOpenBitacoras,
  onEdit,
  onLiquidar,
}: WorkerCardProps) {
  return (
    <Card padding="sm" className="space-y-4">
      {/* Top Identity Bar */}
      <div className="flex items-start gap-3.5">
        <Avatar name={trabajador.nombre} size="lg" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-black text-slate-900 text-base leading-tight truncate">{trabajador.nombre}</h3>
            <Badge variant={ESTADO_BADGE[trabajador.estado] ?? 'neutral'} size="sm" dot>
              {trabajador.estado}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge variant="primary" size="sm">{trabajador.categoriaPuesto}</Badge>
            <span className="text-xs font-bold text-primary truncate">{trabajador.puesto}</span>
          </div>
        </div>
      </div>

      {/* Renta / Asignación Status Banner */}
      {trabajador.estadoRenta === 'Rentado a Cliente' && trabajador.clienteRentaActual && (
        <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-orange-700 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-orange-600" /> Rentado a Cliente
            </span>
            <span className="text-[9px] font-bold text-orange-800">{trabajador.maquinaAsignadaId}</span>
          </div>
          <p className="font-black text-slate-900 text-[11px] truncate">{trabajador.clienteRentaActual}</p>
          <p className="text-[10px] text-slate-500 font-medium">Equipo: {trabajador.maquinaAsignadaNombre}</p>
        </div>
      )}

      {trabajador.estadoRenta && trabajador.estadoRenta !== 'Rentado a Cliente' && trabajador.maquinaAsignadaNombre && (
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] flex items-center justify-between">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-slate-400" /> Equipo asignado
          </span>
          <span className="font-bold text-slate-800">{trabajador.maquinaAsignadaId} — {trabajador.maquinaAsignadaNombre}</span>
        </div>
      )}

      {/* Certification / License Badge */}
      {trabajador.licenciaODC3 && (
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium flex items-center gap-1 truncate">
            <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <strong className="text-slate-800">{trabajador.licenciaODC3.tipo}</strong>
          </span>
          <span className="text-slate-400 font-mono shrink-0 ml-1">Vig: {trabajador.licenciaODC3.vigencia}</span>
        </div>
      )}

      {/* Operational details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Contacto:
          </span>
          <span className="font-bold text-slate-800">{trabajador.telefono}</span>
        </div>

        {trabajador.proyectos.length > 0 && (
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Obras:
            </span>
            <div className="flex gap-1 flex-wrap justify-end">
              {trabajador.proyectos.map((p) => (
                <Badge key={p} variant="neutral" size="sm">{p}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operational Actions */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {(trabajador.categoriaPuesto === 'Operador' || trabajador.categoriaPuesto === 'Chofer') && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            icon={<ClipboardList size={14} />}
            onClick={() => onOpenBitacoras?.(trabajador)}
          >
            Hojas de Bitácora / Renta ({bitacorasCount})
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          {puedeEditar && (
            <Button variant="warning" size="sm" icon={<Pencil size={14} />} onClick={() => onEdit?.(trabajador)}>
              Editar
            </Button>
          )}
          {puedeEliminar && trabajador.estado !== 'Inactivo' && (
            <Button variant="danger" size="sm" icon={<UserMinus size={14} />} onClick={() => onLiquidar?.(trabajador)}>
              Liquidar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
