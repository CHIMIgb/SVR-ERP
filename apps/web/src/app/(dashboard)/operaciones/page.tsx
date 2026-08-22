"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus, MapPin, ClipboardList, History, HardHat,
} from 'lucide-react';
import { operaciones, maquinaria } from '@/lib/data';
import { PageHeader } from '@/components/ui/PageHeader';
import { TimelineCard } from '@/components/ui/TimelineCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';

export default function OperacionesPage() {
  const { user } = useAuth();

  // ── RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/operaciones');
  const puedeCrear = vista?.puedeCrear ?? false;

  // ── Filtros ──
  const [search, setSearch] = useState('');
  const [maquinaFilter, setMaquinaFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');

  // ── Catálogos únicos de los datos ──
  const obras = useMemo(
    () => [...new Set(operaciones.map(o => o.obra))].sort(),
    [],
  );

  // ── Filtrado ──
  const filtered = useMemo(() => {
    let result = operaciones;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        o =>
          o.actividad.toLowerCase().includes(q) ||
          o.obra.toLowerCase().includes(q),
      );
    }

    if (maquinaFilter) {
      result = result.filter(o => o.maquinaId === maquinaFilter);
    }

    if (obraFilter) {
      result = result.filter(o => o.obra === obraFilter);
    }

    return result;
  }, [search, maquinaFilter, obraFilter]);

  // ── Formatear fecha legible ──
  const formatFecha = useCallback((fecha: string) => {
    const d = new Date(fecha + 'T00:00:00');
    const day = d.getDate();
    const month = d.toLocaleDateString('es-MX', { month: 'short' });
    return `${day} ${month}`;
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Bitácora de Operaciones"
        subtitle="Registro diario de actividades realizadas por maquinaria en obra."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
              Nuevo Registro
            </Button>
          ) : undefined
        }
      />

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar actividad, obra..."
          className="flex-1"
        />
        <div className="flex gap-3">
          <Select
            value={maquinaFilter}
            onChange={(e) => setMaquinaFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las máquinas' },
              ...maquinaria.map(m => ({ value: m.id, label: m.nombre })),
            ]}
          />
          <Select
            value={obraFilter}
            onChange={(e) => setObraFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las obras' },
              ...obras.map(o => ({ value: o, label: o })),
            ]}
          />
        </div>
      </div>

      {/* ── Lista de operaciones ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-10 h-10 text-slate-300" />}
          title="No hay operaciones registradas"
          subtitle={
            search || maquinaFilter || obraFilter
              ? 'No se encontraron resultados con los filtros aplicados.'
              : 'Aún no se ha registrado ninguna operación en la bitácora.'
          }
          action={
            search || maquinaFilter || obraFilter ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setSearch(''); setMaquinaFilter(''); setObraFilter(''); }}
              >
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(op => {
            const maquina = maquinaria.find(m => m.id === op.maquinaId);

            return (
              <TimelineCard
                key={op.id}
                date={formatFecha(op.fecha)}
                indicator={`${op.horas} hrs`}
                title={op.actividad}
                meta={[
                  {
                    icon: <MapPin className="w-3.5 h-3.5" />,
                    label: 'Obra:',
                    value: op.obra,
                  },
                  {
                    icon: <HardHat className="w-3.5 h-3.5" />,
                    label: 'Máquina:',
                    value: maquina ? `${maquina.nombre}` : op.maquinaId,
                  },
                ]}
                badges={[
                  { variant: 'success' as const, dot: true, children: 'Completado' },
                ]}
                actions={
                  <Button variant="ghost" size="sm" icon={<History className="w-4 h-4" />}>
                    Historial
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
