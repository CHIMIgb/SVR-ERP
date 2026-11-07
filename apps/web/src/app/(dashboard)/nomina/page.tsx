"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { nominaApi, type NominaRowDTO, type PeriodoNominaDTO, type RegistrarAjusteInput } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/formatters';
import RecibosNominaModal from '@/components/layout/RecibosNominaModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { FormModal, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';

const CATEGORIAS = [
  { id: 'Todos', label: 'Todos los puestos' },
  { id: 'Operador', label: 'Operadores' },
  { id: 'Chofer', label: 'Choferes' },
  { id: 'Mecanico', label: 'Mecánicos' },
  { id: 'Ingeniero', label: 'Ingenieros' },
  { id: 'Administrativo', label: 'Administración' },
] as const;

const TIPOS_AJUSTE: { value: RegistrarAjusteInput['tipo']; label: string }[] = [
  { value: 'Bono', label: 'Bono (se suma al efectivo)' },
  { value: 'Descuento', label: 'Descuento por falta o daño (se resta)' },
  { value: 'Prestamo', label: 'Cobro de préstamo o anticipo (se resta)' },
];

// Mismas reglas que RegistrarAjusteDto de la API (@Min(0.01) en monto, @MinLength(3) en concepto).
const MONTO_AJUSTE_MINIMO = 0.01;
const CONCEPTO_MINIMO = 3;
const CONCEPTO_MAXIMO = 200;

/** Lo que va en el sobre: el neto menos lo que ya se transfirió por SPEI (igual que calcula la API). */
function efectivoEnSobre(t: NominaRowDTO): number {
  return t.sueldoEfectivo + t.totalPercepciones - t.totalDeducciones;
}

/**
 * Campo de texto CSV: entre comillas, con comillas internas escapadas y sin fórmulas de Excel
 * (un nombre que empiece con = + - @ se ejecutaría como fórmula al abrir el archivo).
 */
function textoCsv(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}

const BOM_UTF8 = String.fromCharCode(0xfeff);

export default function NominaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const vista = user?.vistas?.find((v) => v.ruta === '/nomina');
  const puedeCrear = vista?.puedeCrear ?? false;
  const puedeEditar = vista?.puedeEditar ?? false;
  const puedeExportar = vista?.puedeExportar ?? false;

  const [periodo, setPeriodo] = useState<PeriodoNominaDTO | null>(null);
  const [items, setItems] = useState<NominaRowDTO[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [recargando, setRecargando] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Todos');
  const [isSyncing, setIsSyncing] = useState(false);

  const [recibosModalOpen, setRecibosModalOpen] = useState(false);
  const [reciboTrabajadorId, setReciboTrabajadorId] = useState<string | undefined>(undefined);

  // Acciones en curso (evitan doble clic: un pago se marcaría y desmarcaría).
  const [procesandoPagoId, setProcesandoPagoId] = useState<string | null>(null);
  const [confirmarPagarTodosOpen, setConfirmarPagarTodosOpen] = useState(false);
  const [pagandoTodos, setPagandoTodos] = useState(false);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedWorkerForAdjust, setSelectedWorkerForAdjust] = useState<NominaRowDTO | null>(null);
  const [adjustTipo, setAdjustTipo] = useState<RegistrarAjusteInput['tipo']>('Bono');
  const [adjustMonto, setAdjustMonto] = useState('500');
  const [adjustConcepto, setAdjustConcepto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Una sola acción que modifica la nómina a la vez: en paralelo se pisarían (sincronizar y pagar todos
  // devuelven la nómina completa y podrían deshacer en pantalla un pago que respondió antes). El ref cubre
  // dos clics en el mismo instante, antes de que los botones se deshabiliten.
  const accionEnCursoRef = useRef(false);
  const tomarCandado = () => {
    if (accionEnCursoRef.current) return false;
    accionEnCursoRef.current = true;
    return true;
  };
  const soltarCandado = () => {
    accionEnCursoRef.current = false;
  };
  const ocupado = isSyncing || pagandoTodos || procesandoPagoId !== null || submitting || recargando;

  /** Nunca lanza: la API puede devolver success:false o lanzar (sin red); ambos terminan en el aviso. */
  const fetchNomina = useCallback(async () => {
    try {
      const res = await nominaApi.actual();
      if (res.success) {
        setPeriodo(res.data.periodo);
        setItems(res.data.items);
        setErrorCarga(null);
      } else {
        setErrorCarga(res.error.message);
      }
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : 'No se pudo cargar la nómina.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await fetchNomina();
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [fetchNomina]);

  const reintentarCarga = async () => {
    if (!tomarCandado()) return;
    setRecargando(true);
    try {
      await fetchNomina();
    } finally {
      setRecargando(false);
      soltarCandado();
    }
  };

  const handleSincronizarAsistencia = async () => {
    if (!periodo || !tomarCandado()) return;
    setIsSyncing(true);
    try {
      const res = await nominaApi.sincronizarAsistencia(periodo.id);
      if (!res.success) throw new Error(res.error.message);
      setItems(res.data.items);
      const { totalOmisionesPendientes: pendientesOmision, totalOmisionesVencidas: vencidas, nominasPagadasSinCambio: pagadas } = res.data;
      const avisos = [
        vencidas > 0 &&
          `${vencidas} de las faltas son omisiones sin resolver: si alguna se justifica, resuélvela en Asistencia y vuelve a sincronizar.`,
        pendientesOmision > 0 && `Quedan ${pendientesOmision} omisión(es) de hoy por resolver; no se descontaron.`,
        pagadas > 0 && `${pagadas} nómina(s) ya pagada(s) no se modificaron.`,
      ].filter(Boolean);
      showToast(
        `Asistencia sincronizada: se importaron ${res.data.totalHorasExtraSincronizadas} h extra y ${res.data.totalFaltasAplicadas} falta(s).` +
          (avisos.length > 0 ? ` ${avisos.join(' ')}` : ''),
        avisos.length > 0 ? 'warning' : 'success',
      );
      addNotification({
        titulo: 'Nómina Sincronizada con Asistencia',
        mensaje: `Se actualizaron las horas extras y deducciones de ${periodo.nombre} desde el módulo satelital.`,
        tipo: 'info',
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo sincronizar con asistencia.', 'error');
    } finally {
      setIsSyncing(false);
      soltarCandado();
    }
  };

  const filtered = items.filter((i) => {
    const texto = search.toLowerCase();
    const matchSearch = i.trabajadorNombre.toLowerCase().includes(texto) || i.puesto.toLowerCase().includes(texto);
    if (!matchSearch) return false;
    if (selectedRole !== 'Todos' && i.categoriaPuesto !== selectedRole) return false;
    return true;
  });

  const totalFiscal = items.reduce((a, i) => a + i.sueldoFiscal, 0);
  const totalSobres = items.reduce((a, i) => a + efectivoEnSobre(i), 0);
  const totalPercepciones = items.reduce((a, i) => a + i.totalPercepciones, 0);
  const totalDescs = items.reduce((a, i) => a + i.totalDeducciones, 0);
  const totalNeto = items.reduce((a, i) => a + i.totalNeto, 0);
  const pendientes = items.filter((i) => i.estado !== 'Pagado');
  const pagadosCount = items.length - pendientes.length;
  const montoPendiente = pendientes.reduce((a, i) => a + i.totalNeto, 0);
  const datosCargados = !errorCarga || items.length > 0;

  const togglePagado = async (item: NominaRowDTO) => {
    if (!tomarCandado()) return;
    const nuevoEstado = item.estado === 'Pagado' ? 'Pendiente' : 'Pagado';
    setProcesandoPagoId(item.id);
    try {
      const res = await nominaApi.actualizarEstado(item.id, nuevoEstado);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)));
      showToast(
        nuevoEstado === 'Pagado' ? `Pago de ${item.trabajadorNombre} confirmado.` : `Pago de ${item.trabajadorNombre} marcado como pendiente.`,
        nuevoEstado === 'Pagado' ? 'success' : 'warning',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo actualizar el pago.', 'error');
    } finally {
      setProcesandoPagoId(null);
      soltarCandado();
    }
  };

  const handleMarcarTodosPagados = async () => {
    if (!periodo || !tomarCandado()) return;
    setPagandoTodos(true);
    try {
      const res = await nominaApi.pagarTodos(periodo.id);
      if (!res.success) throw new Error(res.error.message);
      setItems(res.data.items);
      setConfirmarPagarTodosOpen(false);
      showToast(`Toda la nómina de ${periodo.nombre} quedó marcada como pagada.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo marcar la nómina como pagada.', 'error');
    } finally {
      setPagandoTodos(false);
      soltarCandado();
    }
  };

  const handleOpenAdjust = (item: NominaRowDTO) => {
    if (ocupado) return;
    setSelectedWorkerForAdjust(item);
    setAdjustTipo('Bono');
    setAdjustMonto('500');
    setAdjustConcepto('');
    setAdjustModalOpen(true);
  };

  const handleApplyAdjust = async () => {
    if (!selectedWorkerForAdjust || submitting) return;
    // Centavos: se redondea a 2 decimales para que lo enviado sea lo mismo que se muestra.
    const monto = Math.round(Number(adjustMonto) * 100) / 100;
    if (adjustMonto.trim() === '' || !Number.isFinite(monto) || monto < MONTO_AJUSTE_MINIMO) {
      showToast(`Indica un monto de al menos ${formatCurrency(MONTO_AJUSTE_MINIMO)}.`, 'error');
      return;
    }
    if (adjustConcepto.trim().length < CONCEPTO_MINIMO) {
      showToast(`Describe el concepto del ajuste (mínimo ${CONCEPTO_MINIMO} caracteres).`, 'error');
      return;
    }
    if (!tomarCandado()) return;
    setSubmitting(true);
    try {
      const res = await nominaApi.registrarAjuste(selectedWorkerForAdjust.id, {
        tipo: adjustTipo,
        monto,
        concepto: adjustConcepto.trim(),
      });
      if (!res.success) throw new Error(res.error.message);
      setItems((prev) => prev.map((i) => (i.id === res.data.id ? res.data : i)));
      setAdjustModalOpen(false);
      showToast(`Ajuste de ${formatCurrency(monto)} aplicado a ${selectedWorkerForAdjust.trabajadorNombre}.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo aplicar el ajuste.', 'error');
    } finally {
      setSubmitting(false);
      soltarCandado();
    }
  };

  /**
   * Exporta la dispersión por SPEI con los datos reales que tiene el sistema. El sistema aún no guarda la
   * CLABE de los trabajadores ni la cuenta de origen: esas columnas van vacías para llenarse antes de subir
   * el archivo al banco (antes se llenaban con cuentas de ejemplo, que no son reales).
   */
  const handleExportarDispersion = () => {
    if (!periodo) return;
    const conTransferencia = items.filter((i) => i.sueldoFiscal > 0);
    if (conTransferencia.length === 0) {
      showToast('No hay trabajadores con sueldo por transferencia en este periodo.', 'warning');
      return;
    }
    try {
      const concepto = `Nomina SVR ${periodo.codigo}`;
      const encabezado = ['Nombre_Beneficiario', 'Puesto', 'Monto', 'Concepto', 'Cuenta_CLABE'].map(textoCsv).join(',');
      // El monto va sin comillas: algunos importadores bancarios no aceptan números entrecomillados.
      const filas = conTransferencia.map((i) =>
        [textoCsv(i.trabajadorNombre), textoCsv(i.puesto), i.sueldoFiscal.toFixed(2), textoCsv(concepto), textoCsv('')].join(','),
      );
      // BOM para que Excel abra bien los acentos.
      const blob = new Blob([BOM_UTF8, [encabezado, ...filas].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dispersion_SPEI_${periodo.codigo}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Se libera después: revocar en el mismo instante puede cancelar la descarga en Safari y Firefox.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast(
        `Archivo generado (${conTransferencia.length} trabajadores); revisa tu carpeta de descargas. El sistema aún no tiene sus CLABE: llénalas antes de subirlo al banco.`,
        'warning',
      );
    } catch (error) {
      showToast(`No se pudo generar el archivo: ${error instanceof Error ? error.message : 'error desconocido'}.`, 'error');
    }
  };

  const abrirRecibos = (trabajadorId?: string) => {
    setReciboTrabajadorId(trabajadorId);
    setRecibosModalOpen(true);
  };

  const columns: Column<NominaRowDTO>[] = [
    {
      key: 'trabajador',
      header: 'Trabajador',
      render: (item) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-ui-100 text-ui-700 flex items-center justify-center text-[11px] font-bold shrink-0">
            {item.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ui-900 truncate">{item.trabajadorNombre}</p>
            <p className="text-xs text-ui-500 truncate">{item.puesto}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'esquema',
      header: 'Esquema',
      className: 'hidden 2xl:table-cell',
      render: (item) => <Badge variant="neutral" size="sm">{item.metodoPago}</Badge>,
    },
    {
      key: 'fiscal',
      header: 'SPEI',
      align: 'right',
      className: 'hidden xl:table-cell',
      render: (item) => <span className="text-sm text-ui-700 tabular-nums">{formatCurrency(item.sueldoFiscal)}</span>,
    },
    {
      key: 'efectivo',
      header: 'Efectivo',
      align: 'right',
      className: 'hidden xl:table-cell',
      render: (item) =>
        item.sueldoEfectivo > 0
          ? <span className="text-sm text-ui-700 tabular-nums">{formatCurrency(item.sueldoEfectivo)}</span>
          : <span className="text-ui-500">—</span>,
    },
    {
      key: 'percepciones',
      header: 'Percepciones',
      align: 'right',
      className: 'hidden min-[1400px]:table-cell',
      render: (item) =>
        item.totalPercepciones > 0 ? (
          <div>
            <p className="text-sm text-green-700 dark:text-green-400 tabular-nums">+{formatCurrency(item.totalPercepciones)}</p>
            {item.horasExtra > 0 && <p className="text-xs text-ui-500">{item.horasExtra} h extra</p>}
          </div>
        ) : (
          <span className="text-ui-500">—</span>
        ),
    },
    {
      key: 'deducciones',
      header: 'Deducciones',
      align: 'right',
      className: 'hidden min-[1400px]:table-cell',
      render: (item) => {
        if (item.totalDeducciones <= 0) return <span className="text-ui-500">—</span>;
        const conceptos = item.deducciones.map((d) => d.concepto).join(', ');
        return (
          <div className="flex flex-col items-end">
            <p className="text-sm text-red-600 dark:text-red-400 tabular-nums">−{formatCurrency(item.totalDeducciones)}</p>
            <Tooltip content={conceptos}>
              <span className="block text-xs text-ui-500 truncate max-w-[140px]">{conceptos}</span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      key: 'neto',
      header: 'Neto',
      align: 'right',
      render: (item) => <span className="text-sm font-semibold text-ui-900 tabular-nums">{formatCurrency(item.totalNeto)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => <Badge variant={item.estado === 'Pagado' ? 'success' : 'warning'} size="sm">{item.estado}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (item) => (
        // Los clics de estos botones no deben abrir el recibo de la fila.
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {puedeCrear && (
            <Button variant="ghost" size="sm" disabled={ocupado} onClick={() => handleOpenAdjust(item)}>
              Ajuste
            </Button>
          )}
          {puedeEditar && (
            <Button
              variant="ghost"
              size="sm"
              loading={procesandoPagoId === item.id}
              disabled={ocupado}
              title={item.estado === 'Pagado' ? 'Regresar este pago a pendiente' : 'Marcar este pago como hecho'}
              onClick={() => togglePagado(item)}
            >
              {item.estado === 'Pagado' ? 'Revertir' : 'Marcar pagado'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nómina"
        subtitle={periodo
          ? periodo.nombre.replace(':', ' ·')
          : initialLoading ? 'Cargando periodo…' : errorCarga ? 'Periodo no disponible' : 'Sin periodo de nómina'}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {puedeEditar && (
              <Button onClick={handleSincronizarAsistencia} loading={isSyncing} disabled={!periodo || ocupado} className="w-full sm:w-auto">
                {isSyncing ? 'Sincronizando…' : 'Sincronizar asistencia'}
              </Button>
            )}
            <Button variant="outline" onClick={() => abrirRecibos()} disabled={items.length === 0 || !periodo}>
              Sobres con firma
            </Button>
            {puedeExportar && (
              <Button variant="ghost" onClick={handleExportarDispersion} disabled={items.length === 0 || !periodo || !!errorCarga}>
                Exportar SPEI
              </Button>
            )}
          </div>
        }
      />

      {errorCarga && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
        >
          <div className="text-sm text-red-700 dark:text-red-300 min-w-0">
            <p className="font-semibold">No se pudo cargar la nómina.</p>
            <p className="mt-0.5 text-xs break-words">{errorCarga}</p>
            {items.length > 0 && (
              <p className="mt-0.5 text-xs">Se muestran los datos de la última carga correcta; exportar y pagar todos quedan desactivados.</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={reintentarCarga} disabled={recargando || initialLoading} className="shrink-0">
            {recargando ? 'Reintentando…' : 'Reintentar'}
          </Button>
        </div>
      )}

      {!initialLoading && !errorCarga && !periodo && (
        <p className="px-4 py-3 rounded-xl border border-ui-200 bg-surface text-sm text-ui-600">
          La API no devolvió un periodo de nómina para esta semana, así que no hay nada que sincronizar ni pagar todavía.
        </p>
      )}

      {initialLoading ? (
        <LoadingState text="Cargando nómina..." size="lg" />
      ) : (
        <>
          {/* Indicadores: una sola tira con divisiones de 1px */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
            <StatsCard
              className="rounded-none border-0"
              label="Transferencia SPEI"
              value={datosCargados ? formatCurrency(totalFiscal) : '—'}
            />
            <StatsCard
              className="rounded-none border-0"
              label="Efectivo en sobres"
              value={datosCargados ? formatCurrency(totalSobres) : '—'}
            />
            <StatsCard
              className="rounded-none border-0"
              label="Total a pagar"
              value={datosCargados ? formatCurrency(totalNeto) : '—'}
              hint={datosCargados && (totalPercepciones > 0 || totalDescs > 0)
                ? `+${formatCurrency(totalPercepciones)} · −${formatCurrency(totalDescs)}`
                : undefined}
            />
            <StatsCard
              className="rounded-none border-0"
              label="Pagados"
              value={datosCargados ? `${pagadosCount} / ${items.length}` : '—'}
              hint={datosCargados && pendientes.length > 0 ? `${formatCurrency(montoPendiente)} pendiente` : undefined}
            />
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center gap-3">
            <div className="flex-1 min-w-0">
              <SearchBar value={search} onChange={setSearch} placeholder="Buscar empleado o puesto..." />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="sm:w-52">
                <Select
                  aria-label="Filtrar por puesto"
                  placeholder="Puesto"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  options={CATEGORIAS.map((c) => ({ value: c.id, label: c.label }))}
                />
              </div>
              {puedeEditar && pendientes.length > 0 && (
                <Button variant="outline" onClick={() => setConfirmarPagarTodosOpen(true)} disabled={!periodo || ocupado || !!errorCarga}>
                  Marcar todos como pagados
                </Button>
              )}
            </div>
          </div>

          <DataTable
            headerVariant="neutral"
            columns={columns}
            data={filtered}
            keyExtractor={(item) => item.id}
            maxBodyHeight="70vh"
            onRowClick={(item) => abrirRecibos(item.id)}
            emptyText={!datosCargados
              ? 'No se pudo cargar la nómina.'
              : items.length === 0
                ? 'No hay trabajadores en la nómina de este periodo.'
                : 'Sin trabajadores para los filtros seleccionados.'}
          />
          {filtered.length > 0 && (
            <p className="text-xs text-ui-500">Toca un trabajador para ver su recibo con el desglose completo.</p>
          )}
        </>
      )}

      {recibosModalOpen && (
        <RecibosNominaModal
          isOpen={recibosModalOpen}
          onClose={() => setRecibosModalOpen(false)}
          workersList={items}
          periodoLabel={periodo?.nombre ?? ''}
          periodoCodigo={periodo?.codigo ?? ''}
          trabajadorInicialId={reciboTrabajadorId}
        />
      )}

      {/* Confirmación: marcar toda la nómina como pagada */}
      <FormModal
        open={confirmarPagarTodosOpen}
        onClose={() => { if (!pagandoTodos) setConfirmarPagarTodosOpen(false); }}
        onSubmit={handleMarcarTodosPagados}
        title="Marcar todos como pagados"
        submitLabel={pagandoTodos ? 'Marcando…' : 'Sí, marcar como pagados'}
        isSubmitting={pagandoTodos}
      >
        <p className="text-sm text-ui-700">
          Se marcarán como pagados <span className="font-semibold text-ui-900">{pendientes.length} trabajadores</span> por{' '}
          <span className="font-semibold text-ui-900">{formatCurrency(montoPendiente)}</span>
          {periodo ? ` de ${periodo.nombre}` : ''}. Confirma solo si ya se hizo la transferencia y se entregaron los sobres.
        </p>
      </FormModal>

      {/* Ajuste de nómina (bono / descuento / préstamo) */}
      {selectedWorkerForAdjust && (
        <FormModal
          open={adjustModalOpen}
          onClose={() => { if (!submitting) setAdjustModalOpen(false); }}
          onSubmit={handleApplyAdjust}
          title="Ajuste de nómina"
          subtitle={selectedWorkerForAdjust.trabajadorNombre}
          submitLabel={submitting ? 'Aplicando…' : 'Aplicar ajuste'}
          isSubmitting={submitting}
        >
          <div className="space-y-4">
            {selectedWorkerForAdjust.estado === 'Pagado' && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Este pago ya está marcado como pagado: el ajuste cambia su neto.
              </p>
            )}
            <ModalField label="Tipo de ajuste">
              <select
                aria-label="Tipo de ajuste"
                className={modalSelectClass}
                value={adjustTipo}
                onChange={(e) => setAdjustTipo(e.target.value as RegistrarAjusteInput['tipo'])}
              >
                {TIPOS_AJUSTE.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </ModalField>

            <ModalField label="Monto (MXN)" required>
              <input
                type="number"
                min="0.01"
                step="0.01"
                aria-label="Monto del ajuste"
                className={modalInputClass}
                placeholder="500"
                value={adjustMonto}
                onChange={(e) => setAdjustMonto(e.target.value)}
              />
            </ModalField>

            <ModalField label="Concepto" required>
              <input
                type="text"
                aria-label="Concepto del ajuste"
                className={modalInputClass}
                placeholder="Ej: Bono por colado nocturno"
                maxLength={CONCEPTO_MAXIMO}
                value={adjustConcepto}
                onChange={(e) => setAdjustConcepto(e.target.value)}
              />
            </ModalField>
          </div>
        </FormModal>
      )}
    </div>
  );
}
