'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus, ShieldAlert, AlertTriangle, Clock,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { incidentes as incidentesMock } from '@/lib/mock-data/operaciones';
import { formatDate } from '@/lib/formatters';
import type { Incidente } from '@svr-erp/shared';
import type { BadgeVariant } from '@/components/ui/Badge';

// ── Constantes ──
const PAGE_SIZE = 10;

const PRIORIDADES: Incidente['prioridad'][] = ['Crítica', 'Alta', 'Media', 'Baja'];
const ESTADOS: Incidente['estado'][] = ['Abierto', 'En Revisión', 'Resuelto'];

const prioridadVariant: Record<Incidente['prioridad'], BadgeVariant> = {
  Crítica: 'error',
  Alta: 'warning',
  Media: 'primary',
  Baja: 'info',
};

const estadoVariant: Record<Incidente['estado'], BadgeVariant> = {
  Abierto: 'error',
  'En Revisión': 'warning',
  Resuelto: 'success',
};

const emptyForm = {
  titulo: '',
  descripcion: '',
  prioridad: 'Media' as Incidente['prioridad'],
  estado: 'Abierto' as Incidente['estado'],
  obra: '',
  maquinaId: '',
  fecha: new Date().toISOString().split('T')[0],
};

export default function IncidentesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/incidentes');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [incidentes, setIncidentes] = useState<Incidente[]>(incidentesMock);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Incidente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Filtros ──
  const incidentesFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incidentes.filter((inc) => {
      const matchesSearch =
        !q ||
        inc.titulo.toLowerCase().includes(q) ||
        inc.descripcion.toLowerCase().includes(q) ||
        inc.obra.toLowerCase().includes(q) ||
        (inc.maquinaId && inc.maquinaId.toLowerCase().includes(q));
      const matchesPrioridad = !filterValues.prioridad || inc.prioridad === filterValues.prioridad;
      const matchesEstado = !filterValues.estado || inc.estado === filterValues.estado;
      return matchesSearch && matchesPrioridad && matchesEstado;
    });
  }, [incidentes, search, filterValues]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(incidentesFiltrados.length / PAGE_SIZE)), [incidentesFiltrados]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return incidentesFiltrados.slice(start, start + PAGE_SIZE);
  }, [incidentesFiltrados, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterValues]);

  // ── Estadísticas ──
  const stats = useMemo(() => {
    const abiertos = incidentes.filter((i) => i.estado !== 'Resuelto').length;
    const criticos = incidentes.filter((i) => i.prioridad === 'Crítica' && i.estado !== 'Resuelto').length;
    return { total: incidentes.length, abiertos, criticos };
  }, [incidentes]);

  const hayCriticosAbiertos = stats.criticos > 0;

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.prioridad) {
    activeFilters.push({ key: 'prioridad', label: 'Prioridad', value: filterValues.prioridad });
  }
  if (filterValues.estado) {
    activeFilters.push({ key: 'estado', label: 'Estado', value: filterValues.estado });
  }

  const filterFields: FilterField[] = [
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'select',
      options: PRIORIDADES.map((p) => ({ value: p, label: p })),
      placeholder: 'Todas',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS.map((e) => ({ value: e, label: e })),
      placeholder: 'Todos',
    },
  ];

  // ── Handlers de filtros ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleRemoveFilter = useCallback((key: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    setPage(1);
  }, []);

  const handleFilterCritical = useCallback(() => {
    setFilterValues({ prioridad: 'Crítica', estado: 'Abierto' });
    setPage(1);
  }, []);

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: Incidente) => {
    setSelectedItem(item);
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion,
      prioridad: item.prioridad,
      estado: item.estado,
      obra: item.obra,
      maquinaId: item.maquinaId || '',
      fecha: item.fecha,
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: Incidente) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.titulo.trim() || !form.obra.trim() || !form.fecha) {
      showToast('Título, obra y fecha son obligatorios.', 'error');
      return false;
    }
    if (!form.descripcion.trim()) {
      showToast('La descripción es obligatoria.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── CRUD local ──
  const handleCreate = useCallback(() => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const nuevo: Incidente = {
        id: `IN${Date.now().toString().slice(-3)}`,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
        estado: form.estado,
        obra: form.obra.trim(),
        maquinaId: form.maquinaId.trim() || undefined,
        fecha: form.fecha,
      };
      setIncidentes((prev) => [nuevo, ...prev]);
      showToast(`Incidente "${nuevo.titulo}" reportado exitosamente.`, 'success');
      setCreateOpen(false);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }, [form, validateForm, showToast]);

  const handleEdit = useCallback(() => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      setIncidentes((prev) =>
        prev.map((inc) =>
          inc.id === selectedItem.id
            ? {
                ...inc,
                titulo: form.titulo.trim(),
                descripcion: form.descripcion.trim(),
                prioridad: form.prioridad,
                estado: form.estado,
                obra: form.obra.trim(),
                maquinaId: form.maquinaId.trim() || undefined,
                fecha: form.fecha,
              }
            : inc,
        ),
      );
      showToast(`Incidente "${form.titulo.trim()}" actualizado exitosamente.`, 'success');
      setEditOpen(false);
      setSelectedItem(null);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, form, validateForm, showToast]);

  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      setIncidentes((prev) => prev.filter((inc) => inc.id !== selectedItem.id));
      showToast('Incidente eliminado exitosamente.', 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast]);

  // ── Columnas de DataTable ──
  const columns: Column<Incidente>[] = [
    {
      key: 'titulo',
      header: 'Incidente / Obra',
      render: (item) => (
        <div>
          <div className="font-black text-slate-900">{item.titulo}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.obra}</div>
        </div>
      ),
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      render: (item) => (
        <Badge variant={prioridadVariant[item.prioridad]} size="sm">{item.prioridad}</Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => (
        <Badge variant={estadoVariant[item.estado]} size="sm">{item.estado}</Badge>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="whitespace-nowrap font-bold text-slate-600">{formatDate(item.fecha)}</span>
      ),
    },
    {
      key: 'maquinaId',
      header: 'Máquina',
      render: (item) => (
        <span className="font-semibold text-slate-600">{item.maquinaId || '—'}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
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
        title="Seguridad e Incidentes"
        subtitle="Registro y seguimiento de fallas, accidentes y retrasos operativos en obra."
        action={
          puedeCrear ? (
            <Button variant="danger" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Reportar Incidente
            </Button>
          ) : undefined
        }
      />

      {hayCriticosAbiertos && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-900 font-bold text-sm">Incidentes Críticos Abiertos</p>
              <p className="text-red-700 text-xs font-medium">
                Hay {stats.criticos} incidente{stats.criticos > 1 ? 's' : ''} crítico{stats.criticos > 1 ? 's' : ''} sin resolver.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={handleFilterCritical}
          >
            Ver críticos abiertos
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<ShieldAlert className="w-6 h-6" />}
          value={stats.total}
          label="Total Incidentes"
          color="info"
        />
        <StatsCard
          icon={<Clock className="w-6 h-6" />}
          value={stats.abiertos}
          label="Incidentes Abiertos"
          color={stats.abiertos > 0 ? 'warning' : 'success'}
        />
        <StatsCard
          icon={<AlertTriangle className="w-6 h-6" />}
          value={stats.criticos}
          label="Críticos Sin Resolver"
          color={stats.criticos > 0 ? 'error' : 'success'}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar incidente, obra o máquina..."
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setShowFilters((prev) => !prev)}
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

      <div className="space-y-3">
        <DataTable
          columns={columns}
          data={paginated}
          loading={false}
          keyExtractor={(item) => item.id}
          emptyText="No se encontraron incidentes que coincidan con la búsqueda."
          maxBodyHeight="500px"
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={incidentesFiltrados.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Reportar Incidente"
        subtitle="Registra una falla, accidente o retraso operativo en obra."
        submitLabel="Reportar Incidente"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Título" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Fuga de aceite hidráulico"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Descripción" required className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              placeholder="Describe el incidente con detalle..."
              rows={4}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Prioridad" required>
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as Incidente['prioridad'] })}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Estado" required>
            <select
              className={modalSelectClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as Incidente['estado'] })}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e}</option>
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

          <ModalField label="Máquina (opcional)">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: M001"
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
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
        </div>
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Incidente"
        subtitle={selectedItem ? `Editando: ${selectedItem.titulo}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Título" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </ModalField>

          <ModalField label="Descripción" required className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={4}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </ModalField>

          <ModalField label="Prioridad" required>
            <select
              className={modalSelectClass}
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as Incidente['prioridad'] })}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Estado" required>
            <select
              className={modalSelectClass}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as Incidente['estado'] })}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Obra" required>
            <input
              type="text"
              className={modalInputClass}
              value={form.obra}
              onChange={(e) => setForm({ ...form, obra: e.target.value })}
            />
          </ModalField>

          <ModalField label="Máquina (opcional)">
            <input
              type="text"
              className={modalInputClass}
              value={form.maquinaId}
              onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
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
        </div>
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Incidente"
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
              ¿Estás seguro de eliminar este incidente?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">{selectedItem.titulo}</p>
            <p className="text-xs text-slate-500">
              {selectedItem.obra} · {selectedItem.prioridad}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
