'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, Clock, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Modal, ModalHeader, ModalBody, ModalFooter, FormModal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { incidentes as incidentesMock } from '@/lib/mock-data/operaciones';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Incidente } from '@svr-erp/shared';
import type { BadgeVariant } from '@/components/ui/Badge';

// ── Constantes ──
const PRIORIDADES: Incidente['prioridad'][] = ['Crítica', 'Alta', 'Media', 'Baja'];
const ESTADOS: Incidente['estado'][] = ['Abierto', 'En Revisión', 'Resuelto'];

const prioridadVariant: Record<Incidente['prioridad'], BadgeVariant> = {
  Crítica: 'error',
  Alta: 'warning',
  Media: 'primary',
  Baja: 'info',
};

const estadoVariant: Record<Incidente['estado'], BadgeVariant> = {
  Abierto: 'error',
  'En Revisión': 'warning',
  Resuelto: 'success',
};

const prioridadIconClass: Record<Incidente['prioridad'], string> = {
  Crítica: 'bg-red-500 text-white shadow-red-500/20',
  Alta: 'bg-orange-500 text-white shadow-orange-500/20',
  Media: 'bg-yellow-500 text-secondary shadow-yellow-500/20',
  Baja: 'bg-blue-500 text-white shadow-blue-500/20',
};

const emptyForm = {
  titulo: '',
  descripcion: '',
  prioridad: 'Media' as Incidente['prioridad'],
  estado: 'Abierto' as Incidente['estado'],
  obra: '',
  maquinaId: '',
  fecha: new Date().toISOString().split('T')[0],
};

export default function IncidentesPage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find((v) => v.ruta === '/incidentes');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeEliminar = vista?.puedeEliminar ?? false;

  // ── Estado de datos ──
  const [incidentes, setIncidentes] = useState<Incidente[]>(incidentesMock);
  const [search, setSearch] = useState('');
  const [prioridadFiltro, setPrioridadFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  // ── Estado de modales ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Incidente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Filtros ──
  const incidentesFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incidentes.filter((inc) => {
      const matchesSearch =
        !q ||
        inc.titulo.toLowerCase().includes(q) ||
        inc.descripcion.toLowerCase().includes(q) ||
        inc.obra.toLowerCase().includes(q);
      const matchesPrioridad = !prioridadFiltro || inc.prioridad === prioridadFiltro;
      const matchesEstado = !estadoFiltro || inc.estado === estadoFiltro;
      return matchesSearch && matchesPrioridad && matchesEstado;
    });
  }, [incidentes, search, prioridadFiltro, estadoFiltro]);

  // ── Handlers de formulario ──
  const resetForm = useCallback(() => {
    setForm(emptyForm);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setCreateOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((item: Incidente) => {
    setSelectedItem(item);
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion,
      prioridad: item.prioridad,
      estado: item.estado,
      obra: item.obra,
      maquinaId: item.maquinaId || '',
      fecha: item.fecha,
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((item: Incidente) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  }, []);

  const validateForm = useCallback(() => {
    if (!form.titulo.trim() || !form.obra.trim() || !form.fecha) {
      showToast('Título, obra y fecha son obligatorios.', 'error');
      return false;
    }
    if (!form.descripcion.trim()) {
      showToast('La descripción es obligatoria.', 'error');
      return false;
    }
    return true;
  }, [form, showToast]);

  const handleCreate = useCallback(() => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const nuevo: Incidente = {
        id: `IN${Date.now().toString().slice(-3)}`,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
        estado: form.estado,
        obra: form.obra.trim(),
        maquinaId: form.maquinaId.trim() || undefined,
        fecha: form.fecha,
      };
      setIncidentes((prev) => [nuevo, ...prev]);
      showToast(`Incidente "${nuevo.titulo}" reportado exitosamente.`, 'success');
      setCreateOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }, [form, validateForm, showToast, resetForm]);

  const handleEdit = useCallback(() => {
    if (!selectedItem || !validateForm()) return;
    setSubmitting(true);
    try {
      setIncidentes((prev) =>
        prev.map((inc) =>
          inc.id === selectedItem.id
            ? {
                ...inc,
                titulo: form.titulo.trim(),
                descripcion: form.descripcion.trim(),
                prioridad: form.prioridad,
                estado: form.estado,
                obra: form.obra.trim(),
                maquinaId: form.maquinaId.trim() || undefined,
                fecha: form.fecha,
              }
            : inc,
        ),
      );
      showToast(`Incidente "${form.titulo.trim()}" actualizado exitosamente.`, 'success');
      setEditOpen(false);
      setSelectedItem(null);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, form, validateForm, showToast, resetForm]);

  const handleDelete = useCallback(() => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      setIncidentes((prev) => prev.filter((inc) => inc.id !== selectedItem.id));
      showToast('Incidente eliminado exitosamente.', 'success');
      setDeleteOpen(false);
      setSelectedItem(null);
    } finally {
      setSubmitting(false);
    }
  }, [selectedItem, showToast]);

  const clearFilters = useCallback(() => {
    setPrioridadFiltro('');
    setEstadoFiltro('');
    setSearch('');
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="p-6 min-h-screen bg-slate-50">
        <LoadingState text="Verificando sesión..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">
      <PageHeader
        title="Seguridad e Incidentes"
        subtitle="Reporte de fallas, accidentes y retrasos operativos en obra."
        action={
          puedeCrear ? (
            <Button variant="danger" icon={<ShieldAlert className="w-5 h-5" />} onClick={openCreate}>
              Reportar Incidente
            </Button>
          ) : undefined
        }
      />

      {/* ── Búsqueda y filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar incidente, obra..."
          className="flex-1"
        />
        <Select
          label="Prioridad"
          placeholder="Todas"
          value={prioridadFiltro}
          onChange={(e) => setPrioridadFiltro(e.target.value)}
          options={PRIORIDADES.map((p) => ({ value: p, label: p }))}
          className="w-full sm:w-44"
        />
        <Select
          label="Estado"
          placeholder="Todos"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          options={ESTADOS.map((e) => ({ value: e, label: e }))}
          className="w-full sm:w-44"
        />
      </div>

      {/* ── Grid de incidentes ── */}
      {incidentesFiltrados.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-10 h-10 text-red-500" />}
          title="No hay incidentes reportados"
          subtitle={
            search || prioridadFiltro || estadoFiltro
              ? 'No se encontraron incidentes con los filtros seleccionados.'
              : 'Aún no hay incidentes registrados en el sistema.'
          }
          action={
            (search || prioridadFiltro || estadoFiltro) ? (
              <Button variant="secondary" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : puedeCrear ? (
              <Button variant="danger" icon={<ShieldAlert className="w-4 h-4" />} onClick={openCreate}>
                Reportar Incidente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {incidentesFiltrados.map((inc) => (
            <Card key={inc.id} className="group overflow-hidden">
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'p-2 rounded-lg shadow-lg shrink-0',
                      prioridadIconClass[inc.prioridad]
                    )}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight truncate">
                      {inc.titulo}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">
                      {inc.obra}
                    </p>
                  </div>
                </div>
                <Badge variant={estadoVariant[inc.estado]} size="sm">
                  {inc.estado}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={prioridadVariant[inc.prioridad]} size="sm">
                  {inc.prioridad}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 font-medium mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                &ldquo;{inc.descripcion}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      {formatDate(inc.fecha)}
                    </span>
                  </div>
                  {inc.maquinaId && (
                    <span className="text-[10px] font-black text-primary uppercase truncate">
                      Máquina: {inc.maquinaId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {puedeEditar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil className="w-3.5 h-3.5" />}
                      onClick={() => openEdit(inc)}
                      aria-label="Editar incidente"
                    />
                  )}
                  {puedeEliminar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      onClick={() => openDelete(inc)}
                      aria-label="Eliminar incidente"
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      {/* Crear */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCancel={() => setCreateOpen(false)}
        title="Reportar Incidente"
        subtitle="Registra una falla, accidente o retraso operativo en obra."
        submitLabel="Reportar Incidente"
        cancelLabel="Cancelar"
        onSubmit={handleCreate}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Título"
            placeholder="Ej: Fuga de aceite hidráulico"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
            className="sm:col-span-2"
          />
          <Textarea
            label="Descripción"
            placeholder="Describe el incidente con detalle..."
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
            className="sm:col-span-2"
          />
          <Select
            label="Prioridad"
            value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value as Incidente['prioridad'] })}
            options={PRIORIDADES.map((p) => ({ value: p, label: p }))}
            required
          />
          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as Incidente['estado'] })}
            options={ESTADOS.map((e) => ({ value: e, label: e }))}
            required
          />
          <Input
            label="Obra"
            placeholder="Ej: Valle Sur"
            value={form.obra}
            onChange={(e) => setForm({ ...form, obra: e.target.value })}
            required
          />
          <Input
            label="Máquina (opcional)"
            placeholder="Ej: M001"
            value={form.maquinaId}
            onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
          />
          <Input
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
          />
        </div>
      </FormModal>

      {/* Editar */}
      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCancel={() => setEditOpen(false)}
        title="Editar Incidente"
        subtitle={selectedItem ? `Incidente ${selectedItem.id}` : undefined}
        submitLabel="Guardar Cambios"
        cancelLabel="Cancelar"
        onSubmit={handleEdit}
        isSubmitting={submitting}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
            className="sm:col-span-2"
          />
          <Textarea
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
            className="sm:col-span-2"
          />
          <Select
            label="Prioridad"
            value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value as Incidente['prioridad'] })}
            options={PRIORIDADES.map((p) => ({ value: p, label: p }))}
            required
          />
          <Select
            label="Estado"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as Incidente['estado'] })}
            options={ESTADOS.map((e) => ({ value: e, label: e }))}
            required
          />
          <Input
            label="Obra"
            value={form.obra}
            onChange={(e) => setForm({ ...form, obra: e.target.value })}
            required
          />
          <Input
            label="Máquina (opcional)"
            value={form.maquinaId}
            onChange={(e) => setForm({ ...form, maquinaId: e.target.value })}
          />
          <Input
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
          />
        </div>
      </FormModal>

      {/* Eliminar */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} size="sm">
        <ModalHeader
          title="Eliminar Incidente"
          subtitle="Esta acción no se puede deshacer."
          onClose={() => setDeleteOpen(false)}
        />
        <ModalBody>
          {selectedItem && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm text-slate-700 mb-1">
                ¿Estás seguro de eliminar este incidente?
              </p>
              <p className="font-black text-slate-900 text-lg mb-2">{selectedItem.titulo}</p>
              <p className="text-xs text-slate-500">
                {selectedItem.obra} · {selectedItem.prioridad}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={submitting} disabled={submitting}>
            Sí, Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
