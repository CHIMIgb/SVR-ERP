"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, UserCog, Users, CheckCircle2, KeyRound, UserX,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle, Power, PowerOff,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar, type FilterField, type ActiveFilter } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  usuariosApi,
  type UsuarioDTO,
  type UsuariosCatalogos,
} from '@/lib/api';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { mensajeErrorApi } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

// ── Constantes ──
const PAGE_SIZE = 10;

const TORRES: { value: string; label: string }[] = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'RESIDENTE', label: 'Residente' },
  { value: 'MECANICO', label: 'Mecánico' },
  { value: 'SOLDADOR', label: 'Soldador' },
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
];

const TORRE_LABELS: Record<string, string> = Object.fromEntries(
  TORRES.map((t) => [t.value, t.label]),
);

const PIN_LABELS: Record<UsuarioDTO['pinEstado'], string> = {
  NORMAL: 'PIN normal',
  TEMPORAL: 'PIN temporal vigente',
  BLOQUEADO: 'PIN bloqueado',
};

// ── Form defaults ──
// Crear y editar comparten la MISMA captura (decisión del cliente).
const emptyForm = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  email: '',
  password: '',
  rolId: '',
  torre: '',
};

export default function UsuariosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Estado de datos ──
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, conIdentidad: 0, bloqueados: 0 });
  const [catalogos, setCatalogos] = useState<UsuariosCatalogos>({ roles: [], personas: [] });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  // ── Estado de búsqueda y filtros ──
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UsuarioDTO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/usuarios');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Cargar catálogos (una sola vez) ──
  useEffect(() => {
    usuariosApi.catalogos().then((res) => {
      if (res.success && res.data) {
        setCatalogos(res.data);
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
      const res = await usuariosApi.listar({
        search: searchVal || undefined,
        rolId: filters?.rolId || undefined,
        estado: filters?.estado as 'activo' | 'inactivo' | undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setUsuarios(res.data.items);
        setPagination(res.data.pagination);
      } else {
        showToast('Error al cargar usuarios.', 'error');
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
    const res = await usuariosApi.stats();
    if (res.success && res.data) {
      setStats(res.data);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
    fetchStats();
  }, [fetchData, fetchStats]);

  // ── Filtros activos (chips) ──
  const activeFilters: ActiveFilter[] = [];
  if (filterValues.rolId) {
    const rol = catalogos.roles.find(r => r.id === filterValues.rolId);
    activeFilters.push({ key: 'rolId', label: 'Rol', value: rol?.nombre ?? filterValues.rolId });
  }
  if (filterValues.estado) {
    activeFilters.push({
      key: 'estado',
      label: 'Estado',
      value: filterValues.estado === 'activo' ? 'Activos' : 'Inactivos',
    });
  }

  // ── Filtros para SearchBar ──
  const filterFields: FilterField[] = [
    {
      key: 'rolId',
      label: 'Rol',
      type: 'select',
      options: catalogos.roles.map(r => ({ value: r.id, label: r.nombre })),
      placeholder: 'Todos',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'activo', label: 'Activos' },
        { value: 'inactivo', label: 'Inactivos' },
      ],
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

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
    fetchData(1, search, {});
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

  // ── Handlers de modales ──
  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  // Editar: MISMA captura que crear (persona + correo + rol + área).
  const openEdit = useCallback((item: UsuarioDTO) => {
    setSelectedItem(item);
    setForm({
      nombre: item.personaNombre ?? '',
      apellidoPaterno: item.apellidoPaterno ?? '',
      apellidoMaterno: item.apellidoMaterno ?? '',
      telefono: item.telefono ?? '',
      email: item.email,
      password: '',
      rolId: item.roles[0]?.id ?? '',
      torre: item.torre ?? '',
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: UsuarioDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const openEstado = useCallback((item: UsuarioDTO) => {
    setSelectedItem(item);
    setEstadoOpen(true);
  }, []);

  // ── CRUD Handlers ──
  const handleCreate = useCallback(async () => {
    if (!form.nombre.trim()) {
      showToast('El nombre de la persona es obligatorio.', 'error');
      return;
    }
    if (!form.email || !form.password || !form.rolId) {
      showToast('El correo, la contraseña, el rol y el área son obligatorios.', 'error');
      return;
    }
    if (!form.torre) {
      showToast('Elige el área del usuario.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await usuariosApi.crear({
        nombre: form.nombre,
        apellidoPaterno: form.apellidoPaterno || undefined,
        apellidoMaterno: form.apellidoMaterno || undefined,
        telefono: form.telefono || undefined,
        email: form.email,
        password: form.password,
        rolId: form.rolId,
        torre: form.torre,
      });
      if (res.success) {
        showToast(`Usuario "${form.email}" creado.`, 'success');
        setCreateOpen(false);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al crear el usuario.'), 'error');
      }
    } catch {
      showToast('Error de conexión al crear el usuario.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    if (!form.nombre.trim()) {
      showToast('El nombre de la persona es obligatorio.', 'error');
      return;
    }
    if (!form.email || !form.rolId) {
      showToast('El correo, el rol y el área son obligatorios.', 'error');
      return;
    }
    if (!form.torre) {
      showToast('Elige el área del usuario.', 'error');
      return;
    }
    if (form.password && form.password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await usuariosApi.actualizar(selectedItem.id, {
        nombre: form.nombre,
        apellidoPaterno: form.apellidoPaterno || undefined,
        apellidoMaterno: form.apellidoMaterno || undefined,
        telefono: form.telefono || undefined,
        email: form.email,
        password: form.password || undefined,
        rolId: form.rolId,
        torre: form.torre,
      });
      if (res.success) {
        showToast('Usuario actualizado.', 'success');
        setEditOpen(false);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar el usuario.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el usuario.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, form, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await usuariosApi.eliminar(selectedItem.id);
      if (res.success) {
        showToast('Usuario eliminado.', 'success');
        setDeleteOpen(false);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al eliminar el usuario.'), 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar el usuario.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEstado = useCallback(async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await usuariosApi.cambiarEstado(selectedItem.id, !selectedItem.activo);
      if (res.success) {
        showToast(res.data?.message ?? 'Estado actualizado.', 'success');
        setEstadoOpen(false);
        fetchData(pagination.page, search, filterValues);
        fetchStats();
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo cambiar el estado.'), 'error');
      }
    } catch {
      showToast('Error de conexión al cambiar el estado.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  // ── Columnas de DataTable ──
  const columns: Column<UsuarioDTO>[] = [
    {
      key: 'usuario',
      header: 'Usuario',
      render: (item) => (
        <div>
          <div className="font-black text-ui-900">{item.nombre ?? '—'}</div>
          <div className="text-[10px] font-bold text-ui-400 uppercase tracking-widest">{item.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Rol',
      render: (item) => (
        <span className="font-semibold text-ui-600">
          {item.roles.map((r) => r.nombre).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'area',
      header: 'Área',
      render: (item) => (
        <span className="text-xs font-semibold text-ui-600">
          {item.torre ? (TORRE_LABELS[item.torre] ?? item.torre) : '—'}
        </span>
      ),
    },
    {
      key: 'identidad',
      header: 'Identidad PWA',
      render: (item) => (
        <div>
          <div className="text-xs font-bold text-ui-700">{item.numeroEmpleado ?? '—'}</div>
          {item.numeroEmpleado && (
            <div className="text-[10px] font-bold text-ui-400">{PIN_LABELS[item.pinEstado]}</div>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      // Sin badge de color (decisión del cliente): texto neutro.
      render: (item) => (
        <span className="text-xs font-semibold text-ui-600">{item.activo ? 'Activo' : 'Inactivo'}</span>
      ),
    },
    {
      key: 'creadoEn',
      header: 'Creado',
      render: (item) => (
        <span className="text-xs font-semibold text-ui-600">{formatDate(item.creadoEn)}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {puedeEditar && (
            <>
              <Button
                variant="warning"
                size="sm"
                icon={<Pencil className="w-3.5 h-3.5" />}
                onClick={(e) => { e.stopPropagation(); openEdit(item); }}
              >
                Editar
              </Button>
              <Button
                variant={item.activo ? 'secondary' : 'success'}
                size="sm"
                icon={item.activo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                onClick={(e) => { e.stopPropagation(); openEstado(item); }}
              >
                {item.activo ? 'Desactivar' : 'Activar'}
              </Button>
            </>
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
        title="Usuarios"
        subtitle="Cuentas de acceso a la app de escritorio (correo + contraseña)."
        action={
          puedeCrear ? (
            <Button
          skeleton={initialLoading} variant="primary" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
              Nuevo Usuario
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          icon={<Users className="w-6 h-6" />}
          value={`${stats.total} usuarios`}
          label="Total Usuarios"
          color="info"
          loading={initialLoading}
        />
        <StatsCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          value={`${stats.activos} activos`}
          label="Cuentas Activas"
          color="neutral"
          loading={initialLoading}
        />
        <StatsCard
          icon={<UserCog className="w-6 h-6" />}
          value={`${stats.conIdentidad} con número`}
          label="Con Identidad PWA"
          color="neutral"
          loading={initialLoading}
        />
        <StatsCard
          icon={<KeyRound className="w-6 h-6" />}
          value={`${stats.bloqueados} bloqueadas`}
          label="PIN Bloqueado"
          color="neutral"
          loading={initialLoading}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por nombre, correo o número de empleado..."
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
            <span className="ml-1 inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-surface/20 text-[10px] font-bold">
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
              className="text-xs font-semibold text-ui-500 hover:text-red-600 transition-colors ml-1"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {showFilters && (
        <div className="bg-ui-50 border border-ui-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            {filterFields.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">
                  {filter.label}
                </label>
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
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
          <RefreshOverlay show={refreshing && !initialLoading} />
          <DataTable
            columns={columns}
            data={usuarios}
            loading={initialLoading}
            keyExtractor={(item) => item.id}
            emptyText="No se encontraron usuarios que coincidan con la búsqueda."
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
        title="Nuevo Usuario"
        subtitle="Cuenta de acceso a la app de escritorio."
        submitLabel="Crear Usuario"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <CapturaUsuario form={form} setForm={setForm} roles={catalogos.roles} />
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Usuario"
        subtitle={selectedItem?.email}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <CapturaUsuario
          form={form}
          setForm={setForm}
          roles={catalogos.roles}
          esEdicion
        />
        {selectedItem && selectedItem.pinEstado !== 'NORMAL' && (
          <p className="mt-3 text-[10px] font-medium text-amber-600">
            {PIN_LABELS[selectedItem.pinEstado]} — el reinicio del PIN se hace en Gestión de Identidad.
          </p>
        )}
      </FormModal>

      {/* Estado: activar / desactivar con confirmación */}
      <FormModal
        open={estadoOpen}
        onClose={() => setEstadoOpen(false)}
        onCancel={() => setEstadoOpen(false)}
        title={selectedItem?.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
        subtitle="Esta acción se registra en el historial de auditoría."
        submitLabel={selectedItem?.activo ? 'Sí, Desactivar' : 'Activar'}
        cancelLabel="Cancelar"
        onSubmit={handleEstado}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${selectedItem.activo ? 'bg-amber-100 dark:bg-amber-500/15' : 'bg-green-100 dark:bg-green-500/15'}`}>
              {selectedItem.activo ? (
                <PowerOff className="w-7 h-7 text-amber-500" />
              ) : (
                <Power className="w-7 h-7 text-green-500" />
              )}
            </div>
            <p className="text-sm text-ui-700 mb-1">
              {selectedItem.activo ? '¿Desactivar la cuenta de?' : '¿Activar la cuenta de?'}
            </p>
            <p className="font-black text-ui-900 text-lg mb-2">{selectedItem.nombre ?? selectedItem.email}</p>
            {selectedItem.activo ? (
              <p className="text-xs text-ui-500">
                Sus sesiones activas se cerrarán y no podrá iniciar sesión hasta reactivarla.
              </p>
            ) : (
              <p className="text-xs text-ui-500">
                Volverá a poder iniciar sesión con su correo y contraseña.
              </p>
            )}
          </div>
        )}
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Usuario"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selectedItem && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mb-4">
              <UserX className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Estás seguro de eliminar el usuario?</p>
            <p className="font-black text-ui-900 text-lg mb-2">{selectedItem.nombre ?? selectedItem.email}</p>
            <p className="text-xs text-ui-500">{selectedItem.email}</p>
            <p className="text-xs text-ui-500 mt-2 flex items-center gap-1 justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
              Sus sesiones activas se cerrarán automáticamente.
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}

/**
 * Captura compartida de crear/editar (decisión del cliente: MISMA captura).
 * En edición la contraseña es opcional (vacía = conservar la actual) y el
 * rol se cambia con el mismo select (mono-rol, PATCH /usuarios/:id/rol).
 */
function CapturaUsuario({
  form,
  setForm,
  roles,
  esEdicion = false,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  roles: UsuariosCatalogos['roles'];
  esEdicion?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ModalField label="Nombre" required>
        <input
          type="text"
          className={modalInputClass}
          placeholder="Nombre(s)"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
      </ModalField>

      <ModalField label="Apellido Paterno">
        <input
          type="text"
          className={modalInputClass}
          placeholder="Apellido paterno"
          value={form.apellidoPaterno}
          onChange={(e) => setForm({ ...form, apellidoPaterno: e.target.value })}
        />
      </ModalField>

      <ModalField label="Apellido Materno">
        <input
          type="text"
          className={modalInputClass}
          placeholder="Apellido materno"
          value={form.apellidoMaterno}
          onChange={(e) => setForm({ ...form, apellidoMaterno: e.target.value })}
        />
      </ModalField>

      <ModalField label="Número de Teléfono">
        <input
          type="tel"
          className={modalInputClass}
          placeholder="Ej: 322-123-4567"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
      </ModalField>

      <ModalField label="Correo Electrónico" required>
        <input
          type="email"
          className={modalInputClass}
          placeholder="usuario@svr-constructora.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </ModalField>

      <ModalField label={esEdicion ? 'Contraseña (opcional)' : 'Contraseña'} required={!esEdicion}>
        <input
          type="password"
          className={modalInputClass}
          placeholder={esEdicion ? 'Déjala vacía para conservar la actual' : 'Mínimo 8 caracteres'}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </ModalField>

      <ModalField label="Rol Principal" required>
        <select
          className={modalSelectClass}
          value={form.rolId}
          onChange={(e) => setForm({ ...form, rolId: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
      </ModalField>

      <ModalField label="Área" required>
        <select
          className={modalSelectClass}
          value={form.torre}
          onChange={(e) => setForm({ ...form, torre: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {TORRES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </ModalField>
    </div>
  );
}
