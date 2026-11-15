"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, ShieldCheck, Users, Pencil, Trash2, Eye, Lock, Unlock,
  LogOut, KeyRound, X, CheckCircle2, AlertCircle, SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { FormModal, ModalField, modalInputClass, modalSelectClass, Modal, ModalBody, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import {
  rolesApi,
  usuariosApi,
  pinMesaAyudaApi,
  type RolDTO,
  type VistaRolDTO,
  type PermisoDTO,
  type IdentidadUsuarioDTO,
} from '@/lib/api';
import { mensajeErrorApi } from '@/lib/api';

const TORRE_LABELS: Record<string, string> = {
  ADMINISTRATIVO: 'Administrativo',
  RESIDENTE: 'Residente',
  MECANICO: 'Mecánico',
  SOLDADOR: 'Soldador',
  DIESEL: 'Diésel',
  MANTENIMIENTO: 'Mantenimiento',
};

const PIN_LABELS: Record<IdentidadUsuarioDTO['pinEstado'], string> = {
  NORMAL: 'PIN normal',
  TEMPORAL: 'PIN temporal vigente',
  BLOQUEADO: 'PIN bloqueado',
};

const emptyRolForm = { nombre: '', descripcion: '', nivel: '', torre: '' };

export default function RolesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Tabs ──
  const [tab, setTab] = useState<'roles' | 'usuarios'>('roles');

  // ── Roles ──
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vistasOpen, setVistasOpen] = useState(false);
  const [permisosOpen, setPermisosOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<RolDTO | null>(null);
  const [rolForm, setRolForm] = useState(emptyRolForm);
  const [vistas, setVistas] = useState<VistaRolDTO[]>([]);
  const [permisos, setPermisos] = useState<PermisoDTO[]>([]);
  const [permisosOriginales, setPermisosOriginales] = useState<Set<string>>(new Set());
  const [vistasCargando, setVistasCargando] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Usuarios (tab Usuarios → ficha 360) ──
  const [usuarios, setUsuarios] = useState<IdentidadUsuarioDTO[]>([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [usuariosLoaded, setUsuariosLoaded] = useState(false);
  const [ficha, setFicha] = useState<IdentidadUsuarioDTO | null>(null);
  const [fichaLoading, setFichaLoading] = useState(false);
  const [fichaOpen, setFichaOpen] = useState(false);
  const [pinTemporalMostrado, setPinTemporalMostrado] = useState<string | null>(null);
  const [sesionesOpen, setSesionesOpen] = useState(false);

  // ── Búsqueda / filtros / paginación (client-side, patrón /inventario) ──
  const PAGE_SIZE = 10;
  const [searchRoles, setSearchRoles] = useState('');
  const [filterValuesRoles, setFilterValuesRoles] = useState<Record<string, string>>({});
  const [showFiltersRoles, setShowFiltersRoles] = useState(false);
  const [pageRoles, setPageRoles] = useState(1);
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [filterValuesUsuarios, setFilterValuesUsuarios] = useState<Record<string, string>>({});
  const [showFiltersUsuarios, setShowFiltersUsuarios] = useState(false);
  const [pageUsuarios, setPageUsuarios] = useState(1);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/roles');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // El rol es_sistema (Administrador) es SOLO LECTURA en los modales:
  // checkboxes deshabilitados, sin botón Guardar, y solo se muestran las
  // vistas/permisos que el rol tiene asignados. La muralla final es el
  // backend (validarRolEditable → 403 + auditoría FAIL).
  const soloLectura = selectedRol?.esSistema ?? false;

  // ── Catálogo de roles ──
  const fetchRoles = useCallback(async () => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await rolesApi.catalogo();
      if (res.success && res.data) {
        setRoles(res.data.items);
      } else {
        showToast('Error al cargar los roles.', 'error');
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
    fetchRoles();
  }, [fetchRoles]);

  // ── KPIs y datos filtrados/paginados (client-side) ──
  const rolesFiltrados = useMemo(() => {
    const q = searchRoles.trim().toLowerCase();
    return roles.filter((r) => {
      if (q && !`${r.nombre} ${r.descripcion ?? ''}`.toLowerCase().includes(q)) return false;
      if (filterValuesRoles.area && (r.torre ?? '') !== filterValuesRoles.area) return false;
      if (filterValuesRoles.uso === 'con-usuarios' && r.usuarios === 0) return false;
      if (filterValuesRoles.uso === 'sin-uso' && r.usuarios > 0) return false;
      return true;
    });
  }, [roles, searchRoles, filterValuesRoles]);

  const usuariosFiltrados = useMemo(() => {
    const q = searchUsuarios.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (q && !`${u.nombre ?? ''} ${u.email} ${u.numeroEmpleado ?? ''}`.toLowerCase().includes(q)) return false;
      if (filterValuesUsuarios.area && (u.torre ?? '') !== filterValuesUsuarios.area) return false;
      if (filterValuesUsuarios.pin && u.pinEstado !== filterValuesUsuarios.pin) return false;
      return true;
    });
  }, [usuarios, searchUsuarios, filterValuesUsuarios]);

  const rolesPagina = useMemo(
    () => rolesFiltrados.slice((pageRoles - 1) * PAGE_SIZE, pageRoles * PAGE_SIZE),
    [rolesFiltrados, pageRoles],
  );
  const usuariosPagina = useMemo(
    () => usuariosFiltrados.slice((pageUsuarios - 1) * PAGE_SIZE, pageUsuarios * PAGE_SIZE),
    [usuariosFiltrados, pageUsuarios],
  );

  const resetPageRoles = useCallback(() => setPageRoles(1), []);
  const resetPageUsuarios = useCallback(() => setPageUsuarios(1), []);

  // ── Usuarios (solo lectura, para la ficha 360) ──
  const fetchUsuarios = useCallback(async () => {
    setUsuariosLoading(true);
    try {
      const res = await usuariosApi.listar({ limit: 100 });
      if (res.success && res.data) {
        // La ficha se arma por usuario al abrirla — aquí solo la lista base.
        const base = await Promise.all(
          res.data.items.map(async (u) => {
            const r = await usuariosApi.identidad(u.id);
            return r.success && r.data ? r.data : null;
          }),
        );
        setUsuarios(base.filter((b): b is IdentidadUsuarioDTO => b !== null));
      } else {
        showToast('Error al cargar los usuarios.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setUsuariosLoaded(true);
      setUsuariosLoading(false);
    }
  }, [showToast]);

  const usuariosRef = useRef(false);

  // ── Handlers de roles ──
  const openCreate = useCallback(() => {
    setRolForm(emptyRolForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((rol: RolDTO) => {
    setSelectedRol(rol);
    setRolForm({
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
      nivel: String(rol.nivel),
      torre: rol.torre ?? '',
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((rol: RolDTO) => {
    setSelectedRol(rol);
    setDeleteOpen(true);
  }, []);

  const openVistas = useCallback(async (rol: RolDTO) => {
    setSelectedRol(rol);
    setVistasOpen(true);
    setVistasCargando(true);
    try {
      const res = await rolesApi.vistas(rol.id);
      if (!res.success) {
        showToast(mensajeErrorApi(res.error, 'No se pudieron cargar las vistas.'), 'error');
        return;
      }
      setVistas(res.data!.vistas);
    } catch {
      showToast('Error de conexión al cargar las vistas.', 'error');
    } finally {
      setVistasCargando(false);
    }
  }, [showToast]);

  const openPermisos = useCallback(async (rol: RolDTO) => {
    setSelectedRol(rol);
    setPermisosOpen(true);
    setVistasCargando(true);
    try {
      const res = await rolesApi.permisos(rol.id);
      if (!res.success) {
        showToast(mensajeErrorApi(res.error, 'No se pudieron cargar los permisos.'), 'error');
        return;
      }
      setPermisos(res.data!.permisos);
      setPermisosOriginales(new Set(res.data!.permisos.filter((p) => p.asignado).map((p) => p.id)));
    } catch {
      showToast('Error de conexión al cargar los permisos.', 'error');
    } finally {
      setVistasCargando(false);
    }
  }, [showToast]);

  const toggleFlag = (vistaId: string, campo: keyof VistaRolDTO) => {
    setVistas((prev) => prev.map((v) => (v.vistaId === vistaId ? { ...v, [campo]: !v[campo] } : v)));
  };

  const togglePermiso = (permisoId: string) => {
    setPermisos((prev) => prev.map((p) => (p.id === permisoId ? { ...p, asignado: !p.asignado } : p)));
  };

  const refetchRoles = useCallback(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreate = useCallback(async () => {
    if (!rolForm.nombre.trim()) {
      showToast('El nombre del rol es obligatorio.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await rolesApi.crear({
        nombre: rolForm.nombre,
        descripcion: rolForm.descripcion || undefined,
        nivel: rolForm.nivel ? Number(rolForm.nivel) : undefined,
        torre: rolForm.torre || undefined,
      });
      if (res.success) {
        showToast(`Rol "${rolForm.nombre}" creado.`, 'success');
        setCreateOpen(false);
        refetchRoles();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al crear el rol.'), 'error');
      }
    } catch {
      showToast('Error de conexión al crear el rol.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [rolForm, showToast, refetchRoles]);

  const handleEdit = useCallback(async () => {
    if (!selectedRol) return;
    if (!rolForm.nombre.trim()) {
      showToast('El nombre del rol es obligatorio.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await rolesApi.actualizar(selectedRol.id, {
        nombre: rolForm.nombre,
        descripcion: rolForm.descripcion || undefined,
        nivel: rolForm.nivel ? Number(rolForm.nivel) : undefined,
        torre: rolForm.torre || undefined,
      });
      if (res.success) {
        showToast('Rol actualizado.', 'success');
        setEditOpen(false);
        refetchRoles();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar el rol.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el rol.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRol, rolForm, showToast, refetchRoles]);

  const handleDelete = useCallback(async () => {
    if (!selectedRol) return;
    setSubmitting(true);
    try {
      const res = await rolesApi.eliminar(selectedRol.id);
      if (res.success) {
        showToast(res.data?.message ?? 'Rol eliminado.', 'success');
        setDeleteOpen(false);
        refetchRoles();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al eliminar el rol.'), 'error');
      }
    } catch {
      showToast('Error de conexión al eliminar el rol.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRol, showToast, refetchRoles]);

  const handleGuardarVistas = useCallback(async () => {
    if (!selectedRol) return;
    setSubmitting(true);
    try {
      const res = await rolesApi.actualizarVistas(selectedRol.id, {
        vistas: vistas.map((v) => ({
          vistaId: v.vistaId,
          puedeVer: v.puedeVer,
          puedeCrear: v.puedeCrear,
          puedeEditar: v.puedeEditar,
          puedeEliminar: v.puedeEliminar,
          puedeExportar: v.puedeExportar,
        })),
      });
      if (res.success) {
        showToast('Vistas del rol actualizadas.', 'success');
        setVistasOpen(false);
        refetchRoles();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar las vistas.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar las vistas.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRol, vistas, showToast, refetchRoles]);

  const handleGuardarPermisos = useCallback(async () => {
    if (!selectedRol) return;
    const actuales = new Set(permisos.filter((p) => p.asignado).map((p) => p.id));
    const agregar = [...actuales].filter((id) => !permisosOriginales.has(id));
    const quitar = [...permisosOriginales].filter((id) => !actuales.has(id));
    setSubmitting(true);
    try {
      const res = await rolesApi.actualizarPermisos(selectedRol.id, { agregar, quitar });
      if (res.success) {
        showToast(res.data?.message ?? 'Permisos actualizados.', 'success');
        setPermisosOpen(false);
        refetchRoles();
      } else {
        showToast(mensajeErrorApi(res.error, 'Error al actualizar los permisos.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar los permisos.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRol, permisos, permisosOriginales, showToast, refetchRoles]);

  // ── Ficha 360 (mesa de ayuda) ──
  const openFicha = useCallback(async (usuarioId: string) => {
    setFichaOpen(true);
    setFichaLoading(true);
    setPinTemporalMostrado(null);
    try {
      const res = await usuariosApi.identidad(usuarioId);
      if (!res.success) {
        showToast(mensajeErrorApi(res.error, 'No se pudo cargar la ficha.'), 'error');
        setFichaOpen(false);
        return;
      }
      setFicha(res.data!);
    } catch {
      showToast('Error de conexión al cargar la ficha.', 'error');
      setFichaOpen(false);
    } finally {
      setFichaLoading(false);
    }
  }, [showToast]);

  const recargarFicha = useCallback((usuarioId: string) => {
    usuariosApi.identidad(usuarioId).then((res) => {
      if (res.success && res.data) setFicha(res.data);
    });
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleCambiarRol = useCallback(async (usuarioId: string, rolId: string) => {
    if (!rolId) return;
    try {
      const res = await usuariosApi.cambiarRol(usuarioId, rolId);
      if (res.success) {
        showToast(res.data?.message ?? 'Rol actualizado.', 'success');
        recargarFicha(usuarioId);
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo cambiar el rol.'), 'error');
      }
    } catch {
      showToast('Error de conexión al cambiar el rol.', 'error');
    }
  }, [showToast, recargarFicha]);

  const handleReiniciarPin = useCallback(async (usuarioId: string) => {
    try {
      const res = await pinMesaAyudaApi.reiniciar(usuarioId);
      if (!res.success) {
        showToast(mensajeErrorApi(res.error, 'No se pudo reiniciar el PIN.'), 'error');
        return;
      }
      setPinTemporalMostrado(res.data!.pinTemporal);
      showToast(res.data!.message, 'success');
    } catch {
      showToast('Error de conexión al reiniciar el PIN.', 'error');
    }
  }, [showToast]);

  const handleDesbloquear = useCallback(async (usuarioId: string) => {
    try {
      const res = await pinMesaAyudaApi.desbloquear(usuarioId);
      if (res.success) {
        showToast(res.data?.message ?? 'Cuenta desbloqueada.', 'success');
        recargarFicha(usuarioId);
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo desbloquear la cuenta.'), 'error');
      }
    } catch {
      showToast('Error de conexión al desbloquear la cuenta.', 'error');
    }
  }, [showToast, recargarFicha]);

  const handleCerrarSesiones = useCallback(async () => {
    if (!ficha) return;
    setSubmitting(true);
    try {
      const res = await usuariosApi.cerrarSesiones(ficha.id);
      if (res.success) {
        showToast(res.data?.message ?? 'Sesiones cerradas.', 'success');
        setSesionesOpen(false);
        recargarFicha(ficha.id);
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudieron cerrar las sesiones.'), 'error');
      }
    } catch {
      showToast('Error de conexión al cerrar las sesiones.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [ficha, showToast, recargarFicha]);

  // ── Columnas del catálogo de roles ──
  const columnsRoles: Column<RolDTO>[] = [
    {
      key: 'rol',
      header: 'Rol',
      render: (rol) => (
        <div>
          <div className="font-black text-ui-900 flex items-center gap-1.5">
            {rol.nombre}
            {rol.esSistema && <Lock className="w-3 h-3 text-ui-400" />}
          </div>
          <div className="text-[10px] font-bold text-ui-400 uppercase tracking-widest">
            {rol.descripcion ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'nivel',
      header: 'Nivel',
      render: (rol) => <span className="font-black text-ui-900">{rol.nivel}</span>,
    },
    {
      key: 'area',
      header: 'Área',
      render: (rol) => (
        <span className="text-xs font-semibold text-ui-600">
          {rol.torre ? (TORRE_LABELS[rol.torre] ?? rol.torre) : '—'}
        </span>
      ),
    },
    {
      key: 'usuarios',
      header: 'Usuarios',
      render: (rol) => <span className="font-black text-ui-900">{rol.usuarios}</span>,
    },
    {
      key: 'vistas',
      header: 'Vistas',
      render: (rol) => <span className="font-black text-ui-900">{rol.vistas}</span>,
    },
    {
      key: 'permisos',
      header: 'Permisos',
      render: (rol) => <span className="font-black text-ui-900">{rol.permisos}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (rol) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="info"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); openVistas(rol); }}
          >
            Vistas
          </Button>
          <Button
            variant="info"
            size="sm"
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); openPermisos(rol); }}
          >
            Permisos
          </Button>
          {puedeEditar && !rol.esSistema && (
            <Button
              variant="warning"
              size="sm"
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openEdit(rol); }}
            >
              Editar
            </Button>
          )}
          {puedeEliminar && !rol.esSistema && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); openDelete(rol); }}
            >
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Columnas de usuarios (tab Usuarios) ──
  const columnsUsuarios: Column<IdentidadUsuarioDTO>[] = [
    {
      key: 'usuario',
      header: 'Usuario',
      render: (u) => (
        <div>
          <div className="font-black text-ui-900">{u.nombre ?? u.email}</div>
          <div className="text-[10px] font-bold text-ui-400 uppercase tracking-widest">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u) => (
        <span className="text-xs font-semibold text-ui-600">
          {u.roles.map((r) => r.nombre).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'area',
      header: 'Área',
      render: (u) => (
        <span className="text-xs font-semibold text-ui-600">
          {u.torre ? (TORRE_LABELS[u.torre] ?? u.torre) : '—'}
        </span>
      ),
    },
    {
      key: 'pin',
      header: 'PIN',
      render: (u) => (
        <span className="text-xs font-semibold text-ui-600">{PIN_LABELS[u.pinEstado]}</span>
      ),
    },
    {
      key: 'sesiones',
      header: 'Sesiones activas',
      render: (u) => <span className="font-black text-ui-900">{u.sesiones.length}</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="info"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); openFicha(u.id); }}
          >
            Ficha
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Gestión de Identidad"
        subtitle="Roles, vistas, permisos, áreas, PIN y sesiones — la vista de solo lectura para la mesa de ayuda."
        action={
          tab === 'roles' && puedeCrear ? (
            <Button
              skeleton={initialLoading}
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={openCreate}
            >
              Nuevo Rol
            </Button>
          ) : undefined
        }
      />

      {/* KPIs por tab */}
      {tab === 'roles' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={<ShieldCheck className="w-6 h-6" />}
            value={`${roles.length} roles`}
            label="Roles del Sistema"
            color="info"
            loading={initialLoading}
          />
          <StatsCard
            icon={<Users className="w-6 h-6" />}
            value={`${roles.reduce((s, r) => s + r.usuarios, 0)} usuarios`}
            label="Usuarios con Acceso"
            color="neutral"
            loading={initialLoading}
          />
          <StatsCard
            icon={<AlertCircle className="w-6 h-6" />}
            value={`${roles.filter((r) => !r.esSistema && r.usuarios === 0).length} sin uso`}
            label="Roles Sin Usuarios"
            color="neutral"
            loading={initialLoading}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon={<Users className="w-6 h-6" />}
            value={`${usuarios.length} usuarios`}
            label="Usuarios con Cuenta"
            color="info"
            loading={!usuariosLoaded}
          />
          <StatsCard
            icon={<AlertCircle className="w-6 h-6" />}
            value={`${usuarios.filter((u) => u.roles.length === 0).length} sin rol`}
            label="Sin Rol Asignado"
            color="neutral"
            loading={!usuariosLoaded}
          />
          <StatsCard
            icon={<CheckCircle2 className="w-6 h-6" />}
            value={`${usuarios.reduce((s, u) => s + u.sesiones.length, 0)} activas`}
            label="Sesiones Activas"
            color="neutral"
            loading={!usuariosLoaded}
          />
        </div>
      )}

      {/* Tabs compactos */}
      <Tabs
        tabs={[
          { key: 'roles', label: 'Roles', icon: <ShieldCheck className="w-4 h-4" />, count: tab === 'roles' ? undefined : roles.length },
          { key: 'usuarios', label: 'Usuarios', icon: <Users className="w-4 h-4" />, count: tab === 'usuarios' ? undefined : usuariosLoaded ? usuarios.length : undefined },
        ]}
        value={tab}
        onChange={(key) => {
          setTab(key as typeof tab);
          if (key === 'usuarios' && !usuariosRef.current) {
            usuariosRef.current = true;
            fetchUsuarios();
          }
        }}
      >
        <TabPanel tabKey="roles">
        <div className="space-y-3">
<div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={searchRoles}
              onChange={(v) => { setSearchRoles(v); resetPageRoles(); }}
              onSearch={() => resetPageRoles()}
              placeholder="Buscar rol por nombre o descripción..."
              className="flex-1"
            />
            <Button
              variant={showFiltersRoles ? 'primary' : 'secondary'}
              size="md"
              icon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setShowFiltersRoles(prev => !prev)}
              className="shrink-0 whitespace-nowrap"
            >
              <span className="whitespace-nowrap">Filtros</span>
            </Button>
          </div>
          {showFiltersRoles && (
            <div className="bg-ui-50 border border-ui-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">Área</label>
                  <select
                    value={filterValuesRoles.area || ''}
                    onChange={(e) => { setFilterValuesRoles({ ...filterValuesRoles, area: e.target.value }); resetPageRoles(); }}
                    className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Todas</option>
                    {Object.entries(TORRE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">Uso</label>
                  <select
                    value={filterValuesRoles.uso || ''}
                    onChange={(e) => { setFilterValuesRoles({ ...filterValuesRoles, uso: e.target.value }); resetPageRoles(); }}
                    className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Todos</option>
                    <option value="con-usuarios">Con usuarios</option>
                    <option value="sin-uso">Sin uso</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <div className="relative">
            <RefreshOverlay show={refreshing && !initialLoading} />
            <DataTable
              columns={columnsRoles}
              data={rolesPagina}
              loading={initialLoading}
              keyExtractor={(rol) => rol.id}
              emptyText="No se encontraron roles que coincidan con la búsqueda."
              maxBodyHeight="500px"
            />
          </div>
          <Pagination
            currentPage={pageRoles}
            totalPages={Math.max(Math.ceil(rolesFiltrados.length / PAGE_SIZE), 1)}
            totalRecords={rolesFiltrados.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPageRoles}
          />
        </div>
        </TabPanel>
        <TabPanel tabKey="usuarios">
        <div className="space-y-3">
<div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={searchUsuarios}
              onChange={(v) => { setSearchUsuarios(v); resetPageUsuarios(); }}
              onSearch={() => resetPageUsuarios()}
              placeholder="Buscar por nombre, correo o número de empleado..."
              className="flex-1"
            />
            <Button
              variant={showFiltersUsuarios ? 'primary' : 'secondary'}
              size="md"
              icon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setShowFiltersUsuarios(prev => !prev)}
              className="shrink-0 whitespace-nowrap"
            >
              <span className="whitespace-nowrap">Filtros</span>
            </Button>
          </div>
          {showFiltersUsuarios && (
            <div className="bg-ui-50 border border-ui-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">Área</label>
                  <select
                    value={filterValuesUsuarios.area || ''}
                    onChange={(e) => { setFilterValuesUsuarios({ ...filterValuesUsuarios, area: e.target.value }); resetPageUsuarios(); }}
                    className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Todas</option>
                    {Object.entries(TORRE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-[10px] font-black text-ui-500 uppercase tracking-widest">Estado PIN</label>
                  <select
                    value={filterValuesUsuarios.pin || ''}
                    onChange={(e) => { setFilterValuesUsuarios({ ...filterValuesUsuarios, pin: e.target.value }); resetPageUsuarios(); }}
                    className="h-10 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Todos</option>
                    <option value="NORMAL">PIN normal</option>
                    <option value="TEMPORAL">PIN temporal vigente</option>
                    <option value="BLOQUEADO">PIN bloqueado</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-ui-500 font-medium">
            Solo lectura — los datos del usuario (nombre, correo, área, alta) se editan en la vista Usuarios.
          </p>
          <div className="relative">
            <DataTable
              columns={columnsUsuarios}
              data={usuariosPagina}
              loading={usuariosLoading || !usuariosLoaded}
              keyExtractor={(u) => u.id}
              emptyText="No se encontraron usuarios que coincidan con la búsqueda."
              maxBodyHeight="500px"
            />
          </div>
          <Pagination
            currentPage={pageUsuarios}
            totalPages={Math.max(Math.ceil(usuariosFiltrados.length / PAGE_SIZE), 1)}
            totalRecords={usuariosFiltrados.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPageUsuarios}
          />
        </div>
        </TabPanel>
      </Tabs>

      {/* ═══════════════════════════════════════════
          MODALES — ROLES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Nuevo Rol"
        submitLabel="Crear Rol"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <FormRol form={rolForm} setForm={setRolForm} />
      </FormModal>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Rol"
        subtitle={selectedRol?.nombre}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <FormRol form={rolForm} setForm={setRolForm} />
      </FormModal>

      <FormModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        title="Eliminar Rol"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
        onSubmit={handleDelete}
        isSubmitting={submitting}
      >
        {selectedRol && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Estás seguro de eliminar el rol?</p>
            <p className="font-black text-ui-900 text-lg mb-2">{selectedRol.nombre}</p>
            <p className="text-xs text-ui-500">
              No procede si tiene usuarios asignados ({selectedRol.usuarios}).
            </p>
          </div>
        )}
      </FormModal>

      {/* Vistas del rol */}
      <Modal open={vistasOpen} onClose={() => setVistasOpen(false)} size="xl">
        <ModalHeader
          title={`Vistas de ${selectedRol?.nombre ?? 'rol'}`}
          subtitle={soloLectura ? 'Solo lectura — las vistas con acceso del rol' : 'Flags por vista — se guardan todos junto'}
          onClose={() => setVistasOpen(false)}
        />
        <ModalBody>
          {vistasCargando ? (
            <p className="text-sm text-ui-500 text-center py-6">Cargando vistas...</p>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto scrollbar-none">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] font-black text-ui-500 uppercase tracking-widest">
                    <th className="py-2">Vista</th>
                    <th className="py-2 text-center">Ver</th>
                    <th className="py-2 text-center">Crear</th>
                    <th className="py-2 text-center">Editar</th>
                    <th className="py-2 text-center">Eliminar</th>
                    <th className="py-2 text-center">Exportar</th>
                  </tr>
                </thead>
                <tbody>
                  {vistas
                    .filter((v) => (soloLectura ? v.puedeVer : true))
                    .map((v) => (
                    <tr key={v.vistaId} className="border-t border-ui-100">
                      <td className="py-2">
                        <div className="font-bold text-ui-800">{v.nombre}</div>
                        <div className="text-[10px] text-ui-400">{v.ruta}</div>
                      </td>
                      {(['puedeVer', 'puedeCrear', 'puedeEditar', 'puedeEliminar', 'puedeExportar'] as const).map((campo) => (
                        <td key={campo} className="py-2 text-center">
                          <input
                            type="checkbox"
                            checked={v[campo]}
                            disabled={soloLectura}
                            onChange={() => toggleFlag(v.vistaId, campo)}
                            className="w-4 h-4 accent-blue-600"
                            aria-label={`${campo} ${v.nombre}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant={soloLectura ? 'primary' : 'secondary'} onClick={() => setVistasOpen(false)}>{soloLectura ? 'Cerrar' : 'Cancelar'}</Button>
          {!soloLectura && (
            <Button variant="primary" onClick={handleGuardarVistas} loading={submitting}>Guardar</Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Permisos del rol */}
      <Modal open={permisosOpen} onClose={() => setPermisosOpen(false)} size="xl">
        <ModalHeader
          title={`Permisos de ${selectedRol?.nombre ?? 'rol'}`}
          subtitle={soloLectura ? 'Solo lectura — los permisos asignados al rol' : 'Matriz módulo / recurso / acción — marca los que el rol puede hacer'}
          onClose={() => setPermisosOpen(false)}
        />
        <ModalBody>
          {vistasCargando ? (
            <p className="text-sm text-ui-500 text-center py-6">Cargando permisos...</p>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto scrollbar-none space-y-4">
              {Object.entries(
                permisos
                  .filter((p) => (soloLectura ? p.asignado : true))
                  .reduce<Record<string, PermisoDTO[]>>((acc, p) => {
                    (acc[p.modulo] = acc[p.modulo] ?? []).push(p);
                    return acc;
                  }, {}),
              ).map(([modulo, lista]) => (
                <div key={modulo}>
                  <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-1.5">
                    {modulo}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {lista.map((p) => (
                      <label key={p.id} className={`flex items-center gap-2 text-xs font-medium text-ui-700 ${soloLectura ? '' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(p.asignado)}
                          disabled={soloLectura}
                          onChange={() => togglePermiso(p.id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="font-bold">{p.recurso}</span>
                        <span className="text-ui-400">· {p.accion}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant={soloLectura ? 'primary' : 'secondary'} onClick={() => setPermisosOpen(false)}>{soloLectura ? 'Cerrar' : 'Cancelar'}</Button>
          {!soloLectura && (
            <Button variant="primary" onClick={handleGuardarPermisos} loading={submitting}>Guardar</Button>
          )}
        </ModalFooter>
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL — FICHA 360 (tab Usuarios)
          ═══════════════════════════════════════════ */}

      <Modal open={fichaOpen} onClose={() => setFichaOpen(false)} size="xl">
        <ModalHeader
          title={`Ficha de ${ficha?.nombre ?? 'usuario'}`}
          subtitle={ficha?.email}
          onClose={() => setFichaOpen(false)}
        />
        <ModalBody>
          {fichaLoading || !ficha ? (
            <p className="text-sm text-ui-500 text-center py-6">Cargando ficha...</p>
          ) : (
            <div className="space-y-5">
              {/* Datos base */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModalField label="Rol (mono-rol)">
                  {ficha.roles.some((r) => r.esSistema) ? (
                    <p className="text-sm font-bold text-ui-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-ui-400" />
                      {ficha.roles[0].nombre}
                    </p>
                  ) : (
                    <select
                      className={modalSelectClass}
                      value={ficha.roles[0]?.id ?? ''}
                      disabled={!puedeEditar}
                      onChange={(e) => handleCambiarRol(ficha.id, e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {roles
                        .filter((r) => !r.esSistema)
                        .map((r) => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                    </select>
                  )}
                </ModalField>
                <ModalField label="Área">
                  <p className="text-sm font-bold text-ui-700">
                    {ficha.torre ? (TORRE_LABELS[ficha.torre] ?? ficha.torre) : '—'}
                  </p>
                </ModalField>
                <ModalField label="Jefe / Residente">
                  <p className="text-sm font-bold text-ui-700">{ficha.jefe?.nombre ?? '—'}</p>
                </ModalField>
                <ModalField label="Número de empleado">
                  <p className="text-sm font-bold text-ui-700">
                    {ficha.numeroEmpleado ?? '—'} · {PIN_LABELS[ficha.pinEstado]}
                  </p>
                </ModalField>
              </div>

              {/* Mesa de ayuda */}
              {puedeEditar && (
                <div className="border border-ui-200 rounded-xl p-4">
                  <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-2">
                    Mesa de ayuda
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="warning"
                      size="sm"
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                      onClick={() => handleReiniciarPin(ficha.id)}
                    >
                      Reiniciar PIN
                    </Button>
                    {ficha.pinEstado === 'BLOQUEADO' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Unlock className="w-3.5 h-3.5" />}
                        onClick={() => handleDesbloquear(ficha.id)}
                      >
                        Desbloquear cuenta
                      </Button>
                    )}
                    {ficha.id !== user?.id && (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<LogOut className="w-3.5 h-3.5" />}
                        onClick={() => setSesionesOpen(true)}
                      >
                        Cerrar sesiones ({ficha.sesiones.length})
                      </Button>
                    )}
                  </div>
                  {pinTemporalMostrado && (
                    <div className="mt-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-700">PIN temporal (se muestra UNA VEZ, vence en 24 h):</p>
                        <p className="text-lg font-black tracking-[0.3em] text-amber-900">{pinTemporalMostrado}</p>
                      </div>
                      <button
                        onClick={() => setPinTemporalMostrado(null)}
                        className="ml-auto text-amber-500 hover:text-amber-700"
                        aria-label="Ocultar PIN"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Vistas heredadas */}
              <div>
                <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-2">
                  Vistas ({ficha.vistas.length})
                </p>
                {ficha.vistas.length === 0 ? (
                  <p className="text-xs text-ui-500">Sin vistas asignadas.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {ficha.vistas.map((v) => (
                      <span key={v.vistaId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ui-100 text-ui-700 text-[10px] font-bold">
                        {v.nombre}
                        {v.puedeCrear && <span className="text-ui-400" title="Crear">C</span>}
                        {v.puedeEditar && <span className="text-ui-400" title="Editar">E</span>}
                        {v.puedeEliminar && <span className="text-ui-400" title="Eliminar">X</span>}
                        {v.puedeExportar && <span className="text-ui-400" title="Exportar">Ex</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Permisos heredados */}
              <div>
                <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-2">
                  Permisos ({ficha.permisos.length})
                </p>
                {ficha.permisos.length === 0 ? (
                  <p className="text-xs text-ui-500">Sin permisos asignados.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto scrollbar-none space-y-2.5">
                    {Object.entries(
                      ficha.permisos.reduce<Record<string, PermisoDTO[]>>((acc, p) => {
                        (acc[p.modulo] = acc[p.modulo] ?? []).push(p);
                        return acc;
                      }, {}),
                    ).map(([modulo, lista]) => (
                      <div key={modulo}>
                        <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-1">
                          {modulo} ({lista.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {lista.map((p) => (
                            <span key={p.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ui-100 text-ui-700 text-[10px] font-bold">
                              {p.recurso}
                              <span className="text-ui-400">· {p.accion}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sesiones activas */}
              <div>
                <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-2">
                  Sesiones activas ({ficha.sesiones.length})
                </p>
                {ficha.sesiones.length === 0 ? (
                  <p className="text-xs text-ui-500">Sin sesiones activas.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto scrollbar-none space-y-1.5">
                    {ficha.sesiones.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-ui-100 last:border-0">
                        <p className="text-xs font-bold text-ui-800 truncate">
                          {s.dispositivo ?? 'Dispositivo desconocido'}
                          {s.ubicacion ? ` · ${s.ubicacion}` : ''}
                        </p>
                        <p className="text-[10px] text-ui-400 shrink-0">
                          {s.ip} · {new Date(s.ultimaActividad).toLocaleString('es-MX')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setFichaOpen(false)}>Cerrar</Button>
        </ModalFooter>
      </Modal>

      {/* Confirmación de cierre de sesiones */}
      <FormModal
        open={sesionesOpen}
        onClose={() => setSesionesOpen(false)}
        onCancel={() => setSesionesOpen(false)}
        title="Cerrar todas las sesiones"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Cerrar Sesiones"
        cancelLabel="Cancelar"
        onSubmit={handleCerrarSesiones}
        isSubmitting={submitting}
      >
        {ficha && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/15 rounded-full flex items-center justify-center mb-4">
              <LogOut className="w-7 h-7 text-amber-500" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Cerrar todas las sesiones activas de?</p>
            <p className="font-black text-ui-900 text-lg mb-2">{ficha.nombre ?? ficha.email}</p>
            <p className="text-xs text-ui-500">
              Se cierran {ficha.sesiones.length} sesión(es) y se revocan sus tokens de refresco.
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}

/** Formulario compartido de crear/editar rol. */
function FormRol({
  form,
  setForm,
}: {
  form: typeof emptyRolForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyRolForm>>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ModalField label="Nombre" required>
        <input
          type="text"
          className={modalInputClass}
          placeholder="Ej: Supervisor de Obra"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
      </ModalField>
      <ModalField label="Nivel jerárquico">
        <input
          type="text"
          inputMode="numeric"
          className={modalInputClass}
          placeholder="0-100"
          value={form.nivel}
          onChange={(e) => setForm({ ...form, nivel: e.target.value.replace(/[^\d]/g, '') })}
        />
      </ModalField>
      <ModalField label="Área (torre)">
        <select
          className={modalSelectClass}
          value={form.torre}
          onChange={(e) => setForm({ ...form, torre: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {Object.entries(TORRE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </ModalField>
      <ModalField label="Descripción">
        <input
          type="text"
          className={modalInputClass}
          placeholder="Qué hace este rol"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </ModalField>
    </div>
  );
}
