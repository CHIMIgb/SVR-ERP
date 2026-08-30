"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, ReceiptText, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Eye, Calendar, User, X,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Modal, ModalBody, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  ventasApi,
  type CierreVentaDTO,
  type QueryCierresDto,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 10;

export default function CierresCajaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado de datos ──
  const [cierres, setCierres] = useState<CierreVentaDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modal de rechazo ──
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [selectedCierre, setSelectedCierre] = useState<CierreVentaDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/ventas/cierres');
  const puedeEditar = vista?.puedeEditar ?? false; // usado para aprobar/rechazar
  const puedeVer = vista?.puedeVer ?? false;

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string, filters?: Record<string, string>) => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const query: QueryCierresDto = {
        search: searchVal || undefined,
        estado: filters?.estado as 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' || undefined,
        fechaDesde: filters?.fechaDesde || undefined,
        fechaHasta: filters?.fechaHasta || undefined,
        page,
        limit: PAGE_SIZE,
      };
      const res = await ventasApi.listarCierres(query);
      if (res.success && res.data) {
        setCierres(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar cierres de caja.', 'error');
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
    fetchData(1);
  }, [fetchData]);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.estado) {
    const label = filterValues.estado === 'PENDIENTE' ? 'Pendiente'
      : filterValues.estado === 'APROBADO' ? 'Aprobado' : 'Rechazado';
    activeFilters.push({ key: 'estado', label: 'Estado', value: label });
  }
  if (filterValues.fechaDesde) {
    activeFilters.push({ key: 'fechaDesde', label: 'Desde', value: filterValues.fechaDesde });
  }
  if (filterValues.fechaHasta) {
    activeFilters.push({ key: 'fechaHasta', label: 'Hasta', value: filterValues.fechaHasta });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'PENDIENTE', label: 'Pendiente' },
        { value: 'APROBADO', label: 'Aprobado' },
        { value: 'RECHAZADO', label: 'Rechazado' },
      ],
      placeholder: 'Todos',
    },
    {
      key: 'fechaDesde',
      label: 'Fecha desde',
      type: 'date',
      placeholder: 'Desde',
    },
    {
      key: 'fechaHasta',
      label: 'Fecha hasta',
      type: 'date',
      placeholder: 'Hasta',
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

  const handleClearFilters = useCallback(() => {
    setFilterValues({ estado: '', fechaDesde: '', fechaHasta: '' });
    fetchData(1, search, { estado: '', fechaDesde: '', fechaHasta: '' });
  }, [fetchData, search]);

  const handleRemoveFilter = useCallback((key: string) => {
    const next = { ...filterValues };
    delete next[key];
    setFilterValues(next);
    fetchData(1, search, next);
  }, [fetchData, search, filterValues]);

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, search, filterValues);
  }, [fetchData, search, filterValues]);

  // ── Handlers Aprobar/Rechazar ──
  const handleAprobar = useCallback(async (cierre: CierreVentaDTO) => {
    setSubmitting(true);
    try {
      const res = await ventasApi.aprobarCierre(cierre.id);
      if (res.success) {
        showToast('Cierre aprobado correctamente.', 'success');
        fetchData(pagination.page, search, filterValues);
      } else {
        showToast(res.error?.message ?? 'No se pudo aprobar el cierre.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [showToast, fetchData, pagination.page, search, filterValues]);

  const openReject = useCallback((cierre: CierreVentaDTO) => {
    setSelectedCierre(cierre);
    setRejectMotivo('');
    setRejectOpen(true);
  }, []);

  const handleRechazar = useCallback(async () => {
    if (!selectedCierre || !rejectMotivo.trim()) return;
    setSubmitting(true);
    try {
      const res = await ventasApi.rechazarCierre(selectedCierre.id, rejectMotivo.trim());
      if (res.success) {
        showToast('Cierre rechazado.', 'success');
        setRejectOpen(false);
        setRejectMotivo('');
        setSelectedCierre(null);
        fetchData(pagination.page, search, filterValues);
      } else {
        showToast(res.error?.message ?? 'No se pudo rechazar el cierre.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedCierre, rejectMotivo, showToast, fetchData, pagination.page, search, filterValues]);

  // ── Formatear estado ──
  const getEstadoBadge = (estado?: string) => {
    switch (estado) {
      case 'APROBADO':
        return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'RECHAZADO':
        return <Badge variant="error" size="sm"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      case 'PENDIENTE':
      default:
        return <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  // ── Columnas de DataTable ──
  const columns: Column<CierreVentaDTO>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => (
        <div className="font-medium text-slate-900">{item.fecha}</div>
      ),
    },
    {
      key: 'cajero',
      header: 'Cajero',
      render: (item) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">{item.cajero}</span>
        </div>
      ),
    },
    {
      key: 'ventasCount',
      header: 'Ventas',
      align: 'center',
      render: (item) => (
        <span className="font-black text-slate-900">{item.ventasCount}</span>
      ),
    },
    {
      key: 'totalVentas',
      header: 'Total Ventas',
      align: 'right',
      render: (item) => (
        <span className="font-black text-slate-900">{formatCurrency(item.totalVentas)}</span>
      ),
    },
    {
      key: 'esperado',
      header: 'Esperado',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-slate-600">{formatCurrency(item.esperado)}</span>
      ),
    },
    {
      key: 'contado',
      header: 'Contado',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-slate-600">{formatCurrency(item.contado)}</span>
      ),
    },
    {
      key: 'diferencia',
      header: 'Diferencia',
      align: 'right',
      render: (item) => (
        <span className={`font-black ${item.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {item.diferencia > 0 ? '+' : ''}{formatCurrency(item.diferencia)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (item) => getEstadoBadge(item.estado),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {puedeEditar && item.estado === 'PENDIENTE' && (
            <>
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={(e) => { e.stopPropagation(); handleAprobar(item); }}
                disabled={submitting}
              >
                Aprobar
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-3.5 h-3.5" />}
                onClick={(e) => { e.stopPropagation(); openReject(item); }}
                disabled={submitting}
              >
                Rechazar
              </Button>
            </>
          )}
          {item.estado !== 'PENDIENTE' && (
            <span className="text-xs text-slate-400 font-medium">Sin acciones</span>
          )}
        </div>
      ),
    },
  ];

  // ── Stats Cards ──
  const pendingCount = cierres.filter((c) => c.estado === 'PENDIENTE').length;
  const approvedCount = cierres.filter((c) => c.estado === 'APROBADO').length;
  const rejectedCount = cierres.filter((c) => c.estado === 'RECHAZADO').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Cierres de Caja"
        subtitle="Historial y aprobación de cierres de caja diarios."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<ReceiptText className="w-6 h-6" />}
          value={`${pagination.total} cierres`}
          label="Total Registrados"
          color="info"
        />
        <StatsCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          value={`${approvedCount} aprobados`}
          label="Aprobados"
          color={approvedCount > 0 ? 'success' : 'neutral'}
        />
        <StatsCard
          icon={<AlertTriangle className="w-6 h-6" />}
          value={`${pendingCount} pendientes`}
          label="Pendientes de Aprobación"
          color={pendingCount > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por cajero, notas..."
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<Filter className="w-4 h-4" />}
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
                {filter.type === 'date' ? (
                  <input
                    type="date"
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary/50"
                  />
                ) : (
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
                )}
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
            data={cierres}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron cierres que coincidan con la búsqueda."
            maxBodyHeight="500px"
          />
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.total}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>

      {/* ═══════════════════════════════════════════
          MODAL RECHAZAR
          ═══════════════════════════════════════════ */}
      <Modal open={rejectOpen} onClose={() => { setRejectOpen(false); setSelectedCierre(null); setRejectMotivo(''); }} size="md">
        <ModalHeader
          title="Rechazar cierre de caja"
          subtitle={selectedCierre ? `Cajero: ${selectedCierre.cajero} · Fecha: ${selectedCierre.fecha}` : undefined}
          onClose={() => { setRejectOpen(false); setSelectedCierre(null); setRejectMotivo(''); }}
        />
        <ModalBody>
          <div className="space-y-4">
            <Textarea
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
              placeholder="Motivo del rechazo (obligatorio, mín. 3 caracteres)..."
              rows={5}
            />
            {selectedCierre && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Detalle del cierre
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Esperado:</span>
                    <span className="font-black text-slate-900 ml-2">{formatCurrency(selectedCierre.esperado)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Contado:</span>
                    <span className="font-black text-slate-900 ml-2">{formatCurrency(selectedCierre.contado)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Diferencia:</span>
                    <span className={`font-black ml-2 ${selectedCierre.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedCierre.diferencia > 0 ? '+' : ''}{formatCurrency(selectedCierre.diferencia)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Fondo sig. turno:</span>
                    <span className="font-black text-slate-900 ml-2">{formatCurrency(selectedCierre.fondoSiguiente)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="secondary" onClick={() => { setRejectOpen(false); setSelectedCierre(null); setRejectMotivo(''); }}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            icon={<XCircle className="w-4 h-4" />}
            onClick={handleRechazar}
            disabled={!rejectMotivo.trim() || submitting}
            loading={submitting}
          >
            Confirmar rechazo
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}