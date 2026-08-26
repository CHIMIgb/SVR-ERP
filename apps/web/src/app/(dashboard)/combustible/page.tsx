"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Fuel, DollarSign, Activity, ShieldAlert, ShieldCheck, Pencil, Trash2, AlertCircle } from 'lucide-react';
import type { Maquina } from '@svr-erp/shared';
import { apiClient } from '@/lib/api';
import { combustibleApi, type CargaCombustibleDTO, type CombustibleStats, type CombustibleCreateInput } from '@/lib/api';
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
import { useNotifications } from '@/components/layout/NotificationContext';
import { formatCurrency, formatDate } from '@/lib/formatters';

const PAGE_SIZE = 10;

const STATS_CERO: CombustibleStats = {
  totalLitros: 0,
  totalCosto: 0,
  rendimientoPromedio: 0,
  totalAlertasOrdena: 0,
};

const emptyForm = {
  maquinaId: '',
  litros: '120',
  // Costo se deja en blanco a propósito: si no se captura, el servidor lo
  // calcula (litros * precio de referencia) — no duplicamos ese precio aquí.
  costo: '',
  lugar: 'Autoconsumo en Obra',
  operador: '',
  horasTrabajadas: '8.0',
};

export default function CombustiblePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const vista = user?.vistas?.find((v) => v.ruta === '/combustible');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  const [cargas, setCargas] = useState<CargaCombustibleDTO[]>([]);
  const [maquinaria, setMaquinaria] = useState<Maquina[]>([]);
  const [stats, setStats] = useState<CombustibleStats>(STATS_CERO);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CargaCombustibleDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (page = 1, searchVal?: string, alertas?: boolean) => {
    if (!hasLoaded.current) setInitialLoading(true);
    else setRefreshing(true);

    const res = await combustibleApi.listar({ search: searchVal || undefined, soloAlertas: alertas, page, limit: PAGE_SIZE });
    if (res.success) {
      setCargas(res.data.items);
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
    const res = await combustibleApi.stats();
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

  const handleSearch = useCallback(() => fetchData(1, search, soloAlertas), [fetchData, search, soloAlertas]);

  const toggleSoloAlertas = useCallback(() => {
    const next = !soloAlertas;
    setSoloAlertas(next);
    fetchData(1, search, next);
  }, [fetchData, search, soloAlertas]);

  const handlePageChange = useCallback((page: number) => fetchData(page, search, soloAlertas), [fetchData, search, soloAlertas]);

  // Previsualización en cliente — únicamente para orientar al usuario mientras
  // llena el formulario. El servidor recalcula todo (rendimiento, desviación,
  // alerta de ordeña) y es la única fuente de verdad de lo que se guarda.
  const maquinaSeleccionada = maquinaria.find((m) => m.id === form.maquinaId);
  const esperadoPreview = maquinaSeleccionada?.consumoEsperadoLtsHora ?? 14.0;
  const rendimientoPreview = (parseFloat(form.horasTrabajadas) || 0) > 0
    ? (parseFloat(form.litros) || 0) / (parseFloat(form.horasTrabajadas) || 1)
    : esperadoPreview;

  const buildPayload = useCallback((): CombustibleCreateInput => ({
    maquinaId: form.maquinaId,
    litros: parseFloat(form.litros) || 0,
    costo: form.costo ? parseFloat(form.costo) : undefined,
    lugar: form.lugar || 'Autoconsumo Obra',
    operador: form.operador || undefined,
    horasTrabajadasPeriodo: parseFloat(form.horasTrabajadas) || 0,
  }), [form]);

  const openCreate = useCallback(() => {
    setForm({ ...emptyForm, maquinaId: maquinaria[0]?.id ?? '' });
    setCreateOpen(true);
  }, [maquinaria]);

  const openEdit = useCallback((item: CargaCombustibleDTO) => {
    setSelectedItem(item);
    setForm({
      maquinaId: item.maquinaId,
      litros: String(item.litros),
      costo: String(item.costo),
      lugar: item.lugar,
      operador: item.operador,
      horasTrabajadas: String(item.horasTrabajadasPeriodo),
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: CargaCombustibleDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!form.maquinaId || !form.litros) {
      showToast('Máquina y litros son obligatorios.', 'error');
      return;
    }
    setSubmitting(true);
    const res = await combustibleApi.crear(buildPayload());
    setSubmitting(false);
    if (res.success) {
      const nueva = res.data;
      setCreateOpen(false);
      fetchData(pagination.page, search, soloAlertas);
      fetchStats();
      if (nueva.alertaOrdena) {
        showToast(`🚨 ALERTA: Rendimiento anormal de ${nueva.rendimientoLtsHora} L/hr (+${nueva.desviacionPorcentaje}%).`, 'error');
        addNotification({
          titulo: `🚨 Alerta de Ordeña/Sobreconsumo: ${nueva.maquinaId}`,
          mensaje: `Registró ${nueva.rendimientoLtsHora} L/hr (+${nueva.desviacionPorcentaje}% vs esperado de ${nueva.consumoEsperadoLtsHora} L/hr). Operador: ${nueva.operador}.`,
          tipo: 'alerta',
        });
      } else {
        showToast(`✅ Carga de ${nueva.litros}L registrada. Rendimiento óptimo (${nueva.rendimientoLtsHora} L/hr).`, 'success');
      }
    } else {
      showToast(res.error.message, 'error');
    }
  }, [form, buildPayload, showToast, addNotification, fetchData, fetchStats, pagination.page, search, soloAlertas]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    const res = await combustibleApi.actualizar(selectedItem.id, buildPayload());
    setSubmitting(false);
    if (res.success) {
      showToast('Carga actualizada.', 'success');
      setEditOpen(false);
      setSelectedItem(null);
      fetchData(pagination.page, search, soloAlertas);
      fetchStats();
    } else {
      showToast(res.error.message, 'error');
    }
  }, [selectedItem, buildPayload, showToast, fetchData, fetchStats, pagination.page, search, soloAlertas]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    const res = await combustibleApi.eliminar(selectedItem.id);
    setSubmitting(false);
    if (res.success) {
      showToast('Carga eliminada.', 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
      fetchData(pagination.page, search, soloAlertas);
      fetchStats();
    } else {
      showToast(res.error.message, 'error');
    }
  }, [selectedItem, showToast, fetchData, fetchStats, pagination.page, search, soloAlertas]);

  const columns: Column<CargaCombustibleDTO>[] = [
    {
      key: 'maquinaId',
      header: 'Máquina',
      render: (item) => {
        const maquina = maquinaria.find((m) => m.id === item.maquinaId);
        return (
          <div>
            <div className="font-black text-slate-900 text-sm">{item.maquinaId} — {maquina?.nombre}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Operador: {item.operador}</div>
          </div>
        );
      },
    },
    {
      key: 'fecha',
      header: 'Fecha y Lugar',
      render: (item) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{formatDate(item.fecha)}</div>
          <div className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">{item.lugar}</div>
        </div>
      ),
    },
    {
      key: 'litros',
      header: 'Litros y Costo',
      align: 'right',
      render: (item) => (
        <div>
          <div className="text-sm font-black text-slate-900">{item.litros} L</div>
          <div className="text-xs font-bold text-primary">{formatCurrency(item.costo)}</div>
        </div>
      ),
    },
    {
      key: 'horasTrabajadasPeriodo',
      header: 'Horas Periodo',
      align: 'center',
      render: (item) => <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{item.horasTrabajadasPeriodo} hrs</span>,
    },
    {
      key: 'rendimientoLtsHora',
      header: 'Rendimiento',
      render: (item) => (
        <div>
          <span className={`text-sm font-black ${item.alertaOrdena ? 'text-red-600' : 'text-slate-900'}`}>{item.rendimientoLtsHora} L/hr</span>
          <div className="text-[10px] text-slate-400 font-medium">Esperado: {item.consumoEsperadoLtsHora} L/hr</div>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => (
        item.alertaOrdena ? (
          <Badge variant="error" size="sm">🚨 Ordeña (+{item.desviacionPorcentaje}%)</Badge>
        ) : (
          <Badge variant="success" size="sm">Normal</Badge>
        )
      ),
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
        title="Control de Combustible y Rendimiento"
        subtitle="Telemetría de consumo en Litros/Hora, detección de fugas, ordeña y costos operativos."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Registrar Carga Diésel
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Fuel size={22} />} value={`${stats.totalLitros.toLocaleString()} L`} label="Litros Totales" color="primary" />
        <StatsCard icon={<DollarSign size={22} />} value={formatCurrency(stats.totalCosto)} label="Gasto Total Diésel" color="success" />
        <StatsCard icon={<Activity size={22} />} value={`${stats.rendimientoPromedio} L/hr`} label="Rendimiento Promedio" color="info" />
        <StatsCard
          icon={<ShieldAlert size={22} />}
          value={stats.totalAlertasOrdena}
          label="Alertas de Ordeña"
          color={stats.totalAlertasOrdena > 0 ? 'error' : 'neutral'}
          onClick={toggleSoloAlertas}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} placeholder="Buscar máquina, operador o lugar..." className="flex-1" />
        <Button
          variant={soloAlertas ? 'danger' : 'secondary'}
          size="md"
          icon={<ShieldAlert className="w-4 h-4" />}
          onClick={toggleSoloAlertas}
          className="shrink-0 whitespace-nowrap"
        >
          {soloAlertas ? 'Ver Todas' : 'Solo Alertas'}
        </Button>
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
            data={cargas}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="Sin cargas de combustible registradas."
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
        title="Registrar Carga de Diésel con Telemetría"
        submitLabel="Validar y Guardar Carga"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <CombustibleForm form={form} setForm={setForm} maquinaria={maquinaria} rendimientoPreview={rendimientoPreview} />
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Carga de Combustible"
        submitLabel="Guardar Cambios"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <CombustibleForm form={form} setForm={setForm} maquinaria={maquinaria} rendimientoPreview={rendimientoPreview} />
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Carga"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">¿Estás seguro de eliminar esta carga?</p>
            <p className="font-black text-slate-900 text-lg mb-2">{selectedItem.maquinaId} · {selectedItem.litros} L</p>
          </div>
        )}
      </FormModal>
    </div>
  );
}

interface CombustibleFormProps {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  maquinaria: Maquina[];
  rendimientoPreview: number;
}

function CombustibleForm({ form, setForm, maquinaria, rendimientoPreview }: CombustibleFormProps) {
  return (
    <div className="space-y-3">
      <ModalField label="Máquina Asignada" required>
        <select className={modalSelectClass} value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}>
          {maquinaria.map((m) => (
            <option key={m.id} value={m.id}>{m.id} — {m.nombre} (Consumo normal: {m.consumoEsperadoLtsHora ?? 14} L/hr)</option>
          ))}
        </select>
      </ModalField>

      <div className="grid grid-cols-2 gap-3">
        <ModalField label="Litros Cargados" required>
          <input
            type="number"
            className={modalInputClass}
            placeholder="120"
            value={form.litros}
            onChange={(e) => setForm({ ...form, litros: e.target.value })}
          />
        </ModalField>

        <ModalField label="Horas Operadas en Periodo">
          <input type="number" step="0.5" className={modalInputClass} placeholder="8.0" value={form.horasTrabajadas} onChange={(e) => setForm({ ...form, horasTrabajadas: e.target.value })} />
        </ModalField>
      </div>

      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
        <span className="font-bold text-slate-500">Rendimiento Estimado:</span>
        <span className="font-black text-slate-900 text-sm">{rendimientoPreview.toFixed(2)} L/hr</span>
      </div>

      <ModalField label="Costo Total Diésel (MXN)" hint="Déjalo en blanco para que se calcule automáticamente.">
        <input type="number" className={modalInputClass} placeholder="Se calcula automáticamente" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} />
      </ModalField>

      <ModalField label="Punto de Carga / Gasolinera">
        <input className={modalInputClass} placeholder="Autoconsumo en Obra Valle Sur" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
      </ModalField>

      <ModalField label="Operador que Recibió">
        <input className={modalInputClass} placeholder="Juan Pérez" value={form.operador} onChange={(e) => setForm({ ...form, operador: e.target.value })} />
      </ModalField>
    </div>
  );
}
