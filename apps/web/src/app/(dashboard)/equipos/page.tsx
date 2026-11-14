"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UsersRound, UserPlus, Eye, UserMinus, RefreshCw, UserX } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { FormModal, ModalField, modalSelectClass, Modal, ModalBody, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { equiposApi, type EquipoDTO, type EquiposDTO, type MiembroEquipoDTO } from '@/lib/api';
import { mensajeErrorApi } from '@/lib/api';

const TORRE_LABELS: Record<string, string> = {
  ADMINISTRATIVO: 'Administrativo',
  RESIDENTE: 'Residente',
  MECANICO: 'Mecánico',
  SOLDADOR: 'Soldador',
  DIESEL: 'Diésel',
  MANTENIMIENTO: 'Mantenimiento',
};

export default function EquiposPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<EquiposDTO>({ equipos: [], sinJefe: [] });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  // ── Modales de acción ──
  const [verOpen, setVerOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoDTO | null>(null);
  const [selectedMiembro, setSelectedMiembro] = useState<MiembroEquipoDTO | null>(null);
  const [trabajadorElegido, setTrabajadorElegido] = useState('');
  const [jefeElegido, setJefeElegido] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Permisos RBAC ──
  const vista = user?.vistas?.find(v => v.ruta === '/equipos');
  const puedeEditar = vista?.puedeEditar ?? false;

  const fetchData = useCallback(async () => {
    if (!hasLoaded.current) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await equiposApi.listar();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        showToast('Error al cargar los equipos.', 'error');
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
    fetchData();
  }, [fetchData]);

  const totalAsignaciones = data.equipos.reduce((sum, e) => sum + e.subordinados.length, 0);

  // ── Acciones (PATCH /usuarios/:id/jefe, audita JEFE_ASIGNADO) ──
  const cambiarJefe = useCallback(async (usuarioId: string, jefeUserId: string | null, mensajeOk: string) => {
    setSubmitting(true);
    try {
      const res = await equiposApi.asignarJefe(usuarioId, jefeUserId);
      if (res.success) {
        showToast(mensajeOk, 'success');
        fetchData();
      } else {
        showToast(mensajeErrorApi(res.error, 'No se pudo actualizar el equipo.'), 'error');
      }
    } catch {
      showToast('Error de conexión al actualizar el equipo.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [showToast, fetchData]);

  const handleAsignar = useCallback(() => {
    if (!selectedEquipo || !trabajadorElegido) return;
    const trabajador = data.sinJefe.find((m) => m.id === trabajadorElegido);
    if (!trabajador) return;
    cambiarJefe(
      trabajador.id,
      selectedEquipo.usuarioId,
      `${trabajador.nombre ?? 'El trabajador'} asignado al equipo de ${selectedEquipo.nombre ?? 'el residente'}.`,
    ).then(() => setAssignOpen(false));
  }, [selectedEquipo, trabajadorElegido, data.sinJefe, cambiarJefe]);

  const handleReasignar = useCallback(() => {
    if (!selectedMiembro || !jefeElegido) return;
    if (selectedEquipo && jefeElegido === selectedEquipo.usuarioId) {
      showToast('Ya pertenece a ese equipo.', 'error');
      return;
    }
    const equipo = data.equipos.find((e) => e.usuarioId === jefeElegido);
    cambiarJefe(
      selectedMiembro.id,
      jefeElegido,
      `${selectedMiembro.nombre ?? 'El usuario'} re-asignado al equipo de ${equipo?.nombre ?? 'el residente'}.`,
    ).then(() => setReassignOpen(false));
  }, [selectedMiembro, jefeElegido, selectedEquipo, data.equipos, cambiarJefe, showToast]);

  const handleQuitar = useCallback(() => {
    if (!selectedMiembro) return;
    cambiarJefe(
      selectedMiembro.id,
      null,
      `${selectedMiembro.nombre ?? 'El usuario'} des-asignado (solo verá sus propios reportes).`,
    ).then(() => setRemoveOpen(false));
  }, [selectedMiembro, cambiarJefe]);

  // ── Columnas de DataTable ──
  const columns: Column<EquipoDTO>[] = [
    {
      key: 'residente',
      header: 'Residente',
      render: (equipo) => (
        <div>
          <div className="font-black text-ui-900">{equipo.nombre ?? equipo.email}</div>
          <div className="text-[10px] font-bold text-ui-400 uppercase tracking-widest">
            {equipo.numeroEmpleado ?? equipo.email}
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (equipo) => (
        <span className="text-xs font-semibold text-ui-600">
          {equipo.roles.join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'area',
      header: 'Área',
      render: (equipo) => (
        <span className="text-xs font-semibold text-ui-600">
          {equipo.torre ? (TORRE_LABELS[equipo.torre] ?? equipo.torre) : '—'}
        </span>
      ),
    },
    {
      key: 'trabajadores',
      header: 'Trabajadores',
      render: (equipo) => (
        <span className="font-black text-ui-900">{equipo.subordinados.length}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (equipo) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="info"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEquipo(equipo);
              setVerOpen(true);
            }}
          >
            Ver equipo
          </Button>
          {puedeEditar && (
            <Button
              variant="success"
              size="sm"
              icon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEquipo(equipo);
                setVerOpen(false);
                setTrabajadorElegido('');
                setAssignOpen(true);
              }}
            >
              Asignar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Equipos"
        subtitle="Residentes y sus trabajadores — el alcance de /reportes se recalcula solo."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<UsersRound className="w-6 h-6" />}
          value={`${data.equipos.length} residentes`}
          label="Residentes con Equipo"
          color="info"
          loading={initialLoading}
        />
        <StatsCard
          icon={<UserPlus className="w-6 h-6" />}
          value={`${data.sinJefe.length} sin jefe`}
          label="Sin Asignar"
          color="neutral"
          loading={initialLoading}
        />
        <StatsCard
          icon={<UserMinus className="w-6 h-6" />}
          value={`${totalAsignaciones} enlazados`}
          label="Total Asignaciones"
          color="neutral"
          loading={initialLoading}
        />
      </div>

      <div className="space-y-3">
        <div className="relative">
          <RefreshOverlay show={refreshing && !initialLoading} />
          <DataTable
            columns={columns}
            data={data.equipos}
            loading={initialLoading}
            keyExtractor={(equipo) => equipo.usuarioId}
            emptyText="No hay residentes con equipo todavía — al dar de alta un residente aparece aquí."
            maxBodyHeight="500px"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      {/* Ver equipo (solo lectura con acciones por trabajador) */}
      <Modal open={verOpen} onClose={() => setVerOpen(false)} size="lg">
        <ModalHeader
          title={`Equipo de ${selectedEquipo?.nombre ?? 'residente'}`}
          subtitle={`${selectedEquipo?.subordinados.length ?? 0} trabajador(es) — alcance de /reportes`}
          onClose={() => setVerOpen(false)}
        />
        <ModalBody>
          {!selectedEquipo || selectedEquipo.subordinados.length === 0 ? (
            <p className="text-sm text-ui-500 text-center py-6">
              Equipo vacío — usa el botón «Asignar» de la tabla.
            </p>
          ) : (
            <div>
              {selectedEquipo.subordinados.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-ui-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ui-800 truncate">{m.nombre ?? m.email}</p>
                    <p className="text-[10px] font-semibold text-ui-400">
                      {m.roles.join(', ') || 'Sin rol'}
                      {m.numeroEmpleado ? ` · ${m.numeroEmpleado}` : ''}
                    </p>
                  </div>
                  {puedeEditar && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<RefreshCw className="w-3 h-3" />}
                        onClick={() => {
                          setSelectedMiembro(m);
                          setVerOpen(false);
                          setJefeElegido('');
                          setReassignOpen(true);
                        }}
                      >
                        Reasignar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<UserMinus className="w-3 h-3" />}
                        onClick={() => {
                          setSelectedMiembro(m);
                          setVerOpen(false);
                          setRemoveOpen(true);
                        }}
                      >
                        Quitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setVerOpen(false)}>Cerrar</Button>
        </ModalFooter>
      </Modal>

      {/* Asignar trabajador (elige de los candidatos sin jefe) */}
      <FormModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onCancel={() => setAssignOpen(false)}
        title="Asignar trabajador"
        subtitle={`Al equipo de ${selectedEquipo?.nombre ?? 'residente'}`}
        submitLabel="Asignar"
        cancelLabel="Cancelar"
        onSubmit={handleAsignar}
        isSubmitting={submitting}
      >
        {data.sinJefe.length === 0 ? (
          <p className="text-sm text-ui-500 text-center py-4">
            No hay usuarios sin jefe — todos ya tienen equipo asignado.
          </p>
        ) : (
          <ModalField label="Trabajador (sin jefe)" required>
            <select
              className={modalSelectClass}
              value={trabajadorElegido}
              onChange={(e) => setTrabajadorElegido(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {data.sinJefe.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre ?? m.email} · {m.roles.join(', ') || 'Sin rol'}
                </option>
              ))}
            </select>
          </ModalField>
        )}
      </FormModal>

      {/* Re-asignar trabajador */}
      <FormModal
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        onCancel={() => setReassignOpen(false)}
        title="Re-asignar trabajador"
        subtitle={
          selectedMiembro
            ? `${selectedMiembro.nombre ?? selectedMiembro.email} — hoy en el equipo de ${selectedEquipo?.nombre ?? '—'}`
            : undefined
        }
        submitLabel="Re-asignar"
        cancelLabel="Cancelar"
        onSubmit={handleReasignar}
        isSubmitting={submitting}
      >
        <ModalField label="Nuevo residente" required>
          <select
            className={modalSelectClass}
            value={jefeElegido}
            onChange={(e) => setJefeElegido(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {data.equipos
              .filter((e) => e.usuarioId !== selectedEquipo?.usuarioId)
              .map((e) => (
                <option key={e.usuarioId} value={e.usuarioId}>{e.nombre ?? e.email}</option>
              ))}
          </select>
        </ModalField>
      </FormModal>

      {/* Quitar del equipo */}
      <FormModal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onCancel={() => setRemoveOpen(false)}
        title="Quitar del equipo"
        subtitle="Esta acción no se puede deshacer."
        submitLabel="Sí, Quitar"
        cancelLabel="Cancelar"
        onSubmit={handleQuitar}
        isSubmitting={submitting}
      >
        {selectedMiembro && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mb-4">
              <UserX className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-ui-700 mb-1">¿Quitar del equipo a?</p>
            <p className="font-black text-ui-900 text-lg mb-2">{selectedMiembro.nombre ?? selectedMiembro.email}</p>
            <p className="text-xs text-ui-500">
              Quedará sin jefe y solo verá sus propios reportes en /reportes.
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}
