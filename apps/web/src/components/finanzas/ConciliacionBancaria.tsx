'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2, Landmark, Upload, Plus, CheckCircle2,
  Undo2,
} from 'lucide-react';
import { formatCurrency } from '@svr-erp/shared/utils/currency';
import { cn } from '@/lib/utils';
import {
  conciliacionApi,
  type BancoDTO,
  type CuentaBancariaDTO,
  type MovimientoBancarioDTO,
  type CandidataConciliacionDTO,
  type DescarteCsv,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/layout/Toast';

const PAGE_SIZE = 25;

/** Motivo breve para cada descarte CSV en toast warning (Blocker #3): las filas
 * que el backend no pudo leer se reportan al usuario siempre, jamás en silencio. */
const MOTIVO_CSV: Record<DescarteCsv['motivo'], string> = {
  FECHA_INVALIDA: 'fecha inválida',
  MONTO_INVALIDO: 'monto inválido',
  CAMPOS_FALTANTES: 'campos faltantes',
};

interface Props {
  puedeCrear: boolean;
  puedeEditar: boolean;
  onTotales?: (totales: ConciliacionTotales) => void;
}

/** Totales de los movimientos bancarios de la cuenta seleccionada. */
export interface ConciliacionTotales {
  cargado: number;
  conciliado: number;
  sinConciliar: number;
}

export function ConciliacionBancaria({ puedeCrear, puedeEditar, onTotales }: Props) {
  const { showToast } = useToast();

  // ── Selección banco → cuenta ──
  const [bancos, setBancos] = useState<BancoDTO[]>([]);
  const [bancoId, setBancoId] = useState('');
  const [cuentas, setCuentas] = useState<CuentaBancariaDTO[]>([]);
  const [cuentaId, setCuentaId] = useState('');
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);

  // ── Movimientos ──
  const [movimientos, setMovimientos] = useState<MovimientoBancarioDTO[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [soloNoConciliados, setSoloNoConciliados] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasLoaded = useRef(false);

  // ── Modales ──
  const [bancoOpen, setBancoOpen] = useState(false);
  const [cuentaOpen, setCuentaOpen] = useState(false);
  const [movimientoOpen, setMovimientoOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [conciliarOpen, setConciliarOpen] = useState(false);
  const [desconciliarOpen, setDesconciliarOpen] = useState(false);

  const [bancoForm, setBancoForm] = useState({ nombre: '' });
  const [cuentaForm, setCuentaForm] = useState({ numero: '', nombre: '', saldoInicial: '' });
  const [movimientoForm, setMovimientoForm] = useState({ fecha: '', descripcion: '', deposito: '', retiro: '' });
  const [csvText, setCsvText] = useState('');
  const [candidatas, setCandidatas] = useState<CandidataConciliacionDTO[]>([]);
  const [candidataSel, setCandidataSel] = useState('');
  const [movimientoSel, setMovimientoSel] = useState<MovimientoBancarioDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

// ── Cargar bancos (una vez) ──
  const loadBancos = useCallback(async () => {
    try {
      const res = await conciliacionApi.bancos();
      if (res.success) {
        setBancos(res.data);
        if (res.data.length === 1) setBancoId(res.data[0].id);
      }
    } catch {
      /* sin conexión */
    } finally {
      setLoadingCatalogo(false);
    }
  }, []);

  useEffect(() => {
    const inicial = async () => {
      try {
        await loadBancos();
      } catch {
        /* sin conexión */
      }
    };
    inicial();
  }, [loadBancos]);

  // ── Cargar cuentas al cambiar banco ──
  const loadCuentas = useCallback(async (banco: string) => {
    if (!banco) {
      setCuentas([]);
      setCuentaId('');
      return;
    }
    const res = await conciliacionApi.cuentas(banco);
    if (res.success) {
      setCuentas(res.data);
      setCuentaId('');
    }
  }, []);

  useEffect(() => {
    const inicial = async () => {
      try {
        await loadCuentas(bancoId);
      } catch {
        /* manejo delegado */
      }
    };
    inicial();
  }, [bancoId, loadCuentas]);

  // ── Cargar movimientos ──
  const fetchMovimientos = useCallback(
    async (p = 1, soloNc: boolean, cuenta: string) => {
      if (!cuenta) {
        setMovimientos([]);
        return;
      }
      setLoading(true);
      try {
        const res = await conciliacionApi.movimientos(cuenta, {
          soloNoConciliados: soloNc,
          page: p,
          limit: PAGE_SIZE,
        });
        if (res.success) {
          setMovimientos(res.data.items);
          setPagination(res.data.pagination);
        } else {
          showToast(res.error?.message || 'Error al cargar movimientos.', 'error');
        }
      } catch {
        showToast('No se pudo conectar con el servidor.', 'error');
      } finally {
        hasLoaded.current = true;
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    const inicial = async () => {
      try {
        await fetchMovimientos(page, soloNoConciliados, cuentaId);
      } catch {
        /* manejo delegado */
      }
    };
    inicial();
  }, [page, soloNoConciliados, cuentaId, fetchMovimientos]);

  const refetch = useCallback(
    () => fetchMovimientos(page, soloNoConciliados, cuentaId),
    [fetchMovimientos, page, soloNoConciliados, cuentaId],
  );

  // ── Totales para StatsCards ──
  const totalCargado = movimientos.reduce((sum, m) => sum + (m.deposito ?? 0) - (m.retiro ?? 0), 0);
  const totalConciliado = movimientos.reduce(
    (sum, m) => sum + (m.conciliado ? (m.deposito ?? 0) - (m.retiro ?? 0) : 0),
    0,
  );

  // Notifica totales al padre (las KPIs viven en la vista /finanzas).
  useEffect(() => {
    onTotales?.({ cargado: totalCargado, conciliado: totalConciliado, sinConciliar: totalCargado - totalConciliado });
  }, [totalCargado, totalConciliado, onTotales]);

  // ── Alta banco ──
  const handleCrearBanco = useCallback(async () => {
    if (!bancoForm.nombre.trim()) return;
    setSubmitting(true);
    try {
      const res = await conciliacionApi.crearBanco({ nombre: bancoForm.nombre.trim() });
      if (res.success) {
        setBancos((prev) => [...prev, res.data!]);
        setBancoId(res.data.id);
        setBancoForm({ nombre: '' });
        setBancoOpen(false);
        showToast('Banco creado.', 'success');
      } else {
        showToast(res.error?.message || 'Error al crear banco.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [bancoForm, showToast]);

  // ── Alta cuenta ──
  const handleCrearCuenta = useCallback(async () => {
    if (!cuentaForm.numero.trim()) return;
    setSubmitting(true);
    try {
      const res = await conciliacionApi.crearCuenta(bancoId, {
        numero: cuentaForm.numero.trim(),
        nombre: cuentaForm.nombre.trim() || undefined,
        saldoInicial: cuentaForm.saldoInicial ? Number(cuentaForm.saldoInicial) : undefined,
      });
      if (res.success) {
        setCuentas((prev) => [...prev, res.data!]);
        setCuentaId(res.data.id);
        setCuentaForm({ numero: '', nombre: '', saldoInicial: '' });
        setCuentaOpen(false);
        showToast('Cuenta creada.', 'success');
      } else {
        showToast(res.error?.message || 'Error al crear cuenta.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [bancoId, cuentaForm, showToast]);

  // ── Alta movimiento ──
  const handleCrearMovimiento = useCallback(async () => {
    const deposito = movimientoForm.deposito ? Number(movimientoForm.deposito) : undefined;
    const retiro = movimientoForm.retiro ? Number(movimientoForm.retiro) : undefined;
    if (!movimientoForm.fecha || !movimientoForm.descripcion.trim()) return;
    setSubmitting(true);
    try {
      const res = await conciliacionApi.crearMovimiento(cuentaId, {
        fecha: movimientoForm.fecha,
        descripcion: movimientoForm.descripcion.trim(),
        deposito,
        retiro,
      });
      if (res.success) {
        setMovimientoForm({ fecha: '', descripcion: '', deposito: '', retiro: '' });
        setMovimientoOpen(false);
        showToast('Movimiento registrado.', 'success');
        refetch();
      } else {
        showToast(res.error?.message || 'Error al registrar movimiento.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [cuentaId, movimientoForm, showToast, refetch]);

  // ── Carga CSV ──
  const handleCargarCsv = useCallback(async () => {
    if (!csvText.trim()) return;
    setSubmitting(true);
    try {
      const res = await conciliacionApi.cargarLote(cuentaId, csvText);
      if (res.success) {
        showToast(
          `Se cargaron ${res.data.insertados} movimientos (${res.data.duplicados} duplicados omitidos).`,
          'success',
        );
        // Blocker #3: las filas que el backend NO pudo leer no deben perderse en
        // silencio — se avisan en un toast warning con línea + motivo de cada una.
        const descartadas = res.data.descartadas ?? [];
        if (descartadas.length > 0) {
          showToast(
            `${descartadas.length} fila(s) no cargada(s): ${descartadas
              .map((d) => `línea ${d.linea} (${MOTIVO_CSV[d.motivo]})`)
              .join(', ')}.`,
            'warning',
          );
        }
        setCsvText('');
        setCsvOpen(false);
        refetch();
      } else {
        showToast(res.error?.message || 'Error al cargar CSV.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [cuentaId, csvText, showToast, refetch]);

  // ── Abrir modal de conciliación: cargar candidatas ──
  const openConciliar = useCallback(async (mov: MovimientoBancarioDTO) => {
    setMovimientoSel(mov);
    setCandidataSel('');
    setCandidatas([]);
    setConciliarOpen(true);
    const res = await conciliacionApi.candidatas(mov.id);
    if (res.success) {
      setCandidatas(res.data);
    } else {
      showToast(res.error?.message || 'No se pudieron cargar candidatas.', 'error');
    }
  }, [showToast]);

  // ── Confirmar conciliación ──
  const handleConciliar = useCallback(async () => {
    if (!movimientoSel || !candidataSel) return;
    setSubmitting(true);
    try {
      const res = await conciliacionApi.conciliar(movimientoSel.id, candidataSel);
      if (res.success) {
        showToast('Movimiento conciliado.', 'success');
        setConciliarOpen(false);
        refetch();
      } else {
        showToast(res.error?.message || 'Error al conciliar.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [movimientoSel, candidataSel, showToast, refetch]);

  // ── Desconciliar ──
  const handleDesconciliar = useCallback(async () => {
    if (!movimientoSel) return;
    setSubmitting(true);
    try {
      const res = await conciliacionApi.desconciliar(movimientoSel.id);
      if (res.success) {
        showToast('Movimiento desconciliado.', 'success');
        setDesconciliarOpen(false);
        refetch();
      } else {
        showToast(res.error?.message || 'Error al desconciliar.', 'error');
      }
    } catch {
      showToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [movimientoSel, showToast, refetch]);

  const seleccionarCuenta = (id: string) => {
    setCuentaId(id);
    setPage(1);
  };

  const cambiarBanco = (id: string) => {
    setBancoId(id);
    setPage(1);
  };

  // ── Columnas de la tabla (patrón DataTable de las vistas CRUD) ──
  const movimientoColumns: Column<MovimientoBancarioDTO>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      nowrap: true,
      render: (m) => <span className="text-slate-600">{m.fecha}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      nowrap: true,
      render: (m) => (
        <span className="block max-w-[220px] truncate font-medium text-slate-800" title={m.descripcion}>
          {m.descripcion}
        </span>
      ),
    },
    {
      key: 'deposito',
      header: 'Depósito',
      align: 'right',
      nowrap: true,
      render: (m) => (
        <span className="font-semibold text-emerald-600">{m.deposito != null ? formatCurrency(m.deposito) : '—'}</span>
      ),
    },
    {
      key: 'retiro',
      header: 'Retiro',
      align: 'right',
      nowrap: true,
      render: (m) => (
        <span className="font-semibold text-rose-600">{m.retiro != null ? formatCurrency(m.retiro) : '—'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (m) => (
        <Badge variant={m.conciliado ? 'success' : 'warning'}>
          {m.conciliado ? 'Conciliado' : 'Pendiente'}
        </Badge>
      ),
    },
    {
      key: 'accion',
      header: 'Acción',
      align: 'right',
      render: (m) =>
        m.conciliado ? (
          puedeEditar ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Undo2 className="w-3.5 h-3.5" />}
              onClick={() => { setMovimientoSel(m); setDesconciliarOpen(true); }}
            >
              Desconciliar
            </Button>
          ) : null
        ) : puedeEditar ? (
          <Button
            variant="success"
            size="sm"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => openConciliar(m)}
          >
            Conciliar
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Selector banco → cuenta */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Banco</label>
            <select
              value={bancoId}
              onChange={(e) => cambiarBanco(e.target.value)}
              className={cn(modalSelectClass, 'mt-1 w-full')}
              disabled={loadingCatalogo}
            >
              <option value="">{loadingCatalogo ? 'Cargando...' : 'Selecciona un banco'}</option>
              {bancos.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cuenta</label>
            <select
              value={cuentaId}
              onChange={(e) => seleccionarCuenta(e.target.value)}
              className={cn(modalSelectClass, 'mt-1 w-full')}
              disabled={!bancoId}
            >
              <option value="">{bancoId ? 'Selecciona una cuenta' : 'Elige banco primero'}</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre ? `${c.nombre} · ` : ''}{c.numero}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            {puedeCrear && (
              <>
                <Button variant="outline" size="md" icon={<Landmark className="w-4 h-4" />} onClick={() => setBancoOpen(true)}>
                  <span className="hidden sm:inline">Banco</span>
                </Button>
                <Button variant="outline" size="md" icon={<Building2 className="w-4 h-4" />} onClick={() => { if (bancoId) setCuentaOpen(true); }} disabled={!bancoId}>
                  <span className="hidden sm:inline">Cuenta</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {cuentaId ? (
        <>
          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {puedeCrear && (
                <>
                  <Button variant="outline" size="md" icon={<Upload className="w-4 h-4" />} onClick={() => setCsvOpen(true)}>
                    Cargar CSV
                  </Button>
                  <Button variant="outline" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => {
                    setMovimientoForm({ fecha: '', descripcion: '', deposito: '', retiro: '' });
                    setMovimientoOpen(true);
                  }}>
                    Movimiento
                  </Button>
                </>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloNoConciliados}
                onChange={(e) => { setSoloNoConciliados(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/50"
              />
              Solo sin conciliar
            </label>
          </div>

          {/* Tabla */}
          <div className="card overflow-hidden">
            <DataTable
              columns={movimientoColumns}
              data={movimientos}
              keyExtractor={(m) => m.id}
              loading={loading && movimientos.length === 0}
              emptyText="Sin movimientos. Carga un CSV del estado de cuenta o registra un movimiento manual."
              maxBodyHeight="500px"
            />
            {pagination.totalPages > 1 && (
              <div className="border-t border-slate-100 px-4 py-3">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  totalRecords={pagination.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card py-10">
          <EmptyState
            icon={<Building2 className="w-8 h-8" />}
            title="Selecciona una cuenta bancaria"
            subtitle="La conciliación se hace por cuenta: carga el estado de cuenta y empareja contra las transacciones del ERP."
          />
        </div>
      )}

      {/* Modal: nuevo banco */}
      <FormModal
        open={bancoOpen}
        onClose={() => setBancoOpen(false)}
        onCancel={() => setBancoOpen(false)}
        title="Nuevo Banco"
        subtitle="Alta del catálogo de bancos."
        submitLabel="Guardar"
        onSubmit={handleCrearBanco}
        isSubmitting={submitting}
      >
        <div className="space-y-3">
          <ModalField label="Nombre del banco" required>
            <input
              className={modalInputClass}
              value={bancoForm.nombre}
              onChange={(e) => setBancoForm({ nombre: e.target.value })}
              placeholder="Ej. BBVA"
            />
          </ModalField>
        </div>
      </FormModal>

      {/* Modal: nueva cuenta */}
      <FormModal
        open={cuentaOpen}
        onClose={() => setCuentaOpen(false)}
        onCancel={() => setCuentaOpen(false)}
        title="Nueva Cuenta Bancaria"
        subtitle={`Cuenta del banco ${bancos.find((b) => b.id === bancoId)?.nombre ?? ''}.`}
        submitLabel="Guardar"
        onSubmit={handleCrearCuenta}
        isSubmitting={submitting}
      >
        <div className="space-y-3">
          <ModalField label="Número de cuenta" required>
            <input
              className={modalInputClass}
              value={cuentaForm.numero}
              onChange={(e) => setCuentaForm({ ...cuentaForm, numero: e.target.value })}
              placeholder="0123456789"
            />
          </ModalField>
          <ModalField label="Nombre / alias">
            <input
              className={modalInputClass}
              value={cuentaForm.nombre}
              onChange={(e) => setCuentaForm({ ...cuentaForm, nombre: e.target.value })}
              placeholder="Ej. Cuenta operativa"
            />
          </ModalField>
          <ModalField label="Saldo inicial">
            <input
              type="number"
              min="0"
              step="0.01"
              className={modalInputClass}
              value={cuentaForm.saldoInicial}
              onChange={(e) => setCuentaForm({ ...cuentaForm, saldoInicial: e.target.value })}
              placeholder="0.00"
            />
          </ModalField>
        </div>
      </FormModal>

      {/* Modal: nuevo movimiento */}
      <FormModal
        open={movimientoOpen}
        onClose={() => setMovimientoOpen(false)}
        onCancel={() => setMovimientoOpen(false)}
        title="Nuevo Movimiento"
        subtitle="Alta manual de un movimiento del estado de cuenta."
        submitLabel="Guardar"
        onSubmit={handleCrearMovimiento}
        isSubmitting={submitting}
      >
        <div className="space-y-3">
          <ModalField label="Fecha" required>
            <input
              type="date"
              className={modalInputClass}
              value={movimientoForm.fecha}
              onChange={(e) => setMovimientoForm({ ...movimientoForm, fecha: e.target.value })}
            />
          </ModalField>
          <ModalField label="Descripción" required>
            <input
              className={modalInputClass}
              value={movimientoForm.descripcion}
              onChange={(e) => setMovimientoForm({ ...movimientoForm, descripcion: e.target.value })}
              placeholder="Concepto del movimiento"
            />
          </ModalField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalField label="Depósito">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={modalInputClass}
                value={movimientoForm.deposito}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, deposito: e.target.value, retiro: '' })}
                placeholder="0.00"
              />
            </ModalField>
            <ModalField label="Retiro">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={modalInputClass}
                value={movimientoForm.retiro}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, retiro: e.target.value, deposito: '' })}
                placeholder="0.00"
              />
            </ModalField>
          </div>
        </div>
      </FormModal>

      {/* Modal: cargar CSV */}
      <FormModal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onCancel={() => setCsvOpen(false)}
        title="Cargar Estado de Cuenta"
        subtitle="Pega el CSV del banco. Formato: fecha,descripcion,deposito,retiro (separador , o ;)."
        submitLabel="Cargar"
        onSubmit={handleCargarCsv}
        isSubmitting={submitting}
      >
        <div className="space-y-3">
          <textarea
            className={cn(modalInputClass, 'min-h-[160px] font-mono text-xs')}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`fecha,descripcion,deposito,retiro\n2026-09-01,Depósito cliente,15000,\n2026-09-02,Combustible,,4000`}
          />
          <p className="text-xs text-slate-500">
            Las re-importaciones no duplican movimientos: se omiten los registros repetidos.
          </p>
        </div>
      </FormModal>

      {/* Modal: conciliar contra transacción */}
      <FormModal
        open={conciliarOpen}
        onClose={() => setConciliarOpen(false)}
        onCancel={() => setConciliarOpen(false)}
        title="Conciliar Movimiento"
        subtitle="Selecciona la transacción del ERP que corresponde a este movimiento."
        submitLabel="Conciliar"
        onSubmit={handleConciliar}
        isSubmitting={submitting}
        submitDisabled={!candidataSel}
      >
        {movimientoSel && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{movimientoSel.fecha} · {movimientoSel.descripcion}</span>
                <strong className={movimientoSel.deposito != null ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatCurrency(movimientoSel.deposito ?? movimientoSel.retiro ?? 0)}
                </strong>
              </div>
            </div>

            {candidatas.length === 0 ? (
              <EmptyState
                title="Sin candidatas"
                subtitle="No hay transacciones ±3 días con monto similar para emparejar."
              />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-none">
                {candidatas.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCandidataSel(c.id)}
                    className={cn(
                      'w-full text-left rounded-xl border p-3 text-sm transition-colors',
                      candidataSel === c.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 hover:border-primary/40',
                    )}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{c.descripcion}</p>
                        <p className="text-xs text-slate-500">
                          {c.codigo ?? '—'} · {c.categoria} · {c.fecha}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900">{formatCurrency(c.monto)}</p>
                        <Badge variant={c.tipo === 'INGRESO' ? 'success' : 'error'}>{c.tipo}</Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </FormModal>

      {/* Modal: desconciliar */}
      <FormModal
        open={desconciliarOpen}
        onClose={() => setDesconciliarOpen(false)}
        onCancel={() => setDesconciliarOpen(false)}
        title="Desconciliar Movimiento"
        subtitle="El movimiento volverá a quedar pendiente. Puedes volver a conciliarlo después."
        submitLabel="Sí, Desconciliar"
        cancelLabel="Cancelar"
        onSubmit={handleDesconciliar}
        isSubmitting={submitting}
      >
        {movimientoSel && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Undo2 className="w-7 h-7 text-amber-600" />
            </div>
            <p className="text-sm text-slate-700">
              <strong>{movimientoSel.descripcion}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {movimientoSel.fecha} · {formatCurrency(movimientoSel.deposito ?? movimientoSel.retiro ?? 0)}
            </p>
          </div>
        )}
      </FormModal>
    </div>
  );
}