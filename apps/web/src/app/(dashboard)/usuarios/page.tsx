"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, UserCog, Users, CheckCircle2, KeyRound, UserX,
  Pencil, Trash2, SlidersHorizontal, X, AlertCircle,
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
  type UsuarioRoleDTO,
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
const emptyCreateForm = {
  personaId: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  email: '',
  password: '',
  rolId: '',
  torre: '',
};

const emptyEditForm = {
  email: '',
  activo: 'true',
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
  const [selectedItem, setSelectedItem] = useState<UsuarioDTO | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [rolesEdit, setRolesEdit] = useState<UsuarioRoleDTO[]>([]);
  const [nuevoRolId, setNuevoRolId] = useState('');
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
    setCreateForm(emptyCreateForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((item: UsuarioDTO) => {
    setSelectedItem(item);
    setEditForm({
      email: item.email,
      activo: String(item.activo),
      torre: item.torre ?? '',
    });
    setRolesEdit(item.roles);
    setNuevoRolId('');
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: UsuarioDTO) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  // ── CRUD Handlers ──
  const handleCreate = useCallback(async () => {
    const usaPersonaExistente = Boolean(createForm.personaId);
    if (!createForm.email || !createForm.password || !createForm.rolId) {
      showToast('El correo, la contraseña y el rol son obligatorios.', 'error');
      return;
    }
    if (!usaPersonaExistente && !createForm.nombre.trim()) {
      showToast('Selecciona una persona del catálogo o captura el nombre de la nueva.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await usuariosApi.crear({
        ...(usaPersonaExistente
          ? { personaId: createForm.personaId }
          : {
              nombre: createForm.nombre,
              apellidoPaterno: createForm.apellidoPaterno || undefined,
              apellidoMaterno: createForm.apellidoMaterno || undefined,
            }),
        email: createForm.email,
        password: createForm.password,
        rolId: createForm.rolId,
        ...(createForm.torre ? { torre: createForm.torre } : {}),
      });
      if (res.success) {
        showToast(`Usuario "${createForm.email}" creado.`, 'success');
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
  }, [createForm, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

  const handleEdit = useCallback(async () => {
    if (!selectedItem) return;
    if (!editForm.email) {
      showToast('El correo es obligatorio.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await usuariosApi.actualizar(selectedItem.id, {
        email: editForm.email,
        activo: editForm.activo === 'true',
        ...(editForm.torre ? { torre: editForm.torre } : { torre: undefined }),
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
  }, [selectedItem, editForm, showToast, fetchData, pagination.page, search, filterValues, fetchStats]);

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

  // ── Roles (se aplican al instante, el backend los audita) ──
  const handleAgregarRol = useCallback(async () => {
    if (!selectedItem || !nuevoRolId) return;
    try {
      const res = await usuariosApi.asignarRol(selectedItem.id, { rolId: nuevoRolId });
      if (res.success) {
        const rol = catalogos.roles.find(r => r.id === nuevoRolId);
        setRolesEdit((prev) => [
          ...prev,
          { id: nuevoRolId, nombre: rol?.nombre ?? 'Rol', esPrincipal: false },
        ]);
        setNuevoRolId('');
        showToast(res.data?.message ?? 'Rol asignado.', 'success');
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo asignar el rol.'), 'error');
      }
    } catch {
      showToast('Error de conexión al asignar el rol.', 'error');
    }
  }, [selectedItem, nuevoRolId, catalogos.roles, showToast]);

  const handleRevocarRol = useCallback(async (rolId: string) => {
    if (!selectedItem) return;
    try {
      const res = await usuariosApi.revocarRol(selectedItem.id, rolId);
      if (res.success) {
        setRolesEdit((prev) => prev.filter((r) => r.id !== rolId));
        showToast(res.data?.message ?? 'Rol revocado.', 'success');
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo revocar el rol.'), 'error');
      }
    } catch {
      showToast('Error de conexión al revocar el rol.', 'error');
    }
  }, [selectedItem, showToast]);

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
      header: 'Roles',
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Persona" required>
            <select
              className={modalSelectClass}
              value={createForm.personaId}
              onChange={(e) => setCreateForm({ ...createForm, personaId: e.target.value })}
            >
              <option value="">Nueva persona (captura abajo)...</option>
              {catalogos.personas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </ModalField>

          {createForm.personaId === '' ? (
            <>
              <ModalField label="Nombre" required>
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Nombre(s)"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                />
              </ModalField>
              <ModalField label="Apellido Paterno">
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Apellido paterno"
                  value={createForm.apellidoPaterno}
                  onChange={(e) => setCreateForm({ ...createForm, apellidoPaterno: e.target.value })}
                />
              </ModalField>
              <ModalField label="Apellido Materno">
                <input
                  type="text"
                  className={modalInputClass}
                  placeholder="Apellido materno"
                  value={createForm.apellidoMaterno}
                  onChange={(e) => setCreateForm({ ...createForm, apellidoMaterno: e.target.value })}
                />
              </ModalField>
            </>
          ) : null}

          <ModalField label="Correo Electrónico" required>
            <input
              type="email"
              className={modalInputClass}
              placeholder="usuario@svr-constructora.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </ModalField>

          <ModalField label="Contraseña" required>
            <input
              type="password"
              className={modalInputClass}
              placeholder="Mínimo 8 caracteres"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </ModalField>

          <ModalField label="Rol Principal" required>
            <select
              className={modalSelectClass}
              value={createForm.rolId}
              onChange={(e) => setCreateForm({ ...createForm, rolId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {catalogos.roles.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Área (opcional)">
            <select
              className={modalSelectClass}
              value={createForm.torre}
              onChange={(e) => setCreateForm({ ...createForm, torre: e.target.value })}
            >
              <option value="">La del rol</option>
              {TORRES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalField label="Correo Electrónico" required>
            <input
              type="email"
              className={modalInputClass}
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </ModalField>

          <ModalField label="Estado" required>
            <select
              className={modalSelectClass}
              value={editForm.activo}
              onChange={(e) => setEditForm({ ...editForm, activo: e.target.value })}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </ModalField>

          <ModalField label="Área">
            <select
              className={modalSelectClass}
              value={editForm.torre}
              onChange={(e) => setEditForm({ ...editForm, torre: e.target.value })}
            >
              <option value="">La del rol</option>
              {TORRES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </ModalField>
        </div>

        {puedeEditar && (
          <div className="mt-4 border border-ui-200 rounded-xl p-4">
            <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-2">
              Roles del usuario
            </p>
            {rolesEdit.length === 0 && (
              <p className="text-xs text-ui-500 mb-2">Sin roles activos.</p>
            )}
            {rolesEdit.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {rolesEdit.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ui-100 text-ui-700 text-xs font-semibold"
                  >
                    {r.nombre}
                    {r.esPrincipal && <span className="text-[10px] text-ui-500">(principal)</span>}
                    <button
                      onClick={() => handleRevocarRol(r.id)}
                      className="ml-0.5 hover:text-red-600 transition-colors"
                      aria-label={`Revocar rol ${r.nombre}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <select
                className={modalSelectClass}
                value={nuevoRolId}
                onChange={(e) => setNuevoRolId(e.target.value)}
              >
                <option value="">Agregar rol...</option>
                {catalogos.roles
                  .filter((r) => !rolesEdit.some((ur) => ur.id === r.id))
                  .map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                disabled={!nuevoRolId}
                onClick={handleAgregarRol}
              >
                Agregar
              </Button>
            </div>
          </div>
        )}

        {selectedItem && selectedItem.pinEstado !== 'NORMAL' && (
          <p className="mt-3 text-[10px] font-medium text-amber-600">
            {PIN_LABELS[selectedItem.pinEstado]} — el reinicio del PIN se hace en Gestión de Identidad.
          </p>
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
