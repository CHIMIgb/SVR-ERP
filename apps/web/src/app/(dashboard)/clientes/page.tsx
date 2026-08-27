"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Building2, Mail, Phone, History, FilePlus2, Pencil,
  Trash2, SlidersHorizontal, AlertCircle, Users, FolderKanban, Eye,
  FileText, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, Modal, ModalHeader, ModalBody, ModalFooter, ModalField, modalInputClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  clientesApi,
  type ClienteDTO,
  type ClientesStats,
} from '@/lib/api';

// ── Constantes ──
const PAGE_SIZE = 8;

// ── Form defaults ──
const emptyForm = {
  nombre: '',
  empresa: '',
  correo: '',
  telefono: '',
  rfc: '',
};

export default function ClientesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado de datos ──
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [stats, setStats] = useState<ClientesStats>({
    totalClientes: 0,
    clientesActivos: 0,
    empresas: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda ──
  const [search, setSearch] = useState('');

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<ClienteDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/clientes');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Cargar datos ──
  const fetchData = useCallback(async (page = 1, searchVal?: string) => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await clientesApi.listar({
        search: searchVal || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setClientes(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar clientes.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      hasLoaded.current = true;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    const res = await clientesApi.stats();
    if (res.success && res.data) {
      setStats(res.data);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
    fetchStats();
  }, [fetchData, fetchStats]);

  // ── Handlers de búsqueda / paginación ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSearch = useCallback(() => {
    fetchData(1, search);
  }, [fetchData, search]);

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, search);
  }, [fetchData, search]);

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: ClienteDTO) => {
    setSelected(item);
    setForm({
      nombre: item.nombre,
      empresa: item.empresa,
      correo: item.correo,
      telefono: item.telefono,
      rfc: item.rfc ?? '',
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: ClienteDTO) => {
    setSelected(item);
    setDeleteOpen(true);
  }, []);

  const openView = useCallback((item: ClienteDTO) => {
    setSelected(item);
    setViewOpen(true);
  }, []);

  // ── CRUD handlers (API) ──
  const validateForm = () => {
    if (!form.nombre || !form.empresa || !form.correo) {
      showToast('Nombre, empresa y correo son obligatorios.', 'error');
      return false;
    }
    return true;
  };

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await clientesApi.crear({
        nombre: form.nombre,
        empresa: form.empresa,
        correo: form.correo,
        telefono: form.telefono || '—',
        rfc: form.rfc || undefined,
      });
      if (res.success) {
        showToast(`Cliente "${form.empresa}" creado exitosamente.`, 'success');
        setCreateOpen(false);
        fetchData(pagination.page, search);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al crear cliente.', 'error');
      }
    } catch {
      showToast('Error de conexión al crear cliente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, showToast, fetchData, pagination.page, search, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selected) return;
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await clientesApi.actualizar(selected.id, {
        nombre: form.nombre,
        empresa: form.empresa,
        correo: form.correo,
        telefono: form.telefono,
        rfc: form.rfc || undefined,
      });
      if (res.success) {
        showToast(`Cliente "${form.empresa}" actualizado exitosamente.`, 'success');
        setEditOpen(false);
        setSelected(null);
        fetchData(pagination.page, search);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al actualizar cliente.', 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar cliente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selected, form, showToast, fetchData, pagination.page, search, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await clientesApi.eliminar(selected.id);
      if (res.success) {
        showToast(`Cliente "${selected.empresa}" eliminado exitosamente.`, 'success');
        setDeleteOpen(false);
        setSelected(null);
        fetchData(pagination.page, search);
        fetchStats();
      } else {
        showToast(res.error?.message || 'Error al eliminar cliente.', 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar cliente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selected, showToast, fetchData, pagination.page, search, fetchStats]);

  // ── Handlers de acciones por fila (pendientes de su módulo backend) ──
  const handleHistorial = (item: ClienteDTO) => {
    showToast(`Historial de ${item.empresa} — disponibles próximamente.`, 'info');
  };

  const handleNuevaCotizacion = (item: ClienteDTO) => {
    showToast(`Nueva cotización para ${item.empresa} — próximamente.`, 'info');
  };

  // ── Columnas de DataTable ──
  const columns: Column<ClienteDTO>[] = [
    {
      key: 'empresa',
      header: 'Cliente',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">
            {item.empresa[0]}
          </div>
          <div className="min-w-0">
            <div className="font-black text-slate-900 truncate">{item.empresa}</div>
            <div className="text-xs font-bold text-primary truncate">{item.nombre}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (item) => (
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-sm font-medium truncate">{item.correo}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-sm font-medium truncate">{item.telefono}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'rfc',
      header: 'RFC',
      render: (item) => (
        <span className="text-sm font-semibold text-slate-600">{item.rfc || '—'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => (
        item.activo ? (
          <Badge variant="success" size="sm">Activo</Badge>
        ) : (
          <Badge variant="neutral" size="sm">Inactivo</Badge>
        )
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); openView(item); }}
          >
            Ver
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<History className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); handleHistorial(item); }}
          >
            Historial
          </Button>
          <Button
            variant="info"
            size="sm"
            icon={<FilePlus2 className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); handleNuevaCotizacion(item); }}
          >
            Nueva Cotización
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
        title="Directorio de Clientes"
        subtitle="Gestión de contactos comerciales y empresas contratantes."
        action={
          puedeCrear ? (
            <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Nuevo Cliente
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<Users className="w-6 h-6" />}
          value={`${stats.totalClientes} clientes`}
          label="Total Clientes"
          color="info"
        />
        <StatsCard
          icon={<FolderKanban className="w-6 h-6" />}
          value={`${stats.clientesActivos} activos`}
          label="Clientes Activos"
          color="primary"
        />
        <StatsCard
          icon={<Building2 className="w-6 h-6" />}
          value={`${stats.empresas} empresas`}
          label="Empresas"
          color="neutral"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por cliente, empresa, correo o teléfono..."
          className="flex-1"
        />
        <Button
          variant="secondary"
          size="md"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => showToast('Filtros avanzados próximamente.', 'info')}
          className="shrink-0 whitespace-nowrap"
        >
          Filtros
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          {refreshing && !initialLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-opacity">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={clientes}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron clientes que coincidan con la búsqueda."
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
          MODALES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nuevo Cliente"
        subtitle="Registrar un contacto comercial en el directorio."
        submitLabel="Crear Cliente"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre del contacto" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Ing. Alberto Ruiz"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Empresa" required>
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: Inmobiliaria ARCO"
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            />
          </ModalField>

          <ModalField label="Teléfono">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: 555-9988"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </ModalField>

          <ModalField label="Correo" required className="sm:col-span-2">
            <input
              type="email"
              className={modalInputClass}
              placeholder="Ej: aruiz@arco.com"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
          </ModalField>

          <ModalField label="RFC">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Ej: AUR780101XXX"
              value={form.rfc}
              onChange={(e) => setForm({ ...form, rfc: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
      >
        <ModalHeader
          title="Detalle del Cliente"
          subtitle={selected ? selected.empresa : undefined}
          onClose={() => setViewOpen(false)}
        />
        <ModalBody>
        {selected && (
          <div className="space-y-5">
            {/* Datos generales */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                {selected.empresa[0]}
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-tight">{selected.empresa}</p>
                <p className="text-xs font-bold text-primary">{selected.nombre}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{selected.correo}</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{selected.telefono}</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RFC</p>
                  <p className="text-sm font-semibold text-slate-700">{selected.rfc || '—'}</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <FolderKanban className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                  <div className="mt-0.5">
                    <Badge variant={selected.activo ? 'success' : 'neutral'} size="sm">
                      {selected.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Cotizaciones */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="font-black text-slate-900 text-sm">Cotizaciones</h4>
                <Badge variant="info" size="sm">0</Badge>
              </div>

              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">
                  {selected.empresa} aún no tiene cotizaciones registradas.
                </p>
              </div>
            </div>
          </div>
        )}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setViewOpen(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Cliente"
        subtitle={selected ? `Editando: ${selected.empresa}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Nombre del contacto" required className="sm:col-span-2">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Nombre del contacto"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </ModalField>

          <ModalField label="Empresa" required>
            <input
              type="text"
              className={modalInputClass}
              placeholder="Nombre de la empresa"
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            />
          </ModalField>

          <ModalField label="Teléfono">
            <input
              type="text"
              className={modalInputClass}
              placeholder="Teléfono de contacto"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </ModalField>

          <ModalField label="Correo" required className="sm:col-span-2">
            <input
              type="email"
              className={modalInputClass}
              placeholder="Correo de contacto"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
          </ModalField>

          <ModalField label="RFC">
            <input
              type="text"
              className={modalInputClass}
              placeholder="RFC del cliente"
              value={form.rfc}
              onChange={(e) => setForm({ ...form, rfc: e.target.value })}
            />
          </ModalField>
        </div>
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Cliente"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selected && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-slate-700 mb-1">
              ¿Estás seguro de eliminar el cliente?
            </p>
            <p className="font-black text-slate-900 text-lg mb-2">
              {selected.empresa}
            </p>
            <p className="text-xs text-slate-500">
              {selected.nombre} — {selected.correo}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
