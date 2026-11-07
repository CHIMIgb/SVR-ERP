"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  bitacorasRentaApi,
  type BitacoraRentaCreateInput,
  type BitacoraRentaDTO,
  type MaquinaTrabajadoresDTO,
  type TrabajadorDTO,
} from '@/lib/api';
import { APP_TIMEZONE, formatCurrency, formatFechaSolo } from '@/lib/formatters';
import { useToast } from '@/components/layout/Toast';
import {
  Modal, ModalHeader, ModalBody, ModalFooter, FormModal, ModalField, modalInputClass, modalSelectClass, modalTextareaClass,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';

export const ESTADO_COBRO_BADGE: Record<BitacoraRentaDTO['estadoCobro'], 'info' | 'success' | 'warning'> = {
  Facturado: 'info',
  'Listo para Facturar': 'success',
  'Pendiente Firma': 'warning',
};

const LIMITE_LISTA = 100;
// Mismas reglas que CreateBitacoraRentaDto de la API.
const HORA_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DOS_DECIMALES = /^\d+(\.\d{1,2})?$/;
const HORAS_MAXIMAS_DIA = 24;
const TEXTO_CORTO_MAX = 200;
const ACTIVIDAD_MIN = 3;
const ACTIVIDAD_MAX = 1000;
const RESIDENTE_MAX = 120;

function hoyLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

/** Número finito dentro de [min, max], o null. */
function leerNumero(valor: string, min: number, max = Number.MAX_SAFE_INTEGER): number | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

interface CapturaForm {
  cliente: string;
  obraUbicacion: string;
  maquinaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  horasEfectivas: string;
  horasExtras: string;
  tarifaHora: string;
  horometroInicial: string;
  horometroFinal: string;
  actividadRealizada: string;
  firmado: boolean;
  nombreResidente: string;
  cargoResidente: string;
}

type ErroresCaptura = Partial<Record<keyof CapturaForm, string>>;

function validarResidente(nombre: string, cargo: string): { nombreResidente?: string; cargoResidente?: string } {
  const e: { nombreResidente?: string; cargoResidente?: string } = {};
  if (nombre.trim().length < 2) e.nombreResidente = 'Escribe el nombre de quien firmó.';
  if (cargo.trim().length < 2) e.cargoResidente = 'Escribe su cargo.';
  return e;
}

function validarCaptura(f: CapturaForm): ErroresCaptura {
  const e: ErroresCaptura = {};
  if (f.cliente.trim().length < 2) e.cliente = 'Escribe el cliente.';
  if (f.obraUbicacion.trim().length < 2) e.obraUbicacion = 'Escribe la obra o el frente.';
  if (!f.maquinaId) e.maquinaId = 'Elige la máquina.';
  if (!f.fecha) e.fecha = 'Indica la fecha.';
  else if (f.fecha > hoyLocal()) e.fecha = 'No puede ser una fecha futura.';
  if (!HORA_HHMM.test(f.horaInicio)) e.horaInicio = 'Indica la hora.';
  if (!HORA_HHMM.test(f.horaFin)) e.horaFin = 'Indica la hora.';
  const efectivas = leerNumero(f.horasEfectivas, 0, HORAS_MAXIMAS_DIA);
  const extras = leerNumero(f.horasExtras || '0', 0, HORAS_MAXIMAS_DIA);
  if (efectivas === null) e.horasEfectivas = `De 0 a ${HORAS_MAXIMAS_DIA}.`;
  if (extras === null) e.horasExtras = `De 0 a ${HORAS_MAXIMAS_DIA}.`;
  if (efectivas !== null && extras !== null && efectivas + extras > HORAS_MAXIMAS_DIA) {
    e.horasExtras = `Con las efectivas no pueden pasar de ${HORAS_MAXIMAS_DIA} h.`;
  }
  if (leerNumero(f.tarifaHora, 0.01) === null || !DOS_DECIMALES.test(f.tarifaHora.trim())) {
    e.tarifaHora = 'Escribe la tarifa por hora, con hasta 2 decimales.';
  }
  const hIni = leerNumero(f.horometroInicial, 0);
  const hFin = leerNumero(f.horometroFinal, 0);
  if (hIni === null) e.horometroInicial = 'Escribe la lectura inicial.';
  if (hFin === null) e.horometroFinal = 'Escribe la lectura final.';
  else if (hIni !== null && hFin < hIni) e.horometroFinal = 'No puede ser menor que la inicial.';
  const actividad = f.actividadRealizada.trim();
  if (actividad.length < ACTIVIDAD_MIN) e.actividadRealizada = 'Describe el trabajo realizado.';
  if (f.firmado) Object.assign(e, validarResidente(f.nombreResidente, f.cargoResidente));
  return e;
}

interface BitacorasRentaModalProps {
  trabajador: TrabajadorDTO;
  /** null mientras no hay catálogo de máquinas (cargando o con error). */
  maquinas: MaquinaTrabajadoresDTO[] | null;
  catalogosCargando: boolean;
  errorCatalogos: string | null;
  onReintentarCatalogos: () => void;
  puedeCrear: boolean;
  /** Registrar firma y facturar (rrhh.trabajadores.editar). */
  puedeEditar: boolean;
  onClose: () => void;
  /** Se llama tras capturar, firmar o facturar, para refrescar la vista de atrás. */
  onCambio: () => void;
}

export default function BitacorasRentaModal({
  trabajador,
  maquinas,
  catalogosCargando,
  errorCatalogos,
  onReintentarCatalogos,
  puedeCrear,
  puedeEditar,
  onClose,
  onCambio,
}: BitacorasRentaModalProps) {
  const { showToast } = useToast();

  const [bitacoras, setBitacoras] = useState<BitacoraRentaDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // Una sola acción a la vez (capturar, firmar o facturar).
  const accionRef = useRef(false);
  const [enviando, setEnviando] = useState(false);

  const [capturaOpen, setCapturaOpen] = useState(false);
  const [form, setForm] = useState<CapturaForm | null>(null);
  const [errores, setErrores] = useState<ErroresCaptura>({});

  const [firmarTarget, setFirmarTarget] = useState<BitacoraRentaDTO | null>(null);
  const [firma, setFirma] = useState({ nombreResidente: '', cargoResidente: '' });
  const [erroresFirma, setErroresFirma] = useState<{ nombreResidente?: string; cargoResidente?: string }>({});

  const [facturarTarget, setFacturarTarget] = useState<BitacoraRentaDTO | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const res = await bitacorasRentaApi.listar({ trabajadorId: trabajador.id, limit: LIMITE_LISTA });
        if (!vigente) return;
        if (res.success) {
          setBitacoras(res.data.items);
          setTotal(res.data.pagination.total);
          setErrorCarga(null);
        } else {
          setErrorCarga(res.error.message);
        }
      } catch (error) {
        if (vigente) setErrorCarga(error instanceof Error ? error.message : 'No se pudieron cargar las bitácoras.');
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [trabajador.id, intento]);

  const recargar = () => {
    setCargando(true);
    setIntento((n) => n + 1);
  };

  const tomar = () => {
    if (accionRef.current) return false;
    accionRef.current = true;
    setEnviando(true);
    return true;
  };
  const soltar = () => {
    accionRef.current = false;
    setEnviando(false);
  };

  const suma = (estado: BitacoraRentaDTO['estadoCobro']) => {
    const filtradas = bitacoras.filter((b) => b.estadoCobro === estado);
    return { n: filtradas.length, monto: filtradas.reduce((s, b) => s + b.importeTotalRenta, 0) };
  };
  const listas = suma('Listo para Facturar');
  const pendientes = suma('Pendiente Firma');
  const facturadas = suma('Facturado');

  const abrirCaptura = () => {
    const maquinaInicial = maquinas?.some((m) => m.codigo === trabajador.maquinaAsignadaId) ? trabajador.maquinaAsignadaId ?? '' : '';
    setForm({
      cliente: trabajador.clienteRentaActual ?? '',
      obraUbicacion: '',
      maquinaId: maquinaInicial,
      fecha: hoyLocal(),
      horaInicio: '07:00',
      horaFin: '17:00',
      horasEfectivas: '',
      horasExtras: '0',
      tarifaHora: '',
      horometroInicial: '',
      horometroFinal: '',
      actividadRealizada: '',
      firmado: false,
      nombreResidente: '',
      cargoResidente: '',
    });
    setErrores({});
    setCapturaOpen(true);
  };

  const cambiar = <K extends keyof CapturaForm>(campo: K, valor: CapturaForm[K]) => {
    setForm((f) => (f ? { ...f, [campo]: valor } : f));
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  };

  const guardarCaptura = async () => {
    if (!form) return;
    const encontrados = validarCaptura(form);
    if (Object.values(encontrados).some(Boolean)) {
      setErrores(encontrados);
      showToast('Revisa los campos marcados.', 'error');
      return;
    }
    if (!tomar()) return;
    const payload: BitacoraRentaCreateInput = {
      trabajadorId: trabajador.id,
      maquinaId: form.maquinaId,
      fecha: form.fecha,
      cliente: form.cliente.trim(),
      obraUbicacion: form.obraUbicacion.trim(),
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      horasEfectivas: Number(form.horasEfectivas),
      horasExtras: Number(form.horasExtras || '0'),
      horometroInicial: Number(form.horometroInicial),
      horometroFinal: Number(form.horometroFinal),
      actividadRealizada: form.actividadRealizada.trim(),
      tarifaHoraRenta: Number(form.tarifaHora),
      firmado: form.firmado,
      ...(form.firmado && {
        nombreResidente: form.nombreResidente.trim(),
        cargoResidente: form.cargoResidente.trim(),
      }),
    };
    try {
      const res = await bitacorasRentaApi.crear(payload);
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setCapturaOpen(false);
      showToast(`Hoja ${res.data.folio} registrada por ${formatCurrency(res.data.importeTotalRenta)}.`, 'success');
      recargar();
      onCambio();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar la hoja.', 'error');
    } finally {
      soltar();
    }
  };

  const abrirFirma = (b: BitacoraRentaDTO) => {
    setFirma({ nombreResidente: b.firmaCliente.nombreResidente ?? '', cargoResidente: b.firmaCliente.cargoResidente ?? '' });
    setErroresFirma({});
    setFirmarTarget(b);
  };

  const guardarFirma = async () => {
    if (!firmarTarget) return;
    const encontrados = validarResidente(firma.nombreResidente, firma.cargoResidente);
    if (Object.values(encontrados).some(Boolean)) {
      setErroresFirma(encontrados);
      return;
    }
    if (!tomar()) return;
    try {
      const res = await bitacorasRentaApi.actualizar(firmarTarget.id, {
        firmado: true,
        nombreResidente: firma.nombreResidente.trim(),
        cargoResidente: firma.cargoResidente.trim(),
      });
      if (!res.success) {
        showToast(res.error.message, 'error');
        return;
      }
      setFirmarTarget(null);
      showToast(`Firma registrada: la hoja ${res.data.folio} quedó lista para facturar.`, 'success');
      recargar();
      onCambio();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo registrar la firma.', 'error');
    } finally {
      soltar();
    }
  };

  /** Factura la bitácora LISTO_FACTURAR: la API crea la cuenta por cobrar. */
  const facturar = async () => {
    if (!facturarTarget || !tomar()) return;
    try {
      const res = await bitacorasRentaApi.facturar(facturarTarget.id);
      if (!res.success) {
        showToast(res.error.message || 'No se pudo facturar la hoja.', 'error');
        // Se cierra la confirmación: pudo facturarla otra persona y lo que muestra ya no es vigente.
        setFacturarTarget(null);
        recargar();
        return;
      }
      const { cuenta, bitacora } = res.data;
      setFacturarTarget(null);
      showToast(
        `Hoja ${bitacora.folio} facturada: cuenta por cobrar ${cuenta.folio} por ${formatCurrency(cuenta.monto)}, vence ${formatFechaSolo(cuenta.fechaVencimiento)}.`,
        'success',
      );
      recargar();
      onCambio();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo facturar la hoja.', 'error');
    } finally {
      soltar();
    }
  };

  const efectivasNum = form ? leerNumero(form.horasEfectivas, 0) ?? 0 : 0;
  const extrasNum = form ? leerNumero(form.horasExtras || '0', 0) ?? 0 : 0;
  const tarifaNum = form ? leerNumero(form.tarifaHora, 0) ?? 0 : 0;
  // Redondeado a centavos como lo calcula la API.
  const importePrevio = Math.round((efectivasNum + extrasNum) * tarifaNum * 100) / 100;
  const hIni = form ? leerNumero(form.horometroInicial, 0) : null;
  const hFin = form ? leerNumero(form.horometroFinal, 0) : null;

  return (
    <>
      {/* persistent mientras hay un modal encima: si no, Escape cerraría los dos y se perdería lo capturado. */}
      <Modal open onClose={() => { if (!enviando) onClose(); }} size="xl" persistent={capturaOpen || !!firmarTarget || !!facturarTarget}>
        <ModalHeader
          title="Bitácoras de renta"
          subtitle={`${trabajador.nombre}${trabajador.maquinaAsignadaId ? ` · ${trabajador.maquinaAsignadaId} ${trabajador.maquinaAsignadaNombre ?? ''}` : ''}`}
          onClose={() => { if (!enviando) onClose(); }}
        />
        <ModalBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-ui-600">
              Partes diarios de cuando el operador y su máquina trabajan rentados a un cliente.
            </p>
            {puedeCrear && (
              <Button onClick={abrirCaptura} disabled={enviando} className="w-full sm:w-auto shrink-0">
                Capturar hoja
              </Button>
            )}
          </div>

          {errorCarga && (
            <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
              <p className="text-sm text-red-700 dark:text-red-300 break-words">No se pudieron cargar las bitácoras: {errorCarga}</p>
              <Button variant="outline" size="sm" onClick={recargar} disabled={cargando} className="shrink-0">
                {cargando ? 'Reintentando…' : 'Reintentar'}
              </Button>
            </div>
          )}

          {cargando && bitacoras.length === 0 ? (
            <LoadingState text="Cargando bitácoras..." />
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
                {[
                  { t: 'Listas para facturar', s: listas },
                  { t: 'Pendientes de firma', s: pendientes },
                  { t: 'Facturadas', s: facturadas },
                ].map((x) => (
                  <div key={x.t} className="bg-surface px-3 sm:px-4 py-3 min-w-0">
                    <dt className="text-[11px] sm:text-xs text-ui-500">{x.t}</dt>
                    <dd className="mt-0.5 text-sm sm:text-base font-semibold text-ui-900 tabular-nums truncate">{formatCurrency(x.s.monto)}</dd>
                    <dd className="text-xs text-ui-500">{x.s.n} {x.s.n === 1 ? 'hoja' : 'hojas'}</dd>
                  </div>
                ))}
              </dl>

              {bitacoras.length === 0 ? (
                !errorCarga && (
                  <p className="py-10 text-center text-sm text-ui-500">Este operador todavía no tiene hojas de bitácora.</p>
                )
              ) : (
                <ul className="space-y-3">
                  {bitacoras.map((b) => (
                    <li key={b.id} className="p-4 rounded-xl border border-ui-200 bg-surface space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ui-900">
                            {b.folio} <span className="font-normal text-ui-500">· {formatFechaSolo(b.fecha)}</span>
                          </p>
                          <p className="text-xs text-ui-600 break-words">{b.cliente} · {b.obraUbicacion}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-sm font-semibold text-ui-900 tabular-nums">{formatCurrency(b.importeTotalRenta)}</span>
                          <Badge variant={ESTADO_COBRO_BADGE[b.estadoCobro] ?? 'neutral'} size="sm">{b.estadoCobro}</Badge>
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="min-w-0">
                          <dt className="text-ui-500">Máquina</dt>
                          <dd className="text-ui-800 truncate">{b.maquinaId} · {b.maquinaNombre}</dd>
                        </div>
                        <div>
                          <dt className="text-ui-500">Horario</dt>
                          <dd className="text-ui-800 tabular-nums">{b.horaInicio} – {b.horaFin}</dd>
                        </div>
                        <div>
                          <dt className="text-ui-500">Horas cobradas</dt>
                          <dd className="text-ui-800 tabular-nums">
                            {b.horasEfectivas}{b.horasExtras > 0 ? ` + ${b.horasExtras} extra` : ''} × {formatCurrency(b.tarifaHoraRenta)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ui-500">Horómetro</dt>
                          <dd className="text-ui-800 tabular-nums">
                            {b.horometroInicial} → {b.horometroFinal} ({(b.horometroFinal - b.horometroInicial).toFixed(1)} h)
                          </dd>
                        </div>
                      </dl>

                      {b.actividadRealizada && <p className="text-xs text-ui-600 break-words">{b.actividadRealizada}</p>}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-ui-100">
                        <p className="text-xs text-ui-500 min-w-0">
                          {b.firmaCliente.firmado
                            ? `Firmó ${b.firmaCliente.nombreResidente ?? 'el residente'}${b.firmaCliente.cargoResidente ? ` (${b.firmaCliente.cargoResidente})` : ''}`
                            : 'Sin firma del residente del cliente'}
                        </p>
                        {puedeEditar && b.estadoCobro !== 'Facturado' && (
                          <div className="flex gap-2 shrink-0">
                            {b.estadoCobro === 'Pendiente Firma' && (
                              <Button variant="outline" size="sm" disabled={enviando} onClick={() => abrirFirma(b)}>
                                Registrar firma
                              </Button>
                            )}
                            {b.estadoCobro === 'Listo para Facturar' && (
                              <Button size="sm" disabled={enviando} onClick={() => setFacturarTarget(b)}>
                                Facturar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {total > bitacoras.length && (
                <p className="text-xs text-ui-500">Se muestran las {bitacoras.length} más recientes de {total}.</p>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={enviando}>Cerrar</Button>
        </ModalFooter>
      </Modal>

      {/* Captura de una hoja nueva */}
      {form && (
        <FormModal
          open={capturaOpen}
          onClose={() => { if (!enviando) setCapturaOpen(false); }}
          onSubmit={guardarCaptura}
          title="Capturar hoja de bitácora"
          subtitle={trabajador.nombre}
          submitLabel={enviando ? 'Guardando…' : 'Guardar hoja'}
          isSubmitting={enviando}
          size="lg"
        >
          <div className="space-y-4">
            {maquinas === null && (
              <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {catalogosCargando
                    ? 'Cargando el catálogo de máquinas…'
                    : `No se pudo cargar el catálogo de máquinas${errorCatalogos ? ` (${errorCatalogos})` : ''}: sin él no se puede guardar la hoja.`}
                </p>
                {!catalogosCargando && (
                  <Button type="button" variant="outline" size="sm" onClick={onReintentarCatalogos} className="shrink-0">Reintentar</Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Cliente" required error={errores.cliente}>
                <input aria-label="Cliente" className={modalInputClass} maxLength={TEXTO_CORTO_MAX} value={form.cliente} onChange={(e) => cambiar('cliente', e.target.value)} />
              </ModalField>
              <ModalField label="Obra o frente" required error={errores.obraUbicacion}>
                <input aria-label="Obra o frente" className={modalInputClass} maxLength={TEXTO_CORTO_MAX} value={form.obraUbicacion} onChange={(e) => cambiar('obraUbicacion', e.target.value)} />
              </ModalField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalField label="Máquina" required error={errores.maquinaId}>
                <select aria-label="Máquina" className={modalSelectClass} value={form.maquinaId} disabled={maquinas === null} onChange={(e) => cambiar('maquinaId', e.target.value)}>
                  <option value="">{maquinas === null ? 'No disponible' : 'Elige la máquina'}</option>
                  {(maquinas ?? []).map((m) => (
                    <option key={m.codigo} value={m.codigo}>{m.codigo} · {m.nombre}</option>
                  ))}
                </select>
              </ModalField>
              <ModalField label="Fecha" required error={errores.fecha}>
                <input aria-label="Fecha del servicio" type="date" max={hoyLocal()} className={modalInputClass} value={form.fecha} onChange={(e) => cambiar('fecha', e.target.value)} />
              </ModalField>
            </div>

            {/* Dos columnas: más angostos, el navegador corta el "a. m. / p. m." de las horas. */}
            <div className="grid grid-cols-2 gap-4">
              <ModalField label="Inicio" required error={errores.horaInicio}>
                <input aria-label="Hora de inicio" type="time" className={modalInputClass} value={form.horaInicio} onChange={(e) => cambiar('horaInicio', e.target.value)} />
              </ModalField>
              <ModalField label="Fin" required error={errores.horaFin}>
                <input aria-label="Hora de fin" type="time" className={modalInputClass} value={form.horaFin} onChange={(e) => cambiar('horaFin', e.target.value)} />
              </ModalField>
              <ModalField label="Horas efectivas" required error={errores.horasEfectivas}>
                <input aria-label="Horas efectivas" type="number" min="0" max={HORAS_MAXIMAS_DIA} step="0.5" inputMode="decimal" className={modalInputClass} value={form.horasEfectivas} onChange={(e) => cambiar('horasEfectivas', e.target.value)} />
              </ModalField>
              <ModalField label="Horas extra" error={errores.horasExtras}>
                <input aria-label="Horas extra" type="number" min="0" max={HORAS_MAXIMAS_DIA} step="0.5" inputMode="decimal" className={modalInputClass} value={form.horasExtras} onChange={(e) => cambiar('horasExtras', e.target.value)} />
              </ModalField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ModalField label="Tarifa por hora" required error={errores.tarifaHora}>
                <input aria-label="Tarifa de renta por hora" type="number" min="0.01" step="0.01" inputMode="decimal" className={modalInputClass} placeholder="0.00" value={form.tarifaHora} onChange={(e) => cambiar('tarifaHora', e.target.value)} />
              </ModalField>
              <ModalField label="Horómetro inicial" required error={errores.horometroInicial}>
                <input aria-label="Horómetro inicial" type="number" min="0" step="0.1" inputMode="decimal" className={modalInputClass} value={form.horometroInicial} onChange={(e) => cambiar('horometroInicial', e.target.value)} />
              </ModalField>
              <ModalField
                label="Horómetro final"
                required
                error={errores.horometroFinal}
                hint={hIni !== null && hFin !== null && hFin >= hIni ? `${(hFin - hIni).toFixed(1)} h de máquina` : undefined}
              >
                <input aria-label="Horómetro final" type="number" min="0" step="0.1" inputMode="decimal" className={modalInputClass} value={form.horometroFinal} onChange={(e) => cambiar('horometroFinal', e.target.value)} />
              </ModalField>
            </div>

            <ModalField label="Trabajo realizado" required error={errores.actividadRealizada}>
              <textarea aria-label="Trabajo realizado" rows={2} maxLength={ACTIVIDAD_MAX} className={modalTextareaClass} value={form.actividadRealizada} onChange={(e) => cambiar('actividadRealizada', e.target.value)} />
            </ModalField>

            <div className="p-3 rounded-xl border border-ui-200 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={form.firmado} onChange={(e) => cambiar('firmado', e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                <span className="text-sm text-ui-800">La hoja viene firmada por el residente del cliente</span>
              </label>
              {form.firmado && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ModalField label="Nombre del residente" required error={errores.nombreResidente}>
                    <input aria-label="Nombre del residente" className={modalInputClass} maxLength={RESIDENTE_MAX} value={form.nombreResidente} onChange={(e) => cambiar('nombreResidente', e.target.value)} />
                  </ModalField>
                  <ModalField label="Cargo" required error={errores.cargoResidente}>
                    <input aria-label="Cargo del residente" className={modalInputClass} maxLength={RESIDENTE_MAX} value={form.cargoResidente} onChange={(e) => cambiar('cargoResidente', e.target.value)} />
                  </ModalField>
                </div>
              )}
            </div>

            <p className="text-sm text-ui-700">
              Importe a cobrar: <span className="font-semibold text-ui-900 tabular-nums">{formatCurrency(importePrevio)}</span>
              <span className="text-ui-500"> · {form.firmado ? 'quedará lista para facturar' : 'quedará pendiente de firma'}</span>
            </p>
          </div>
        </FormModal>
      )}

      {/* Registrar la firma de una hoja pendiente */}
      {firmarTarget && (
        <FormModal
          open
          onClose={() => { if (!enviando) setFirmarTarget(null); }}
          onSubmit={guardarFirma}
          title="Registrar firma"
          subtitle={`${firmarTarget.folio} · ${firmarTarget.cliente}`}
          submitLabel={enviando ? 'Guardando…' : 'Registrar firma'}
          isSubmitting={enviando}
          size="sm"
        >
          <div className="space-y-4">
            <ModalField label="Nombre del residente" required error={erroresFirma.nombreResidente}>
              <input
                aria-label="Nombre del residente"
                className={modalInputClass}
                maxLength={RESIDENTE_MAX}
                value={firma.nombreResidente}
                onChange={(e) => setFirma((f) => ({ ...f, nombreResidente: e.target.value }))}
              />
            </ModalField>
            <ModalField label="Cargo" required error={erroresFirma.cargoResidente}>
              <input
                aria-label="Cargo del residente"
                className={modalInputClass}
                maxLength={RESIDENTE_MAX}
                value={firma.cargoResidente}
                onChange={(e) => setFirma((f) => ({ ...f, cargoResidente: e.target.value }))}
              />
            </ModalField>
            <p className="text-xs text-ui-500">Con la firma, la hoja queda lista para facturar.</p>
          </div>
        </FormModal>
      )}

      {/* Confirmar facturación */}
      {facturarTarget && (
        <FormModal
          open
          onClose={() => { if (!enviando) setFacturarTarget(null); }}
          onSubmit={facturar}
          title="Facturar hoja"
          subtitle={`${facturarTarget.folio} · ${facturarTarget.cliente}`}
          submitLabel={enviando ? 'Facturando…' : 'Sí, facturar'}
          isSubmitting={enviando}
          size="sm"
        >
          <p className="text-sm text-ui-700">
            Se creará una cuenta por cobrar por{' '}
            <span className="font-semibold text-ui-900">{formatCurrency(facturarTarget.importeTotalRenta)}</span> a 30 días y la
            hoja quedará como facturada. No se puede revertir desde aquí.
          </p>
        </FormModal>
      )}
    </>
  );
}
