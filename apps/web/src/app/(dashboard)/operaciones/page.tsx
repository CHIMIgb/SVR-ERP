"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, ClipboardList, Clock, HardHat, MapPin,
  Eye, Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Loader2,
} from 'lucide-react';
import { operaciones as operacionesMock, maquinaria } from '@/lib/data';
import type { Bitacora } from '@svr-erp/shared/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import {
  Modal, ModalHeader, ModalBody,
  FormModal, ModalField, modalInputClass, modalSelectClass,
} from '@/components/ui/Modal';
import { TimelineCard } from '@/components/ui/TimelineCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';

// ── Constantes ──
const PAGE_SIZE = 10;

// ── Form defaults ──
const emptyForm = {
  actividad: '',
  maquinaId: '',
  obra: '',
  horas: '',
  fecha: '',
};

export default function OperacionesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado de datos ──
  // Mock local en el cliente — sin carga inicial. `refreshing` queda listo
  // para la futura conexión con la API (overlay sutil sobre la tabla).
  const [registros, setRegistros] = useState<Bitacora[]>(operacionesMock);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  const simulateRefetch = useCallback(async () => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      return;
    }
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setRefreshing(false);
  }, []);

  useEffect(() => {
    simulateRefetch();
  }, [simulateRefetch]);

  const [page, setPage] = useState(1);

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Bitacora | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/operaciones');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Catálogos únicos de los datos ──
  const maquinasOptions = useMemo(
    () => maquinaria.map(m => ({ value: m.id, label: m.nombre })),
    [],
  );
  const obrasOptions = useMemo(
    () => [...new Set(registros.map(o => o.obra))].sort().map(o => ({ value: o, label: o })),
    [registros],
  );

  const getMaquinaNombre = useCallback((maquinaId: string) => {
    return maquinaria.find(m => m.id === maquinaId)?.nombre ?? maquinaId;
  }, []);

  // ── Filtrado client-side ──
  const filtered = useMemo(() => {
    let result = registros;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        o =>
          o.actividad.toLowerCase().includes(q) ||
          o.obra.toLowerCase().includes(q),
      );
    }

    if (filterValues.maquinaId) {
      result = result.filter(o => o.maquinaId === filterValues.maquinaId);
    }

    if (filterValues.obra) {
      result = result.filter(o => o.obra === filterValues.obra);
    }

    return result;
  }, [registros, search, filterValues]);

  // ── Paginación client-side (total/páginas derivados de la lista filtrada) ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  // ── Estadísticas (sobre todo el dataset) ──
  const stats = useMemo(
    () => ({
      totalOperaciones: registros.length,
      horasTotales: registros.reduce((acc, o) => acc + o.horas, 0),
      maquinasActivas: new Set(registros.map(o => o.maquinaId)).size,
    }),
    [registros],
  );

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.maquinaId) {
    activeFilters.push({
      key: 'maquinaId',
      label: 'Máquina',
      value: getMaquinaNombre(filterValues.maquinaId),
    });
  }
  if (filterValues.obra) {
    activeFilters.push({ key: 'obra', label: 'Obra', value: filterValues.obra });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'maquinaId',
      label: 'Máquina',
      type: 'select',
      options: maquinasOptions,
      placeholder: 'Todas',
    },
    {
      key: 'obra',
      label: 'Obra',
      type: 'select',
      options: obrasOptions,
      placeholder: 'Todas',
    },
  ];

  // ── Handlers de filtros ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRemoveFilter = useCallback((key: string) => {
    setFilterValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  // ── Formateo de fechas ──
  const formatFecha = useCallback((fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  }, []);

  // ── Handlers de modales ──
  const openDetail = useCallback((item: Bitacora) => {
    setSelectedItem(item);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedItem(null);
  }, []);

  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: Bitacora) => {
    setSelectedItem(item);
    setForm({
      actividad: item.actividad,
      maquinaId: item.maquinaId,
      obra: item.obra,
      horas: String(item.horas),
      fecha: item.fecha,
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: Bitacora) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── Validación compartida del formulario ──
  const validateForm = useCallback(() => {
    if (!form.actividad || !form.maquinaId || !form.obra || !form.horas || !form.fecha) {
      showToast('Actividad, máquina, obra, horas y fecha son obligatorios.', 'error');
      return false;
    }
    if (Number(form.horas) <= 0) {
      showToast('Las horas deben ser mayores a cero.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── Genera el siguiente ID secuencial (mock local) ──
  const getNextId = useCallback(() => {
    const maxNum = registros.reduce((max, r) => {
      const num = Number(r.id.replace(/\D/g, ''));
      return Number.isFinite(num) && num > max ? num : max;
    }, 0);
    return `B${String(maxNum + 1).padStart(3, '0')}`;
  }, [registros]);

  // ── CRUD Handlers ──
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const nuevo: Bitacora = {
        id: getNextId(),
        maquinaId: form.maquinaId,
        actividad: form.actividad,
        horas: Number(form.horas),
        fecha: form.fecha,
        obra: form.obra,
      };
      setRegistros(prev => [nuevo, ...prev]);
      showToast(`Operación "${form.actividad}" registrada exitosamente.`, 'success');
      setCreateOpen(false);
      await simulateRefetch();
    } catch {
      showToast('Error al registrar la operación.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, getNextId, form, showToast, simulateRefetch]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setRegistros(prev =>
        prev.map(r =>
          r.id === selectedItem.id
            ? {
                ...r,
                maquinaId: form.maquinaId,
                actividad: form.actividad,
                horas: Number(form.horas),
                fecha: form.fecha,
                obra: form.obra,
              }
            : r,
        ),
      );
      showToast(`Operación "${form.actividad}" actualizada exitosamente.`, 'success');
      setEditOpen(false);
      setSelectedItem(null);
      await simulateRefetch();
    } catch {
      showToast('Error al actualizar la operación.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, form, showToast, simulateRefetch]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setRegistros(prev => prev.filter(r => r.id !== selectedItem.id));
      showToast(`Operación "${selectedItem.actividad}" eliminada exitosamente.`, 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
      await simulateRefetch();
    } catch {
      showToast('Error al eliminar la operación.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, simulateRefetch]);

  // ── Columnas de DataTable ──
  const columns: Column<Bitacora>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="whitespace-nowrap font-bold text-slate-600">
          {formatFecha(item.fecha)}
        </span>
      ),
    },
    {
      key: 'actividad',
      header: 'Actividad',
      render: (item) => (
        <div>
          <div className="font-black text-slate-900">{item.actividad}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {item.obra}
          </div>
        </div>
      ),
    },
    {
      key: 'maquina',
      header: 'Máquina',
      render: (item) => (
        <span className="font-semibold text-slate-600">
          {getMaquinaNombre(item.maquinaId)}
        </span>
      ),
    },
    {
      key: 'horas',
      header: 'Horas',
      align: 'right',
      render: (item) => (
        <span className="font-black text-sm text-slate-900">{item.horas} hrs</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="info"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); openDetail(item); }}
          >
            Detalle
          </Button>
          {puedeEditar && (
            <Button
              variant="warning"
              size="sm"
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            >
              Editar
            </Button>
          )}
          {puedeEliminar && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openDelete(item); }}
            >
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Bitácora de Operaciones"
        subtitle="Registro diario de actividades realizadas por maquinaria en obra."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Nuevo Registro
            </Button>
          ) : undefined
        }
      />

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<ClipboardList className="w-6 h-6" />}
          value={stats.totalOperaciones}
          label="Total Operaciones"
          color="info"
        />
        <StatsCard
          icon={<Clock className="w-6 h-6" />}
          value={`${stats.horasTotales} hrs`}
          label="Horas Totales"
          color="success"
        />
        <StatsCard
          icon={<HardHat className="w-6 h-6" />}
          value={stats.maquinasActivas}
          label="Máquinas Activas"
          color="neutral"
        />
      </div>

      {/* ── Búsqueda + toggle de filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar actividad, obra..."
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setShowFilters(prev => !prev)}
          className="shrink-0 whitespace-nowrap"
        >
          <span className="whitespace-nowrap">Filtros</span>
          {activeFilters.length > 0 && (
            <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      {/* ── Chips de filtros activos ── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
            >
              <span className="font-normal text-primary/70">{filter.label}:</span>
              <span>{filter.value}</span>
              <button
                onClick={() => handleRemoveFilter(filter.key)}
                className="ml-0.5 hover:text-primary-dark transition-colors"
                aria-label={`Eliminar filtro ${filter.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors ml-1"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {/* ── Panel de filtros ── */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            {filterFields.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {filter.label}
                </label>
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary/50"
                >
                  <option value="">{filter.placeholder || 'Todos'}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabla + paginación ── */}
      <div className="space-y-3">
        <div className="relative">
          {/* Overlay sutil durante refetches — solo cuando ya hay datos */}
          {refreshing && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-opacity">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={paginated}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron operaciones que coincidan con la búsqueda."
            maxBodyHeight="500px"
          />
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      {/* Detalle */}
      <Modal open={detailOpen} onClose={closeDetail}>
        <ModalHeader
          title="Detalle de Operación"
          subtitle={selectedItem ? selectedItem.obra : undefined}
          onClose={closeDetail}
        />
        <ModalBody>
          {selectedItem && (
            <div className="space-y-4">
              <TimelineCard
                date={formatFecha(selectedItem.fecha)}
                indicator={`${selectedItem.horas} hrs`}
                title={selectedItem.actividad}
                meta={[
                  {
                    icon: <MapPin className="w-3.5 h-3.5" />,
                    label: 'Obra:',
                    value: selectedItem.obra,
                  },
                  {
                    icon: <HardHat className="w-3.5 h-3.5" />,
                    label: 'Máquina:',
                    value: getMaquinaNombre(selectedItem.maquinaId),
                  },
                ]}
                badges={[
                  { variant: 'success', dot: true, children: 'Completado' },
                ]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Fecha completa
                  </p>
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {new Date(selectedItem.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Horas registradas
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedItem.horas} hrs
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Crear */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nuevo Registro de Bitácora"
        subtitle="Registrar una operación de maquinaria en obra."
        submitLabel="Registrar Operación"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Actividad" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Excavación para cimentación profunda"
              value={form.actividad}
              onChange={(e) => setForm({ ...form, actividad: e.target.value })}
            />
          </ModalField>

          <ModalField label="Máquina" required>
            <select
              className={modalSelectClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {maquinasOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Obra" required>
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Valle Sur"
              value={form.obra}
              onChange={(e) => setForm({ ...form, obra: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>

          <ModalField label="Horas Trabajadas" required hint="Horas efectivas de operación.">
            <input
              type="number"
              className={modalInputClass}
              placeholder="8"
              min="0.5"
              step="0.5"
              value={form.horas}
              onChange={(e) => setForm({ ...form, horas: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* Editar */}
      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Registro"
        subtitle={selectedItem ? `Registro ${selectedItem.id}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Actividad" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Descripción de la actividad"
              value={form.actividad}
              onChange={(e) => setForm({ ...form, actividad: e.target.value })}
            />
          </ModalField>

          <ModalField label="Máquina" required>
            <select
              className={modalSelectClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {maquinasOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Obra" required>
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Valle Sur"
              value={form.obra}
              onChange={(e) => setForm({ ...form, obra: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>

          <ModalField label="Horas Trabajadas" required hint="Horas efectivas de operación.">
            <input
              type="number"
              className={modalInputClass}
              placeholder="8"
              min="0.5"
              step="0.5"
              value={form.horas}
              onChange={(e) => setForm({ ...form, horas: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      {/* Eliminar */}
      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Registro"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">
              ¿Estás seguro de eliminar este registro de bitácora?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">
              {selectedItem.actividad}
            </p>
            <p className="text-xs text-slate-500">
              {getMaquinaNombre(selectedItem.maquinaId)} — {selectedItem.obra} · {selectedItem.horas} hrs
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
