"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus, HardHat, CheckCircle2, FolderKanban,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Eye,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import ProjectDetailsModal from '@/components/projects/ProjectDetailsModal';
import { formatDate } from '@/lib/formatters';
import { proyectos as proyectosMock, type Proyecto } from '@/lib/data';

// ── Constantes ──
const PAGE_SIZE = 10;

const ESTADOS: { value: Proyecto['estado']; apiValue: string; label: string }[] = [
  { value: 'En Proceso', apiValue: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'Finalizado', apiValue: 'FINALIZADO', label: 'Finalizado' },
  { value: 'Pausado', apiValue: 'PAUSADO', label: 'Pausado' },
];

const estadoVariant: Record<Proyecto['estado'], 'primary' | 'success' | 'warning'> = {
  'En Proceso': 'primary',
  'Finalizado': 'success',
  'Pausado': 'warning',
};

const emptyForm = {
  nombre: '',
  cliente: '',
  presupuesto: '',
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFin: '',
  progreso: '0',
};

function estadoFromValue(value: string): Proyecto['estado'] {
  return ESTADOS.find((e) => e.apiValue === value)?.value ?? 'En Proceso';
}

export default function ProyectosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/proyectos');
  const puedeVer = vista?.puedeVer ?? false;
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos (local hasta integrar API /proyectos) ──
  const [registros, setRegistros] = useState<Proyecto[]>(proyectosMock);
  const [page, setPage] = useState(1);

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Proyecto | null>(null);
  const [viewItem, setViewItem] = useState<Proyecto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Catálogo de clientes (distinto de la data local) ──
  const clientes = useMemo(
    () => Array.from(new Set(registros.map((p) => p.cliente))).sort(),
    [registros],
  );

  // ── Filtrado ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registros.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q) && !p.cliente.toLowerCase().includes(q)) {
        return false;
      }
      if (filterValues.estado && p.estado !== estadoFromValue(filterValues.estado)) {
        return false;
      }
      if (filterValues.cliente && p.cliente !== filterValues.cliente) {
        return false;
      }
      return true;
    });
  }, [registros, search, filterValues]);

  // ── Paginación client-side ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: registros.length,
    enProceso: registros.filter((p) => p.estado === 'En Proceso').length,
    finalizados: registros.filter((p) => p.estado === 'Finalizado').length,
    presupuestoTotal: registros.reduce((sum, p) => sum + p.presupuesto, 0),
  }), [registros]);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.estado) {
    const label = ESTADOS.find((e) => e.apiValue === filterValues.estado)?.label ?? filterValues.estado;
    activeFilters.push({ key: 'estado', label: 'Estado', value: label });
  }
  if (filterValues.cliente) {
    activeFilters.push({ key: 'cliente', label: 'Cliente', value: filterValues.cliente });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS.map((e) => ({ value: e.apiValue, label: e.label })),
      placeholder: 'Todos',
    },
    {
      key: 'cliente',
      label: 'Cliente',
      type: 'select',
      options: clientes.map((c) => ({ value: c, label: c })),
      placeholder: 'Todos',
    },
  ];

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
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

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: Proyecto) => {
    setSelectedItem(item);
    setForm({
      nombre: item.nombre,
      cliente: item.cliente,
      presupuesto: String(item.presupuesto),
      fechaInicio: item.fechaInicio,
      fechaFin: item.fechaFin,
      progreso: String(item.progreso),
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: Proyecto) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const openView = useCallback((item: Proyecto) => {
    setViewItem(item);
  }, []);

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.nombre.trim()) {
      showToast('El nombre del proyecto es obligatorio.', 'error');
      return false;
    }
    if (!form.cliente) {
      showToast('Selecciona un cliente.', 'error');
      return false;
    }
    const ppto = parseFloat(form.presupuesto);
    if (!form.presupuesto || isNaN(ppto) || ppto <= 0) {
      showToast('Ingresa un presupuesto válido mayor a cero.', 'error');
      return false;
    }
    if (!form.fechaInicio || !form.fechaFin) {
      showToast('Las fechas de inicio y fin son obligatorias.', 'error');
      return false;
    }
    if (form.fechaFin < form.fechaInicio) {
      showToast('La fecha de fin no puede ser anterior a la de inicio.', 'error');
      return false;
    }
    const progreso = parseFloat(form.progreso);
    if (isNaN(progreso) || progreso < 0 || progreso > 100) {
      showToast('El progreso debe estar entre 0 y 100.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── CRUD local ──
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const nuevo: Proyecto = {
        id: crypto.randomUUID(),
        nombre: form.nombre.trim(),
        cliente: form.cliente,
        presupuesto: parseFloat(form.presupuesto),
        gastado: 0,
        progreso: parseFloat(form.progreso),
        estado: 'En Proceso',
        ubicacion: 'Por definir',
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        ingresoCobrado: 0,
        gastoNomina: 0,
        gastoCombustible: 0,
        gastoMantenimiento: 0,
        gastoMateriales: 0,
        utilidadReal: 0,
        margenUtilidadPorcentaje: 0,
        historicoProgreso: [],
      };
      setRegistros((prev) => [nuevo, ...prev]);
      showToast(`Proyecto "${nuevo.nombre}" creado exitosamente.`, 'success');
      setCreateOpen(false);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, form, showToast]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      setRegistros((prev) =>
        prev.map((p) =>
          p.id === selectedItem.id
            ? {
                ...p,
                nombre: form.nombre.trim(),
                cliente: form.cliente,
                presupuesto: parseFloat(form.presupuesto),
                progreso: parseFloat(form.progreso),
                fechaInicio: form.fechaInicio,
                fechaFin: form.fechaFin,
              }
            : p,
        ),
      );
      showToast(`Proyecto "${form.nombre}" actualizado exitosamente.`, 'success');
      setEditOpen(false);
      setSelectedItem(null);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, validateForm, form, showToast]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      setRegistros((prev) => prev.filter((p) => p.id !== selectedItem.id));
      showToast(`Proyecto "${selectedItem.nombre}" eliminado exitosamente.`, 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast]);

  // ── Barra de progreso por fila ──
  const renderProgreso = (item: Proyecto) => {
    const barColor =
      item.progreso >= 100 ? 'bg-green-500'
      : item.estado === 'Pausado' ? 'bg-amber-500'
      : 'bg-primary';
    return (
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          {/* Width calculada en runtime — excepción permitida */}
          <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${Math.min(100, item.progreso)}%` }} />
        </div>
        <span className="text-xs font-black text-slate-600 w-10 text-right">{item.progreso}%</span>
      </div>
    );
  };

  // ── Columnas de DataTable ──
  const columns: Column<Proyecto>[] = [
    {
      key: 'nombre',
      header: 'Proyecto / Cliente',
      render: (item) => (
        <div>
          <div className="font-black text-slate-900">{item.nombre}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.cliente}</div>
        </div>
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
      key: 'progreso',
      header: 'Progreso',
      render: renderProgreso,
    },
    {
      key: 'presupuesto',
      header: 'Presupuesto',
      align: 'right',
      render: (item) => (
        <span className="font-black text-slate-900">{formatCurrency(item.presupuesto)}</span>
      ),
    },
    {
      key: 'fechaInicio',
      header: 'Inicio',
      render: (item) => (
        <span className="whitespace-nowrap font-semibold text-slate-500">{formatDate(item.fechaInicio)}</span>
      ),
    },
    {
      key: 'fechaFin',
      header: 'Entrega',
      render: (item) => (
        <span className="whitespace-nowrap font-bold text-slate-600">{formatDate(item.fechaFin)}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {puedeVer && (
            <Button
              variant="info"
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openView(item); }}
            >
              Ver
            </Button>
          )}
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
        title="Gestión de Proyectos"
        subtitle="Control físico y financiero de obras activas."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Nuevo Proyecto
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<FolderKanban className="w-6 h-6" />}
          value={stats.total}
          label="Total Proyectos"
          color="info"
        />
        <StatsCard
          icon={<HardHat className="w-6 h-6" />}
          value={stats.enProceso}
          label="En Proceso"
          color={stats.enProceso > 0 ? 'primary' : 'neutral'}
        />
        <StatsCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          value={stats.finalizados}
          label="Finalizados"
          color={stats.finalizados > 0 ? 'success' : 'neutral'}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por proyecto o cliente..."
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
          keyExtractor={(item) => item.id}
          emptyText="No se encontraron proyectos que coincidan con la búsqueda."
          maxBodyHeight="520px"
        />
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalRecords={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nuevo Proyecto"
        subtitle="Registra una nueva obra para control físico y financiero."
        submitLabel="Crear Proyecto"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre del proyecto" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Fraccionamiento Valle Norte"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Cliente" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Presupuesto (MXN)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              className={modalInputClass}
              placeholder="1500000"
              value={form.presupuesto}
              onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}
            />
          </ModalField>

          <ModalField label="Progreso (%)" hint="Avance físico inicial de la obra.">
            <input
              type="number"
              min="0"
              max="100"
              className={modalInputClass}
              value={form.progreso}
              onChange={(e) => setForm({ ...form, progreso: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha de inicio" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha estimada de entrega" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Proyecto"
        subtitle={selectedItem ? `Editando: ${selectedItem.nombre}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre del proyecto" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Cliente" required className="sm:col-span-2">
            <select
              className={modalSelectClass}
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Presupuesto (MXN)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              className={modalInputClass}
              value={form.presupuesto}
              onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}
            />
          </ModalField>

          <ModalField label="Progreso (%)" hint="Avance físico de la obra.">
            <input
              type="number"
              min="0"
              max="100"
              className={modalInputClass}
              value={form.progreso}
              onChange={(e) => setForm({ ...form, progreso: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha de inicio" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
          </ModalField>

          <ModalField label="Fecha estimada de entrega" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Proyecto"
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
              ¿Estás seguro de eliminar este proyecto?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">{selectedItem.nombre}</p>
            <p className="text-xs text-slate-500">
              {selectedItem.cliente} · {formatCurrency(selectedItem.presupuesto)}
            </p>
          </div>
        )}
      </FormModal>

      {/* Modal de detalle (curva S, CPI/SPI, rentabilidad, personal y flota) */}
      {viewItem && (
        <ProjectDetailsModal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          proyecto={viewItem}
        />
      )}
    </div>
  );
}
