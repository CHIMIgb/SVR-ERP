"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Timer, CheckCircle, Pencil, Trash2, AlertCircle } from 'lucide-react';
import type { Maquina } from '@svr-erp/shared';
import { apiClient } from '@/lib/api';
import { mantenimientoApi, type MantenimientoDTO, type MantenimientoStats, type MantenimientoCreateInput } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { formatCurrency, formatDate } from '@/lib/formatters';

const PAGE_SIZE = 10;

const STATS_CERO: MantenimientoStats = {
  serviciosProximos: 0,
  promedioHorasServicio: 0,
  equiposEnOptimoEstado: 0,
  totalMaquinas: 0,
};

const emptyForm = {
  maquinaId: '',
  tipo: 'Preventivo' as MantenimientoCreateInput['tipo'],
  descripcion: '',
  fecha: new Date().toISOString().split('T')[0],
  horasServicio: '',
  costo: '',
  proximoServicioHoras: '',
};

export default function MantenimientoPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/mantenimiento');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [registros, setRegistros] = useState<MantenimientoDTO[]>([]);
  const [maquinaria, setMaquinaria] = useState<Maquina[]>([]);
  const [stats, setStats] = useState<MantenimientoStats>(STATS_CERO);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Búsqueda y filtro ──
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'' | 'Correctivo' | 'Preventivo'>('');

  // ── Modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MantenimientoDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (page = 1, searchVal?: string, tipo?: string) => {
    if (!hasLoaded.current) setInitialLoading(true);
    else setRefreshing(true);

    const res = await mantenimientoApi.listar({ search: searchVal || undefined, tipo: tipo || undefined, page, limit: PAGE_SIZE });
    if (res.success) {
      setRegistros(res.data.items);
      setPagination(res.data.pagination);
      setErrorCarga(null);
    } else {
      setErrorCarga(res.error.message);
    }
    hasLoaded.current = true;
    setInitialLoading(false);
    setRefreshing(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await mantenimientoApi.stats();
    if (res.success) setStats(res.data);
  }, []);

  useEffect(() => {
    apiClient.get<Maquina[]>('/maquinas').then((res) => {
      if (res.success) setMaquinaria(res.data);
    });
    fetchData(1);
    fetchStats();
  }, [fetchData, fetchStats]);

  useEffect(() => {
    if (maquinaria.length > 0 && !form.maquinaId) {
      setForm((f) => ({ ...f, maquinaId: maquinaria[0].id }));
    }
  }, [maquinaria, form.maquinaId]);

  const handleSearch = useCallback(() => {
    fetchData(1, search, tipoFiltro);
  }, [fetchData, search, tipoFiltro]);

  const handleTipoFiltro = useCallback((value: '' | 'Correctivo' | 'Preventivo') => {
    setTipoFiltro(value);
    fetchData(1, search, value);
  }, [fetchData, search]);

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, search, tipoFiltro);
  }, [fetchData, search, tipoFiltro]);

  // ── Validación + payload ──
  const validateForm = useCallback(() => {
    if (!form.maquinaId || !form.descripcion.trim()) {
      showToast('Máquina y descripción son obligatorias.', 'error');
      return false;
    }
    const horas = parseFloat(form.horasServicio);
    const proximo = parseFloat(form.proximoServicioHoras);
    if (isNaN(horas) || horas < 0) {
      showToast('Las horas de servicio deben ser un número válido.', 'error');
      return false;
    }
    if (isNaN(proximo) || proximo <= horas) {
      showToast('El próximo servicio debe ser mayor a las horas de servicio.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  const buildPayload = useCallback((): MantenimientoCreateInput => ({
    maquinaId: form.maquinaId,
    tipo: form.tipo,
    descripcion: form.descripcion.trim(),
    fecha: form.fecha,
    horasServicio: parseFloat(form.horasServicio) || 0,
    costo: parseFloat(form.costo) || 0,
    proximoServicioHoras: parseFloat(form.proximoServicioHoras) || 0,
  }), [form]);

  const openCreate = useCallback(() => {
    setForm({ ...emptyForm, maquinaId: maquinaria[0]?.id ?? '' });
    setCreateOpen(true);
  }, [maquinaria]);

  const openEdit = useCallback((item: MantenimientoDTO) => {
    setSelectedItem(item);
    setForm({
      maquinaId: item.maquinaId,
      tipo: item.tipo,
      descripcion: item.descripcion,
      fecha: item.fecha,
      horasServicio: String(item.horasServicio),
      costo: String(item.costo),
      proximoServicioHoras: String(item.proximoServicioHoras),
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: MantenimientoDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    const res = await mantenimientoApi.crear(buildPayload());
    setSubmitting(false);
    if (res.success) {
      showToast('Servicio de mantenimiento registrado.', 'success');
      setCreateOpen(false);
      fetchData(pagination.page, search, tipoFiltro);
      fetchStats();
    } else {
      showToast(res.error.message, 'error');
    }
  }, [validateForm, buildPayload, showToast, fetchData, fetchStats, pagination.page, search, tipoFiltro]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    const res = await mantenimientoApi.actualizar(selectedItem.id, buildPayload());
    setSubmitting(false);
    if (res.success) {
      showToast('Registro actualizado.', 'success');
      setEditOpen(false);
      setSelectedItem(null);
      fetchData(pagination.page, search, tipoFiltro);
      fetchStats();
    } else {
      showToast(res.error.message, 'error');
    }
  }, [selectedItem, validateForm, buildPayload, showToast, fetchData, fetchStats, pagination.page, search, tipoFiltro]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    const res = await mantenimientoApi.eliminar(selectedItem.id);
    setSubmitting(false);
    if (res.success) {
      showToast('Registro eliminado.', 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
      fetchData(pagination.page, search, tipoFiltro);
      fetchStats();
    } else {
      showToast(res.error.message, 'error');
    }
  }, [selectedItem, showToast, fetchData, fetchStats, pagination.page, search, tipoFiltro]);

  const columns: Column<MantenimientoDTO>[] = [
    {
      key: 'maquinaId',
      header: 'Máquina',
      render: (item) => {
        const maquina = maquinaria.find((m) => m.id === item.maquinaId);
        return (
          <div>
            <div className="font-black text-slate-900">{item.maquinaId}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">{maquina?.nombre}</div>
          </div>
        );
      },
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (item) => (
        <Badge variant={item.tipo === 'Preventivo' ? 'info' : 'warning'} size="sm" dot>{item.tipo}</Badge>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (item) => <span className="text-sm font-semibold text-slate-600 max-w-[220px] truncate block">{item.descripcion}</span>,
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (item) => <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{formatDate(item.fecha)}</span>,
    },
    {
      key: 'horasServicio',
      header: 'Horas Servicio',
      align: 'right',
      render: (item) => <span className="font-bold text-slate-700">{item.horasServicio} hrs</span>,
    },
    {
      key: 'proximoServicioHoras',
      header: 'Próximo Servicio',
      align: 'right',
      render: (item) => {
        const maquina = maquinaria.find((m) => m.id === item.maquinaId);
        const esProximo = maquina ? maquina.horometro >= item.proximoServicioHoras - 50 : false;
        return (
          <Badge variant={esProximo ? 'warning' : 'neutral'} size="sm">{item.proximoServicioHoras} hrs</Badge>
        );
      },
    },
    {
      key: 'costo',
      header: 'Costo',
      align: 'right',
      render: (item) => <span className="font-black text-slate-900">{formatCurrency(item.costo)}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {puedeEditar && (
            <Button variant="warning" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
              Editar
            </Button>
          )}
          {puedeEliminar && (
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); openDelete(item); }}>
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (errorCarga && !hasLoaded.current) {
    return (
      <div className="card p-8 text-center space-y-3 border border-red-200 bg-red-50">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-red-700">{errorCarga}</p>
        <button onClick={() => fetchData(1)} className="btn-primary text-xs">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mantenimiento de Flota"
        subtitle="Programación de servicios preventivos y registro de reparaciones correctivas."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Programar Servicio
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={<AlertCircle size={22} />} value={stats.serviciosProximos} label="Servicios Próximos" color={stats.serviciosProximos > 0 ? 'warning' : 'success'} />
        <StatsCard icon={<Timer size={22} />} value={`${stats.promedioHorasServicio} hrs`} label="Prom. Horas/Servicio" color="info" />
        <StatsCard icon={<CheckCircle size={22} />} value={`${stats.equiposEnOptimoEstado} / ${stats.totalMaquinas}`} label="Equipos en Óptimo Estado" color="success" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} placeholder="Buscar por máquina o descripción..." className="flex-1" />
        <select
          value={tipoFiltro}
          onChange={(e) => handleTipoFiltro(e.target.value as '' | 'Correctivo' | 'Preventivo')}
          className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-primary/50"
        >
          <option value="">Todos los tipos</option>
          <option value="Preventivo">Preventivo</option>
          <option value="Correctivo">Correctivo</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="relative">
          {refreshing && !initialLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={registros}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="Sin registros de mantenimiento."
            maxBodyHeight="520px"
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

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Programar Servicio de Mantenimiento"
        submitLabel="Guardar Servicio"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <MantenimientoForm form={form} setForm={setForm} maquinaria={maquinaria} />
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Servicio de Mantenimiento"
        submitLabel="Guardar Cambios"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <MantenimientoForm form={form} setForm={setForm} maquinaria={maquinaria} />
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Registro"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">¿Estás seguro de eliminar este registro?</p>
            <p className="font-black text-slate-900 text-lg mb-2">{selectedItem.maquinaId} · {selectedItem.descripcion}</p>
          </div>
        )}
      </FormModal>
    </div>
  );
}

interface MantenimientoFormProps {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  maquinaria: Maquina[];
}

function MantenimientoForm({ form, setForm, maquinaria }: MantenimientoFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ModalField label="Máquina" required className="sm:col-span-2">
        <select className={modalSelectClass} value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}>
          {maquinaria.map((m) => (
            <option key={m.id} value={m.id}>{m.id} — {m.nombre} ({m.horometro.toLocaleString()} hrs)</option>
          ))}
        </select>
      </ModalField>

      <ModalField label="Tipo de Servicio" required>
        <select className={modalSelectClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as MantenimientoCreateInput['tipo'] })}>
          <option value="Preventivo">Preventivo</option>
          <option value="Correctivo">Correctivo</option>
        </select>
      </ModalField>

      <ModalField label="Fecha" required>
        <input type="date" className={modalInputClass} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
      </ModalField>

      <ModalField label="Descripción" required className="sm:col-span-2">
        <input className={modalInputClass} placeholder="Ej: Cambio de aceite y filtros de motor" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </ModalField>

      <ModalField label="Horas de Servicio (horómetro actual)" required>
        <input type="number" step="0.1" className={modalInputClass} placeholder="1200" value={form.horasServicio} onChange={(e) => setForm({ ...form, horasServicio: e.target.value })} />
      </ModalField>

      <ModalField label="Próximo Servicio (hrs)" required hint="Debe ser mayor a las horas de servicio.">
        <input type="number" step="0.1" className={modalInputClass} placeholder="1450" value={form.proximoServicioHoras} onChange={(e) => setForm({ ...form, proximoServicioHoras: e.target.value })} />
      </ModalField>

      <ModalField label="Costo (MXN)" className="sm:col-span-2">
        <input type="number" className={modalInputClass} placeholder="5500" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} />
      </ModalField>
    </div>
  );
}
