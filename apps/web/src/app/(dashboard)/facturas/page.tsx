"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Receipt, Clock, BadgeCheck, Ban, Banknote,
  Trash2, SlidersHorizontal, X, Loader2, Eye,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
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
import {
  facturasApi,
  clientesApi,
  type FacturaDTO,
  type FacturaConceptoDTO,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

const ESTADO_BADGE: Record<string, { label: string; variant: 'warning' | 'success' | 'info' | 'error' }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  TIMBRADA: { label: 'Timbrada', variant: 'success' },
  PAGADA: { label: 'Pagada', variant: 'info' },
  CANCELADA: { label: 'Cancelada', variant: 'error' },
};

const FORMAS_PAGO = ['Pago en una sola exhibición', 'Pago en parcialidades o diferido'];
const USOS_CFDI = [
  { value: 'G01', label: 'Adquisición de mercancías' },
  { value: 'G03', label: 'Gastos en general' },
  { value: 'I01', label: 'Construcciones' },
  { value: 'I02', label: 'Mobiliario y equipo' },
];

// ── Form defaults ──
const emptyForm = {
  clienteId: '',
  serie: 'F',
  formaPago: 'Pago en una sola exhibición',
  usoCfdi: 'G03',
  conceptos: [{ cantidad: '1', unidad: 'Servicio', descripcion: '', valorUnitario: '', objetoImpuesto: '04' }],
};

const emptyStateForm = { estado: 'TIMBRADA', motivoCancelacion: '' };

export default function FacturasPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado de datos ──
  const [facturas, setFacturas] = useState<FacturaDTO[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nombre: string; empresa: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<FacturaDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [stateForm, setStateForm] = useState(emptyStateForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/facturas');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Cargar catálogo de clientes (una sola vez) ──
  useEffect(() => {
    clientesApi.listar({ page: 1, limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setClientes(res.data.items.map((c) => ({ id: c.id, nombre: c.nombre, empresa: c.empresa })));
      }
    });
  }, []);

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await facturasApi.listar({
        search: searchVal || undefined,
        estado: filters?.estado || undefined,
        clienteId: filters?.clienteId || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setFacturas(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar facturas.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      hasLoaded.current = true;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.estado) {
    activeFilters.push({
      key: 'estado',
      label: 'Estado',
      value: ESTADO_BADGE[filterValues.estado]?.label ?? filterValues.estado,
    });
  }
  if (filterValues.clienteId) {
    const cli = clientes.find(c => c.id === filterValues.clienteId);
    activeFilters.push({ key: 'clienteId', label: 'Cliente', value: cli?.empresa || cli?.nombre || filterValues.clienteId });
  }

  // ── Filtros para panel ──
  const filterFields: FilterField[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: Object.entries(ESTADO_BADGE).map(([value, meta]) => ({ value, label: meta.label })),
      placeholder: 'Todos',
    },
    {
      key: 'clienteId',
      label: 'Cliente',
      type: 'select',
      options: clientes.map((c) => ({ value: c.id, label: c.empresa || c.nombre })),
      placeholder: 'Todos',
    },
  ];

  // ── Handlers de filtros ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSearch = useCallback(() => {
    fetchData(1, search, filterValues);
  }, [fetchData, search, filterValues]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    const next = { ...filterValues, [key]: value };
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search, filterValues]);

  const handleRemoveFilter = useCallback((key: string) => {
    const next = { ...filterValues, [key]: '' };
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search, filterValues]);

  const handleClearFilters = useCallback(() => {
    const empty = { estado: '', clienteId: '' };
    setFilterValues(empty);
    fetchData(1, search, empty);
  }, [fetchData, search]);

  // ── Helpers de concepto ──
  const updateConcepto = (idx: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      conceptos: prev.conceptos.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  };

  const totalCalculado = form.conceptos.reduce((acc, c) => {
    const importe = (Number(c.cantidad) || 0) * (Number(c.valorUnitario) || 0);
    const iva = c.objetoImpuesto === '04' ? importe * 0.16 : 0;
    return acc + importe + iva;
  }, 0);

  // ── Acciones CRUD ──
  const handleCreate = async () => {
    if (!form.clienteId) {
      showToast('Selecciona un cliente.', 'error');
      return;
    }
    if (form.conceptos.length === 0 || !form.conceptos[0].descripcion.trim()) {
      showToast('Agrega al menos un concepto con descripción.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await facturasApi.crear({
        clienteId: form.clienteId,
        serie: form.serie || 'F',
        formaPago: form.formaPago,
        usoCfdi: form.usoCfdi,
        conceptos: form.conceptos.map((c) => ({
          cantidad: Number(c.cantidad) || 1,
          unidad: c.unidad || 'Servicio',
          descripcion: c.descripcion.trim(),
          valorUnitario: Number(c.valorUnitario) || 0,
          objetoImpuesto: c.objetoImpuesto,
        })),
      });
      if (!res.success) {
        showToast(res.error?.message ?? 'Error al crear la factura.', 'error');
        return;
      }
      showToast(`Factura ${res.data.codigo} creada en estado Pendiente.`, 'success');
      setCreateOpen(false);
      setForm(emptyForm);
      fetchData(1, search, filterValues);
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!selected) return;
    if (stateForm.estado === 'CANCELADA' && !stateForm.motivoCancelacion.trim()) {
      showToast('Indica el motivo de cancelación.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await facturasApi.cambiarEstado(selected.id, {
        estado: stateForm.estado as 'TIMBRADA' | 'CANCELADA',
        ...(stateForm.estado === 'CANCELADA' ? { motivoCancelacion: stateForm.motivoCancelacion.trim() } : {}),
      });
      if (res.success) {
        showToast(
          stateForm.estado === 'TIMBRADA' ? 'Factura timbrada correctamente.' : 'Factura cancelada.',
          'success',
        );
        setStateOpen(false);
        setSelected(null);
        fetchData(pagination.page, search, filterValues);
      } else {
        showToast(res.error?.message ?? 'Error al cambiar estado.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await facturasApi.eliminar(selected.id);
      if (res.success) {
        showToast('Factura eliminada.', 'success');
        setDeleteOpen(false);
        setSelected(null);
        fetchData(pagination.page, search, filterValues);
      } else {
        showToast(res.error?.message ?? 'Error al eliminar.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Columnas de DataTable ──
  const columns: Column<FacturaDTO>[] = [
    {
      key: 'codigo',
      header: 'Folio',
      render: (f) => (
        <div>
          <span className="font-black text-slate-900">{f.codigo}</span>
          {f.cotizacionCodigo && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.cotizacionCodigo}</div>
          )}
        </div>
      ),
    },
    {
      key: 'empresa',
      header: 'Cliente',
      render: (f) => (
        <div>
          <div className="font-semibold text-slate-900">{f.empresa || f.clienteNombre}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.rfc}</div>
        </div>
      ),
    },
    {
      key: 'fechaEmision',
      header: 'Emisión',
      render: (f) => <span className="font-semibold text-slate-600">{f.fechaEmision}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (f) => <span className="font-black text-slate-900">{formatCurrency(f.total)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (f) => {
        const badge = ESTADO_BADGE[f.estado];
        return badge ? <Badge variant={badge.variant} size="sm">{badge.label}</Badge> : <Badge size="sm">{f.estado}</Badge>;
      },
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelected(f);
              setDetailOpen(true);
            }}
          >
            Ver
          </Button>
          {puedeEditar && f.estado === 'PENDIENTE' && (
            <Button
              variant="success"
              size="sm"
              icon={<BadgeCheck className="w-3.5 h-3.5" />}
              onClick={() => {
                setSelected(f);
                setStateForm({ ...emptyStateForm, estado: 'TIMBRADA' });
                setStateOpen(true);
              }}
            >
              Timbrar
            </Button>
          )}
          {puedeEditar && f.estado === 'PENDIENTE' && (
            <Button
              variant="danger"
              size="sm"
              icon={<Ban className="w-3.5 h-3.5" />}
              onClick={() => {
                setSelected(f);
                setStateForm({ ...emptyStateForm, estado: 'CANCELADA' });
                setStateOpen(true);
              }}
            >
              Cancelar
            </Button>
          )}
          {puedeEliminar && f.estado === 'PENDIENTE' && !f.cuentaPorCobrar && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                setSelected(f);
                setDeleteOpen(true);
              }}
            >
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Stats (computados de la página actual) ──
  const stats = {
    total: pagination.total,
    pendientes: facturas.filter(f => f.estado === 'PENDIENTE').length,
    montoTotal: facturas.reduce((acc, f) => acc + f.total, 0),
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Facturas"
        subtitle="Emite, timbra y administra las facturas de tus clientes."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setCreateOpen(true)}>
              Nueva factura
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard icon={<Receipt className="w-6 h-6" />} value={`${stats.total}`} label="Total Facturas" color="info" />
        <StatsCard icon={<Clock className="w-6 h-6" />} value={`${stats.pendientes}`} label="Pendientes (página)" color="warning" />
        <StatsCard icon={<Banknote className="w-6 h-6" />} value={formatCurrency(stats.montoTotal)} label="Monto (página)" color="success" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar folio, cliente o RFC..."
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
        <div className="relative">
          {refreshing && !initialLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-opacity">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={facturas}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron facturas que coincidan con la búsqueda."
            maxBodyHeight="500px"
          />
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.total}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => fetchData(p, search, filterValues)}
        />
      </div>

      {/* ── Modal detalle ── */}
      <FormModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onCancel={() => setDetailOpen(false)}
        title={selected ? `Factura ${selected.codigo}` : ''}
        subtitle={selected ? `${selected.empresa || selected.clienteNombre} — ${ESTADO_BADGE[selected.estado]?.label ?? selected.estado}` : ''}
        hideFooter
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RFC</p>
                <p className="font-semibold text-slate-900">{selected.rfc || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emisión</p>
                <p className="font-semibold text-slate-900">{selected.fechaEmision}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de pago</p>
                <p className="font-semibold text-slate-900">{selected.formaPago || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uso de CFDI</p>
                <p className="font-semibold text-slate-900">{selected.usoCfdi || '—'}</p>
              </div>
              {selected.cotizacionCodigo && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cotización origen</p>
                  <p className="font-semibold text-slate-900">{selected.cotizacionCodigo}</p>
                </div>
              )}
              {selected.timbradoEn && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timbrado</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(selected.timbradoEn).toLocaleString('es-MX')}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Conceptos</p>
              <div className="space-y-2">
                {selected.conceptos.map((c: FacturaConceptoDTO) => (
                  <div key={c.id} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{c.descripcion}</p>
                      <p className="text-xs text-slate-400">
                        {c.cantidad} × {formatCurrency(c.valorUnitario)} {c.unidad}
                        {c.objetoImpuesto === '04' ? ' · IVA 16%' : ' · Exento'}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">{formatCurrency(c.importe)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selected.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Impuestos</span>
                <span>{formatCurrency(selected.impuestos)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(selected.total)}</span>
              </div>
            </div>
          </div>
        )}
      </FormModal>

      {/* ── Modal crear ── */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nueva factura"
        subtitle="La factura se crea en estado Pendiente."
        submitLabel="Crear factura"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <ModalField label="Cliente" required>
          <select
            className={modalSelectClass}
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
          >
            <option value="">Selecciona un cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.empresa || c.nombre}</option>
            ))}
          </select>
        </ModalField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Serie">
            <input
              type="text"
              className={modalInputClass}
              value={form.serie}
              onChange={(e) => setForm({ ...form, serie: e.target.value })}
            />
          </ModalField>
          <ModalField label="Forma de pago">
            <select
              className={modalSelectClass}
              value={form.formaPago}
              onChange={(e) => setForm({ ...form, formaPago: e.target.value })}
            >
              {FORMAS_PAGO.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </ModalField>
        </div>

        <ModalField label="Uso de CFDI">
          <select
            className={modalSelectClass}
            value={form.usoCfdi}
            onChange={(e) => setForm({ ...form, usoCfdi: e.target.value })}
          >
            {USOS_CFDI.map((u) => (
              <option key={u.value} value={u.value}>{u.label} ({u.value})</option>
            ))}
          </select>
        </ModalField>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700">Conceptos</label>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setForm({ ...form, conceptos: [...form.conceptos, { ...emptyForm.conceptos[0] }] })}
            >
              Agregar
            </Button>
          </div>

          {form.conceptos.map((c, idx) => (
            <div key={idx} className="space-y-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 mb-3">
              <ModalField label={`Concepto ${idx + 1}`} required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Descripción del servicio / producto"
                  value={c.descripcion}
                  onChange={(e) => updateConcepto(idx, 'descripcion', e.target.value)}
                />
              </ModalField>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ModalField label="Cant.">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={modalInputClass}
                    value={c.cantidad}
                    onChange={(e) => updateConcepto(idx, 'cantidad', e.target.value)}
                  />
                </ModalField>
                <ModalField label="Unidad">
                  <input
                    type="text"
                    className={modalInputClass}
                    value={c.unidad}
                    onChange={(e) => updateConcepto(idx, 'unidad', e.target.value)}
                  />
                </ModalField>
                <ModalField label="P. unitario">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={modalInputClass}
                    value={c.valorUnitario}
                    onChange={(e) => updateConcepto(idx, 'valorUnitario', e.target.value)}
                  />
                </ModalField>
                <ModalField label="Impuesto">
                  <select
                    className={modalSelectClass}
                    value={c.objetoImpuesto}
                    onChange={(e) => updateConcepto(idx, 'objetoImpuesto', e.target.value)}
                  >
                    <option value="04">IVA 16%</option>
                    <option value="02">Exento</option>
                  </select>
                </ModalField>
              </div>
              {form.conceptos.length > 1 && (
                <button
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                  onClick={() => setForm({ ...form, conceptos: form.conceptos.filter((_, i) => i !== idx) })}
                >
                  Quitar concepto
                </button>
              )}
            </div>
          ))}

          <div className="flex justify-end text-sm font-semibold text-slate-700">
            Total con IVA: {formatCurrency(totalCalculado)}
          </div>
        </div>
      </FormModal>

      {/* ── Modal timbrar / cancelar ── */}
      <FormModal
        open={stateOpen}
        onClose={() => setStateOpen(false)}
        onCancel={() => setStateOpen(false)}
        title={stateForm.estado === 'TIMBRADA' ? 'Timbrar factura' : 'Cancelar factura'}
        subtitle={selected?.codigo}
        submitLabel={stateForm.estado === 'TIMBRADA' ? 'Timbrar' : 'Cancelar factura'}
        cancelLabel="Cancelar"
        onSubmit={handleCambiarEstado}
        isSubmitting={submitting}
      >
        {stateForm.estado === 'CANCELADA' ? (
          <ModalField label="Motivo de cancelación" required>
            <textarea
              className={modalInputClass}
              rows={3}
              value={stateForm.motivoCancelacion}
              onChange={(e) => setStateForm({ ...stateForm, motivoCancelacion: e.target.value })}
            />
          </ModalField>
        ) : (
          <p className="text-sm text-slate-500">
            Al timbrar la factura quedará en estado Timbrada y ya no podrá editarse.
          </p>
        )}
      </FormModal>

      {/* ── Modal eliminar ── */}
      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar factura"
        subtitle={selected?.codigo}
        submitLabel="Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        <p className="text-sm text-slate-500">
          La factura se eliminará (soft delete) y no podrá recuperarse. Solo se eliminan facturas
          en estado Pendiente sin cuenta por cobrar asociada.
        </p>
      </FormModal>
    </div>
  );
}