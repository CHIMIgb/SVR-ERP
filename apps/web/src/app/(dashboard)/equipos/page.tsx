"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UsersRound, UserPlus, UserMinus, RefreshCw, UserX } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/Button';
import { FormModal, ModalField, modalSelectClass } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { RefreshOverlay } from '@/components/ui/RefreshOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/layout/Toast';
import { equiposApi, type EquipoDTO, type EquiposDTO, type MiembroEquipoDTO } from '@/lib/api';
import { mensajeErrorApi } from '@/lib/api';

export default function EquiposPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<EquiposDTO>({ equipos: [], sinJefe: [] });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  // ── Modales de acción ──
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedMiembro, setSelectedMiembro] = useState<MiembroEquipoDTO | null>(null);
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoDTO | null>(null);
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
    if (!selectedMiembro || !jefeElegido) return;
    const equipo = data.equipos.find((e) => e.usuarioId === jefeElegido);
    cambiarJefe(
      selectedMiembro.id,
      jefeElegido,
      `${selectedMiembro.nombre ?? 'El usuario'} asignado al equipo de ${equipo?.nombre ?? 'el jefe'}.`,
    ).then(() => setAssignOpen(false));
  }, [selectedMiembro, jefeElegido, data.equipos, cambiarJefe]);

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
      `${selectedMiembro.nombre ?? 'El usuario'} re-asignado al equipo de ${equipo?.nombre ?? 'el jefe'}.`,
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

  // ── Selects de jefe ──
  const opcionesJefe = (excluirUsuarioId?: string) =>
    data.equipos
      .filter((e) => e.usuarioId !== excluirUsuarioId)
      .map((e) => ({ value: e.usuarioId, label: `${e.nombre ?? e.email}${e.roles.length ? ` (${e.roles[0]})` : ''}` }));

  const MiembroRow = ({ m, equipo }: { m: MiembroEquipoDTO; equipo: EquipoDTO }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-ui-100 last:border-0">
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
              setSelectedEquipo(equipo);
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
              setRemoveOpen(true);
            }}
          >
            Quitar
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Equipos"
        subtitle="Residentes y sus trabajadores — el alcance de /reportes se recalcula solo."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          icon={<UsersRound className="w-6 h-6" />}
          value={`${data.equipos.length} jefes`}
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

      <div className="relative space-y-6">
        <RefreshOverlay show={refreshing && !initialLoading} />

        {initialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        ) : data.equipos.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="w-10 h-10" />}
            title="Sin equipos armados"
            subtitle="Asigna trabajadores a un residente desde la sección de abajo."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {data.equipos.map((equipo) => (
              <Card key={equipo.usuarioId}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-black text-ui-900 truncate">{equipo.nombre ?? equipo.email}</p>
                    <p className="text-[10px] font-bold text-ui-400 uppercase tracking-widest">
                      {equipo.roles.join(', ') || 'Sin rol'}
                      {equipo.numeroEmpleado ? ` · ${equipo.numeroEmpleado}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-black text-ui-500 shrink-0">
                    {equipo.subordinados.length}
                  </span>
                </div>
                {equipo.subordinados.length === 0 ? (
                  <p className="text-xs text-ui-500 py-3 text-center">Equipo vacío — asigna desde abajo.</p>
                ) : (
                  <div>
                    {equipo.subordinados.map((m) => (
                      <MiembroRow key={m.id} m={m} equipo={equipo} />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── Candidatos sin jefe ── */}
        {!initialLoading && data.sinJefe.length > 0 && (
          <Card>
            <p className="text-[10px] font-black text-ui-500 uppercase tracking-widest mb-3">
              Sin jefe asignado ({data.sinJefe.length})
            </p>
            <div>
              {data.sinJefe.map((m) => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-ui-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ui-800 truncate">{m.nombre ?? m.email}</p>
                    <p className="text-[10px] font-semibold text-ui-400">
                      {m.roles.join(', ') || 'Sin rol'}
                      {m.numeroEmpleado ? ` · ${m.numeroEmpleado}` : ''}
                    </p>
                  </div>
                  {puedeEditar && (
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        className="h-9 px-3 border border-ui-200 rounded-lg text-xs font-medium bg-surface text-ui-900 focus:outline-none focus:border-primary/50"
                        value=""
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const equipo = data.equipos.find((x) => x.usuarioId === e.target.value);
                          cambiarJefe(
                            m.id,
                            e.target.value,
                            `${m.nombre ?? 'El usuario'} asignado al equipo de ${equipo?.nombre ?? 'el jefe'}.`,
                          );
                        }}
                      >
                        <option value="">Asignar a...</option>
                        {opcionesJefe(m.id).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          MODALES
          ═══════════════════════════════════════════ */}

      <FormModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onCancel={() => setAssignOpen(false)}
        title="Asignar a un equipo"
        subtitle={selectedMiembro?.nombre ?? selectedMiembro?.email}
        submitLabel="Asignar"
        cancelLabel="Cancelar"
        onSubmit={handleAsignar}
        isSubmitting={submitting}
      >
        <ModalField label="Jefe / Residente" required>
          <select
            className={modalSelectClass}
            value={jefeElegido}
            onChange={(e) => setJefeElegido(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {opcionesJefe(selectedMiembro?.id).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </ModalField>
      </FormModal>

      <FormModal
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        onCancel={() => setReassignOpen(false)}
        title="Re-asignar de equipo"
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
        <ModalField label="Nuevo jefe / residente" required>
          <select
            className={modalSelectClass}
            value={jefeElegido}
            onChange={(e) => setJefeElegido(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {opcionesJefe(selectedMiembro?.id).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </ModalField>
      </FormModal>

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
