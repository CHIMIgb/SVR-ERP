"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus, Package, ArrowUpRight, Clock, Gauge,
  Grip, LayoutGrid, Droplets,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle,
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
import { formatDate } from '@/lib/formatters';
import { registrosCriba as registrosMock, type RegistroCriba } from '@/lib/data';

// ── Constantes ──
const PAGE_SIZE = 10;

const TURNOS: { value: RegistroCriba['turno']; label: string }[] = [
  { value: 'Matutino', label: 'Matutino' },
  { value: 'Vespertino', label: 'Vespertino' },
];

const MATERIALES = ['Criba fina', 'Criba gruesa', 'Arena lavada'] as const;

const materialVariant: Record<string, 'warning' | 'primary' | 'info'> = {
  'Criba fina': 'warning',
  'Criba gruesa': 'primary',
  'Arena lavada': 'info',
};

const turnoVariant: Record<RegistroCriba['turno'], 'warning' | 'info'> = {
  Matutino: 'warning',
  Vespertino: 'info',
};

const emptyForm = {
  fecha: new Date().toISOString().split('T')[0],
  turno: 'Matutino' as RegistroCriba['turno'],
  operador: '',
  tipoMaterial: 'Criba fina',
  materialProducido: '',
  horasTrabajadas: '',
  materialAlBanco: '',
  observaciones: '',
};

/** Color de la tarjeta de eficiencia según umbral de planta. */
function colorEficiencia(ef: number): 'success' | 'warning' | 'error' {
  if (ef >= 90) return 'success';
  if (ef >= 70) return 'warning';
  return 'error';
}

export default function CribaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/criba');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos (local hasta integrar API /criba) ──
  const [registros, setRegistros] = useState<RegistroCriba[]>(registrosMock);
  const [page, setPage] = useState(1);

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RegistroCriba | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Filtrado ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registros.filter((r) => {
      if (
        q &&
        !r.operador.toLowerCase().includes(q) &&
        !r.tipoMaterial.toLowerCase().includes(q) &&
        !(r.observaciones ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filterValues.turno && r.turno !== filterValues.turno) return false;
      if (filterValues.material && r.tipoMaterial !== filterValues.material) return false;
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

  // ── KPIs globales ──
  const stats = useMemo(() => {
    const totalProducido = registros.reduce((s, r) => s + r.materialProducido, 0);
    const totalAlBanco = registros.reduce((s, r) => s + r.materialAlBanco, 0);
    const totalHoras = registros.reduce((s, r) => s + r.horasTrabajadas, 0);
    const eficiencia = totalProducido > 0 ? Math.round((totalAlBanco / totalProducido) * 100) : 0;

    const porMaterial = MATERIALES.map((tipo) => {
      const delTipo = registros.filter((r) => r.tipoMaterial === tipo);
      const producido = delTipo.reduce((s, r) => s + r.materialProducido, 0);
      const alBanco = delTipo.reduce((s, r) => s + r.materialAlBanco, 0);
      return {
        tipo,
        alBanco,
        ef: producido > 0 ? Math.round((alBanco / producido) * 100) : 0,
      };
    });

    return { totalProducido, totalAlBanco, totalHoras, eficiencia, porMaterial };
  }, [registros]);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.turno) {
    activeFilters.push({ key: 'turno', label: 'Turno', value: filterValues.turno });
  }
  if (filterValues.material) {
    activeFilters.push({ key: 'material', label: 'Material', value: filterValues.material });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'turno',
      label: 'Turno',
      type: 'select',
      options: TURNOS.map((t) => ({ value: t.value, label: t.label })),
      placeholder: 'Todos',
    },
    {
      key: 'material',
      label: 'Material',
      type: 'select',
      options: MATERIALES.map((m) => ({ value: m, label: m })),
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

  const openEdit = useCallback((item: RegistroCriba) => {
    setSelectedItem(item);
    setForm({
      fecha: item.fecha,
      turno: item.turno,
      operador: item.operador,
      tipoMaterial: item.tipoMaterial,
      materialProducido: String(item.materialProducido),
      horasTrabajadas: String(item.horasTrabajadas),
      materialAlBanco: String(item.materialAlBanco),
      observaciones: item.observaciones ?? '',
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: RegistroCriba) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── Validación ──
  const validateForm = useCallback(() => {
    if (!form.fecha || !form.operador.trim()) {
      showToast('La fecha y el operador son obligatorios.', 'error');
      return false;
    }
    const producido = parseFloat(form.materialProducido);
    if (!form.materialProducido || isNaN(producido) || producido <= 0) {
      showToast('Ingresa un material producido válido mayor a cero.', 'error');
      return false;
    }
    const horas = parseFloat(form.horasTrabajadas);
    if (!form.horasTrabajadas || isNaN(horas) || horas <= 0) {
      showToast('Ingresa las horas trabajadas del turno.', 'error');
      return false;
    }
    const alBanco = parseFloat(form.materialAlBanco);
    if (isNaN(alBanco) || alBanco < 0 || alBanco > producido) {
      showToast('El material al banco no puede ser negativo ni mayor a lo producido.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  // ── CRUD local ──
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const nuevo: RegistroCriba = {
        id: crypto.randomUUID(),
        fecha: form.fecha,
        turno: form.turno,
        operador: form.operador.trim(),
        tipoMaterial: form.tipoMaterial,
        materialProducido: parseFloat(form.materialProducido),
        horasTrabajadas: parseFloat(form.horasTrabajadas),
        materialAlBanco: parseFloat(form.materialAlBanco),
        observaciones: form.observaciones.trim() || undefined,
      };
      setRegistros((prev) => [nuevo, ...prev]);
      showToast(`Registro de turno ${nuevo.turno.toLowerCase()} creado exitosamente.`, 'success');
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
        prev.map((r) =>
          r.id === selectedItem.id
            ? {
                ...r,
                fecha: form.fecha,
                turno: form.turno,
                operador: form.operador.trim(),
                tipoMaterial: form.tipoMaterial,
                materialProducido: parseFloat(form.materialProducido),
                horasTrabajadas: parseFloat(form.horasTrabajadas),
                materialAlBanco: parseFloat(form.materialAlBanco),
                observaciones: form.observaciones.trim() || undefined,
              }
            : r,
        ),
      );
      showToast('Registro actualizado exitosamente.', 'success');
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
      setRegistros((prev) => prev.filter((r) => r.id !== selectedItem.id));
      showToast('Registro eliminado exitosamente.', 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast]);

  // ── Columnas de DataTable ──
  const columns: Column<RegistroCriba>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <span className="whitespace-nowrap font-bold text-slate-600">{formatDate(item.fecha)}</span>
      ),
    },
    {
      key: 'turno',
      header: 'Turno',
      render: (item) => (
        <Badge variant={turnoVariant[item.turno]} size="sm" dot>{item.turno}</Badge>
      ),
    },
    {
      key: 'operador',
      header: 'Operador',
      render: (item) => (
        <span className="font-bold text-slate-700">{item.operador}</span>
      ),
    },
    {
      key: 'tipoMaterial',
      header: 'Material',
      render: (item) => (
        <Badge variant={materialVariant[item.tipoMaterial] ?? 'neutral'} size="sm" dot>
          {item.tipoMaterial}
        </Badge>
      ),
    },
    {
      key: 'materialProducido',
      header: 'Producido',
      align: 'right',
      render: (item) => (
        <span className="font-black text-slate-900">
          {item.materialProducido} <span className="text-slate-400 font-bold text-xs">m³</span>
        </span>
      ),
    },
    {
      key: 'materialAlBanco',
      header: 'Al banco',
      align: 'right',
      render: (item) => (
        <span className="font-black text-green-700">
          {item.materialAlBanco} <span className="text-green-400 font-bold text-xs">m³</span>
        </span>
      ),
    },
    {
      key: 'horasTrabajadas',
      header: 'Horas',
      align: 'right',
      render: (item) => (
        <span className="font-bold text-slate-600">{item.horasTrabajadas}h</span>
      ),
    },
    {
      key: 'eficiencia',
      header: 'Efic.',
      align: 'right',
      render: (item) => {
        const ef = item.materialProducido > 0
          ? Math.round((item.materialAlBanco / item.materialProducido) * 100)
          : 0;
        return (
          <Badge variant={colorEficiencia(ef)} size="sm">{ef}%</Badge>
        );
      },
    },
    {
      key: 'observaciones',
      header: 'Observaciones',
      render: (item) => (
        <span className="text-slate-500 font-medium text-xs max-w-[180px] truncate block">
          {item.observaciones || <span className="text-slate-300">—</span>}
        </span>
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
        title="Criba"
        subtitle="Producción diaria por turno — material producido y enviado al banco."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Registrar Turno
            </Button>
          ) : undefined
        }
      />

      {/* KPIs globales — fila 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<Package size={22} />}
          value={`${stats.totalProducido} m³`}
          label="Total Produ."
          color="info"
        />
        <StatsCard
          icon={<ArrowUpRight size={22} />}
          value={`${stats.totalAlBanco} m³`}
          label="Al Banco"
          color="success"
        />
        <StatsCard
          icon={<Clock size={22} />}
          value={`${stats.totalHoras} h`}
          label="Horas Trab."
          color="info"
        />
        <StatsCard
          icon={<Gauge size={22} />}
          value={`${stats.eficiencia}%`}
          label="Eficiencia"
          color={colorEficiencia(stats.eficiencia)}
        />
      </div>

      {/* Resumen por material — fila 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.porMaterial.map((m) => (
          <StatsCard
            key={m.tipo}
            icon={
              m.tipo === 'Criba fina' ? <Grip size={22} />
              : m.tipo === 'Criba gruesa' ? <LayoutGrid size={22} />
              : <Droplets size={22} />
            }
            value={`${m.alBanco} m³`}
            label={m.tipo}
            color={materialVariant[m.tipo] ?? 'neutral'}
            trend="neutral"
            trendValue={`Efic. ${m.ef}%`}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por operador, material u observación..."
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
          emptyText="Sin registros para los filtros seleccionados."
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
        title="Registrar Turno de Criba"
        subtitle="Captura la producción del turno: material producido y enviado al banco."
        submitLabel="Registrar Turno"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>

          <ModalField label="Turno" required>
            <select
              className={modalSelectClass}
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value as RegistroCriba['turno'] })}
            >
              {TURNOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Operador" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Nombre del operador de criba"
              value={form.operador}
              onChange={(e) => setForm({ ...form, operador: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material" required>
            <select
              className={modalSelectClass}
              value={form.tipoMaterial}
              onChange={(e) => setForm({ ...form, tipoMaterial: e.target.value })}
            >
              {MATERIALES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Horas trabajadas" required hint="Duración del turno en horas.">
            <input
              type="number"
              min="0"
              step="0.5"
              className={modalInputClass}
              placeholder="8"
              value={form.horasTrabajadas}
              onChange={(e) => setForm({ ...form, horasTrabajadas: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material producido (m³)" required>
            <input
              type="number"
              min="0"
              className={modalInputClass}
              placeholder="320"
              value={form.materialProducido}
              onChange={(e) => setForm({ ...form, materialProducido: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material al banco (m³)" required hint="No puede exceder lo producido.">
            <input
              type="number"
              min="0"
              className={modalInputClass}
              placeholder="290"
              value={form.materialAlBanco}
              onChange={(e) => setForm({ ...form, materialAlBanco: e.target.value })}
            />
          </ModalField>

          <ModalField label="Observaciones" className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={3}
              placeholder="Notas del turno (opcional)..."
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Registro"
        subtitle={selectedItem ? `${formatDate(selectedItem.fecha)} · ${selectedItem.turno}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </ModalField>

          <ModalField label="Turno" required>
            <select
              className={modalSelectClass}
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value as RegistroCriba['turno'] })}
            >
              {TURNOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Operador" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              value={form.operador}
              onChange={(e) => setForm({ ...form, operador: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material" required>
            <select
              className={modalSelectClass}
              value={form.tipoMaterial}
              onChange={(e) => setForm({ ...form, tipoMaterial: e.target.value })}
            >
              {MATERIALES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Horas trabajadas" required>
            <input
              type="number"
              min="0"
              step="0.5"
              className={modalInputClass}
              value={form.horasTrabajadas}
              onChange={(e) => setForm({ ...form, horasTrabajadas: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material producido (m³)" required>
            <input
              type="number"
              min="0"
              className={modalInputClass}
              value={form.materialProducido}
              onChange={(e) => setForm({ ...form, materialProducido: e.target.value })}
            />
          </ModalField>

          <ModalField label="Material al banco (m³)" required hint="No puede exceder lo producido.">
            <input
              type="number"
              min="0"
              className={modalInputClass}
              value={form.materialAlBanco}
              onChange={(e) => setForm({ ...form, materialAlBanco: e.target.value })}
            />
          </ModalField>

          <ModalField label="Observaciones" className="sm:col-span-2">
            <textarea
              className={modalTextareaClass}
              rows={3}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

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
              ¿Estás seguro de eliminar este registro?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">
              {formatDate(selectedItem.fecha)} · {selectedItem.turno}
            </p>
            <p className="text-xs text-slate-500">
              {selectedItem.operador} · {selectedItem.tipoMaterial}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
