"use client";

import React, { useEffect, useRef, useState } from 'react';
import { trabajadoresApi, type LiquidarInput, type TrabajadorDTO } from '@/lib/api';
import { APP_TIMEZONE, formatCurrency, formatFechaSolo } from '@/lib/formatters';
import { useToast } from '@/components/layout/Toast';
import { useNotifications } from '@/components/layout/NotificationContext';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalField, modalInputClass, modalSelectClass } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Portal } from '@/components/ui/Portal';

/** Razón social que firma el convenio (la que ya usaba la carta; RFC y domicilio se dejaron fuera por no ser reales). */
const EMPRESA = 'CONSTRUCTORA SVR S.A. DE C.V.';

type TipoTerminacion = LiquidarInput['tipoTerminacion'];

const MOTIVOS: { value: TipoTerminacion; label: string; descripcion: string }[] = [
  { value: 'Despido', label: 'Despido', descripcion: 'Finiquito + indemnización de 90 días, 20 días por año y prima de antigüedad.' },
  { value: 'Renuncia', label: 'Renuncia o fin de obra', descripcion: 'Solo el finiquito proporcional.' },
  { value: 'Convenio', label: 'Convenio entre las partes', descripcion: 'Finiquito + gratificación de 45 días.' },
];

const TITULO_CONVENIO: Record<TipoTerminacion, string> = {
  Despido: 'LIQUIDACIÓN E INDEMNIZACIÓN LABORAL',
  Renuncia: 'RENUNCIA VOLUNTARIA',
  Convenio: 'CONVENIO MUTUO',
};

// Mismos topes que LiquidarTrabajadorDto de la API.
const DIAS_PERIODO_MAX = 31;
const DIAS_VACACIONES_MAX = 365;
const PRESTAMO_MAX = 99_999_999;
const MONTO_VALIDO = /^\d+(\.\d{1,2})?$/;

interface Desglose {
  diasAntiguedad: number;
  aniosAntiguedad: number;
  sueldoDiario: number;
  montoDiasTrabajados: number;
  diasAguinaldo: number;
  montoAguinaldo: number;
  montoVacaciones: number;
  montoPrimaVacacional: number;
  subtotalFiniquito: number;
  indemnizacion90: number;
  indemnizacion20PorAnio: number;
  primaAntiguedad: number;
  subtotalIndemnizaciones: number;
  granTotalNeto: number;
}

const r2 = (n: number) => Number(n.toFixed(2));

/**
 * Vista previa con la misma fórmula que `TrabajadoresService.liquidar()`. La API recalcula al confirmar y su
 * resultado es el que se paga y se audita.
 */
function calcular(t: TrabajadorDTO, fechaIngreso: string, tipo: TipoTerminacion, dias: number, vac: number, prestamos: number): Desglose {
  const diasAntiguedad = Math.max(0, Math.ceil((Date.now() - Date.parse(fechaIngreso)) / 86400000));
  const aniosAntiguedad = Math.max(0.1, r2(diasAntiguedad / 365.25));
  // Semanal entre 7, igual que la API (el domingo de descanso se paga).
  const sueldoDiario = (t.sueldoFiscal + t.sueldoEfectivo) / 7;
  const montoDiasTrabajados = r2(dias * sueldoDiario);
  const diasAguinaldo = r2((diasAntiguedad % 365) * (15 / 365));
  const montoAguinaldo = r2(diasAguinaldo * sueldoDiario);
  const montoVacaciones = r2(vac * sueldoDiario);
  const montoPrimaVacacional = r2(montoVacaciones * 0.25);
  const subtotalFiniquito = montoDiasTrabajados + montoAguinaldo + montoVacaciones + montoPrimaVacacional;
  let indemnizacion90 = 0;
  let indemnizacion20PorAnio = 0;
  let primaAntiguedad = 0;
  if (tipo === 'Despido') {
    indemnizacion90 = r2(90 * sueldoDiario);
    indemnizacion20PorAnio = r2(20 * aniosAntiguedad * sueldoDiario);
    primaAntiguedad = r2(12 * aniosAntiguedad * Math.min(sueldoDiario, 498));
  } else if (tipo === 'Convenio') {
    indemnizacion90 = r2(45 * sueldoDiario);
  }
  const subtotalIndemnizaciones = indemnizacion90 + indemnizacion20PorAnio + primaAntiguedad;
  const granTotalNeto = Math.max(0, r2(subtotalFiniquito + subtotalIndemnizaciones - prestamos));
  return {
    diasAntiguedad, aniosAntiguedad, sueldoDiario: r2(sueldoDiario), montoDiasTrabajados, diasAguinaldo, montoAguinaldo,
    montoVacaciones, montoPrimaVacacional, subtotalFiniquito, indemnizacion90, indemnizacion20PorAnio, primaAntiguedad,
    subtotalIndemnizaciones, granTotalNeto,
  };
}

/** Número dentro de [0, max], o null si no lo es. */
function leerNumero(valor: string, max: number): number | null {
  if (valor.trim() === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return n;
}

function fechaLarga(): string {
  return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: APP_TIMEZONE });
}

function Fila({ concepto, monto, negativo }: { concepto: string; monto: number; negativo?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-ui-100 last:border-0">
      <span className="text-sm text-ui-600 min-w-0">{concepto}</span>
      <span className={negativo ? 'text-sm tabular-nums text-red-600 dark:text-red-400 shrink-0' : 'text-sm tabular-nums text-ui-900 shrink-0'}>
        {negativo ? '−' : ''}{formatCurrency(monto)}
      </span>
    </div>
  );
}

interface CartaProps {
  trabajador: TrabajadorDTO;
  tipo: TipoTerminacion;
  d: Desglose;
  prestamos: number;
}

/** Hoja del convenio: siempre en blanco y negro (se imprime así aunque la pantalla esté en modo oscuro). */
function CartaFiniquito({ trabajador, tipo, d, prestamos }: CartaProps) {
  return (
    <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-xl border border-slate-200 space-y-6 text-[13px] leading-relaxed">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b-2 border-slate-900 pb-4">
        <p className="text-lg font-bold tracking-tight">{EMPRESA}</p>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase">Convenio de finiquito</p>
          <p className="text-xs text-slate-600">{fechaLarga()}</p>
        </div>
      </div>

      <div className="space-y-3 sm:text-justify">
        <p>
          En ______________________, a {fechaLarga()}, comparecen por una parte <strong>{EMPRESA}</strong> (en lo
          sucesivo “EL PATRÓN”) y por la otra el C. <strong>{trabajador.nombre}</strong> (en lo sucesivo “EL
          TRABAJADOR”), quien desempeñaba el puesto de <strong>{trabajador.puesto}</strong>, con fecha de ingreso
          el <strong>{formatFechaSolo(trabajador.fechaContratacion)}</strong> y una antigüedad de{' '}
          <strong>{d.aniosAntiguedad} años</strong>.
        </p>
        <p>
          Ambas partes convienen en dar por terminada la relación de trabajo de forma definitiva bajo el concepto de{' '}
          <strong>{TITULO_CONVENIO[tipo]}</strong>.
        </p>
        <p>EL TRABAJADOR manifiesta recibir en este acto, a su entera satisfacción, la cantidad neta de:</p>
        <div className="py-3 px-4 border border-slate-400 rounded-lg text-center">
          <p className="text-2xl font-bold">{formatCurrency(d.granTotalNeto)} MXN</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Finiquito {formatCurrency(d.subtotalFiniquito)} · Indemnizaciones {formatCurrency(d.subtotalIndemnizaciones)} ·
            Deducciones {formatCurrency(prestamos)}
          </p>
        </div>
        <p>
          EL TRABAJADOR otorga a {EMPRESA} el más amplio finiquito que en derecho proceda y manifiesta que durante el
          tiempo que prestó sus servicios le fueron cubiertos sus salarios, horas extra, aguinaldo, vacaciones, prima
          vacacional y demás prestaciones de ley, sin reservarse acción ni derecho alguno en contra de la empresa.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 sm:gap-12 pt-10 text-center">
        <div>
          <div className="border-b border-slate-900 h-12" />
          <p className="mt-2 text-xs font-bold uppercase">{trabajador.nombre}</p>
          <p className="text-[11px] text-slate-600">Recibí de conformidad</p>
        </div>
        <div>
          <div className="border-b border-slate-900 h-12" />
          <p className="mt-2 text-xs font-bold uppercase">Nombre y firma</p>
          <p className="text-[11px] text-slate-600">Por {EMPRESA}</p>
        </div>
      </div>
    </div>
  );
}

interface LiquidacionModalProps {
  onClose: () => void;
  /** Si viene, se liquida a ese trabajador; si no, se elige de la lista de activos. */
  trabajador?: TrabajadorDTO | null;
  onLiquidado: () => void;
}

export default function LiquidacionModal({ onClose, trabajador: trabajadorInicial, onLiquidado }: LiquidacionModalProps) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  // Lista de activos solo cuando se abre sin trabajador (botón del encabezado).
  const conSelector = !trabajadorInicial;
  const [activos, setActivos] = useState<TrabajadorDTO[]>([]);
  const [totalActivos, setTotalActivos] = useState(0);
  const [cargandoActivos, setCargandoActivos] = useState(conSelector);
  const [errorActivos, setErrorActivos] = useState<string | null>(null);
  const [intentoActivos, setIntentoActivos] = useState(0);
  const [seleccionId, setSeleccionId] = useState('');

  const [vista, setVista] = useState<'calculo' | 'carta'>('calculo');
  const [tipo, setTipo] = useState<TipoTerminacion>('Despido');
  const [diasPeriodo, setDiasPeriodo] = useState('0');
  const [diasVacaciones, setDiasVacaciones] = useState('0');
  const [deduccion, setDeduccion] = useState('0');
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);

  useEffect(() => {
    if (!conSelector) return;
    let vigente = true;
    (async () => {
      try {
        const res = await trabajadoresApi.listar({ estado: 'Activo', limit: 100 });
        if (!vigente) return;
        if (res.success) {
          setActivos(res.data.items);
          setTotalActivos(res.data.pagination.total);
          setErrorActivos(null);
        } else {
          setErrorActivos(res.error.message);
        }
      } catch (error) {
        if (vigente) setErrorActivos(error instanceof Error ? error.message : 'No se pudo cargar la lista de trabajadores.');
      } finally {
        if (vigente) setCargandoActivos(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [conSelector, intentoActivos]);

  const reintentarActivos = () => {
    setCargandoActivos(true);
    setIntentoActivos((n) => n + 1);
  };

  const worker = trabajadorInicial ?? activos.find((t) => t.id === seleccionId) ?? null;
  const fechaIngreso = worker?.fechaContratacion ?? null;

  const dias = leerNumero(diasPeriodo, DIAS_PERIODO_MAX);
  const vac = leerNumero(diasVacaciones, DIAS_VACACIONES_MAX);
  // Mismo tope que LiquidarTrabajadorDto; con hasta 2 decimales (es dinero).
  const prestamos = MONTO_VALIDO.test(deduccion.trim()) ? leerNumero(deduccion, PRESTAMO_MAX) : null;
  const valoresValidos = dias !== null && vac !== null && prestamos !== null;
  const d = worker && fechaIngreso ? calcular(worker, fechaIngreso, tipo, dias ?? 0, vac ?? 0, prestamos ?? 0) : null;
  // La API recorta el neto a 0: se avisa en vez de dejar que el descuento "desaparezca".
  const deduccionExcede = !!d && (prestamos ?? 0) > d.subtotalFiniquito + d.subtotalIndemnizaciones;
  const puedeConfirmar = !!worker && !!d && valoresValidos && worker.estado !== 'Inactivo';

  const imprimir = () => {
    try {
      window.print();
    } catch (error) {
      showToast(`El navegador no permitió imprimir: ${error instanceof Error ? error.message : 'error desconocido'}.`, 'error');
    }
  };

  const ejecutarBaja = async () => {
    if (!worker || !puedeConfirmar || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const res = await trabajadoresApi.liquidar(worker.id, {
        tipoTerminacion: tipo,
        diasTrabajadosPeriodo: dias ?? 0,
        diasVacacionesPendientes: vac ?? 0,
        deduccionesPrestamos: prestamos ?? 0,
      });
      if (!res.success) {
        if (res.error.code === 'CONFLICT') {
          // Ya estaba dado de baja (otra pestaña, otra persona, o una respuesta que se perdió): se refresca la
          // vista en vez de dejar el modal abierto con un botón que ya no puede funcionar.
          showToast(`${res.error.message}. Se actualizó la lista.`, 'warning');
          setConfirmarOpen(false);
          onLiquidado();
          onClose();
          return;
        }
        showToast(res.error.message, 'error');
        return;
      }
      showToast(`${worker.nombre} quedó dado de baja. Total del finiquito: ${formatCurrency(res.data.granTotalNeto)}.`, 'success');
      addNotification({
        titulo: `Baja de ${worker.nombre}`,
        mensaje: `${MOTIVOS.find((m) => m.value === tipo)?.label}: ${formatCurrency(res.data.granTotalNeto)}. Su máquina quedó libre.`,
        tipo: 'alerta',
      });
      setConfirmarOpen(false);
      onLiquidado();
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo registrar la baja.', 'error');
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const cerrar = () => {
    if (!enviando) onClose();
  };

  const motivo = MOTIVOS.find((m) => m.value === tipo);

  return (
    <>
      {/* persistent con la confirmación abierta: si no, Escape cerraría los dos modales. */}
      <Modal open onClose={cerrar} size="full" persistent={confirmarOpen}>
        <ModalHeader title="Baja y finiquito" subtitle={worker ? `${worker.nombre} · ${worker.puesto}` : 'Elige al trabajador'} onClose={cerrar} />

        <ModalBody className="space-y-5">
          {conSelector && (
            <div className="space-y-2">
              {errorActivos ? (
                <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                  <p className="text-sm text-red-700 dark:text-red-300">No se pudo cargar la lista de trabajadores: {errorActivos}</p>
                  <Button variant="outline" size="sm" onClick={reintentarActivos} disabled={cargandoActivos} className="shrink-0">
                    {cargandoActivos ? 'Reintentando…' : 'Reintentar'}
                  </Button>
                </div>
              ) : (
                <div className="sm:max-w-md">
                  <Select
                    label="Trabajador"
                    aria-label="Trabajador a dar de baja"
                    placeholder={cargandoActivos ? 'Cargando trabajadores…' : 'Elige un trabajador'}
                    disabled={cargandoActivos}
                    value={seleccionId}
                    onChange={(e) => setSeleccionId(e.target.value)}
                    options={activos.map((t) => ({ value: t.id, label: `${t.nombre} · ${t.puesto}` }))}
                  />
                  {totalActivos > activos.length && (
                    <p className="mt-1.5 text-xs text-ui-500">
                      Se listan {activos.length} de {totalActivos} activos. Si no aparece, usa “Dar de baja” desde su fila.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {worker && worker.estado === 'Inactivo' && (
            <p className="text-sm text-ui-600">{worker.nombre} ya está dado de baja.</p>
          )}

          {worker && !fechaIngreso && (
            <p role="alert" className="px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-sm text-amber-800 dark:text-amber-300">
              {worker.nombre} no tiene fecha de ingreso registrada y sin ella no se puede calcular su antigüedad. Regístrala
              con “Editar” y vuelve a abrir el finiquito.
            </p>
          )}

          {worker && d && (
            <Tabs
              ariaLabel="Finiquito"
              tabs={[
                { key: 'calculo', label: 'Cálculo' },
                { key: 'carta', label: 'Carta para firma' },
              ]}
              value={vista}
              onChange={(k) => setVista(k as 'calculo' | 'carta')}
            >
              <TabPanel tabKey="calculo">
                <div className="space-y-5">
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
                    {[
                      { t: 'Fecha de ingreso', v: formatFechaSolo(fechaIngreso) },
                      { t: 'Antigüedad', v: `${d.aniosAntiguedad} años (${d.diasAntiguedad} días)` },
                      { t: 'Sueldo diario', v: formatCurrency(d.sueldoDiario) },
                    ].map((x) => (
                      <div key={x.t} className="bg-surface px-4 py-3">
                        <dt className="text-xs text-ui-500">{x.t}</dt>
                        <dd className="text-sm font-semibold text-ui-900 mt-0.5">{x.v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <ModalField label="Motivo" required className="sm:col-span-3 lg:col-span-1">
                      <select aria-label="Motivo de la baja" className={modalSelectClass} value={tipo} onChange={(e) => setTipo(e.target.value as TipoTerminacion)}>
                        {MOTIVOS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </ModalField>
                    <ModalField label="Días por pagar" error={dias === null ? `De 0 a ${DIAS_PERIODO_MAX}.` : undefined}>
                      <input aria-label="Días laborados por pagar" type="number" min="0" max={DIAS_PERIODO_MAX} step="0.5" inputMode="decimal" className={modalInputClass} value={diasPeriodo} onChange={(e) => setDiasPeriodo(e.target.value)} />
                    </ModalField>
                    <ModalField label="Vacaciones pendientes" error={vac === null ? `De 0 a ${DIAS_VACACIONES_MAX} días.` : undefined}>
                      <input aria-label="Días de vacaciones pendientes" type="number" min="0" max={DIAS_VACACIONES_MAX} step="0.5" inputMode="decimal" className={modalInputClass} value={diasVacaciones} onChange={(e) => setDiasVacaciones(e.target.value)} />
                    </ModalField>
                    <ModalField label="Préstamo a descontar" error={prestamos === null ? 'Monto con hasta 2 decimales (0 si no hay).' : undefined}>
                      <input aria-label="Préstamo o deducción a descontar" type="number" min="0" step="0.01" inputMode="decimal" className={modalInputClass} value={deduccion} onChange={(e) => setDeduccion(e.target.value)} />
                    </ModalField>
                  </div>
                  {motivo && <p className="-mt-2 text-xs text-ui-500">{motivo.descripcion}</p>}
                  {deduccionExcede && (
                    <p role="alert" className="text-xs text-amber-700 dark:text-amber-400">
                      El préstamo es mayor que el finiquito: el total queda en $0 y la diferencia no se cobra aquí.
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-ui-500 mb-1">Finiquito</h4>
                      <Fila concepto={`Días laborados (${dias ?? 0})`} monto={d.montoDiasTrabajados} />
                      <Fila concepto={`Aguinaldo proporcional (${d.diasAguinaldo} días)`} monto={d.montoAguinaldo} />
                      <Fila concepto={`Vacaciones no gozadas (${vac ?? 0} días)`} monto={d.montoVacaciones} />
                      <Fila concepto="Prima vacacional (25 %)" monto={d.montoPrimaVacacional} />
                    </section>
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-ui-500 mb-1">Indemnización</h4>
                      {tipo === 'Despido' && (
                        <>
                          <Fila concepto="Indemnización constitucional (90 días)" monto={d.indemnizacion90} />
                          <Fila concepto={`20 días por año (${d.aniosAntiguedad} años)`} monto={d.indemnizacion20PorAnio} />
                          <Fila concepto="Prima de antigüedad (12 días por año)" monto={d.primaAntiguedad} />
                        </>
                      )}
                      {tipo === 'Convenio' && <Fila concepto="Gratificación por convenio (45 días)" monto={d.indemnizacion90} />}
                      {tipo === 'Renuncia' && <p className="py-1.5 text-sm text-ui-500">No aplica en renuncia o fin de obra.</p>}
                      {(prestamos ?? 0) > 0 && <Fila concepto="Préstamo descontado" monto={prestamos ?? 0} negativo />}
                    </section>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pt-4 border-t border-ui-200">
                    <div>
                      <p className="text-xs text-ui-500">Total estimado a pagar</p>
                      <p className="text-2xl font-semibold text-ui-900 tabular-nums">{formatCurrency(d.granTotalNeto)}</p>
                    </div>
                    <p className="text-xs text-ui-500 sm:text-right sm:max-w-xs">
                      El sistema recalcula al confirmar con la misma fórmula; ese es el monto que queda registrado.
                    </p>
                  </div>
                </div>
              </TabPanel>

              <TabPanel tabKey="carta">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs text-ui-500">Se imprime solo la carta, en blanco y negro. El lugar se llena a mano.</p>
                    <Button variant="outline" onClick={imprimir} disabled={!valoresValidos} className="w-full sm:w-auto shrink-0">
                      Imprimir carta
                    </Button>
                  </div>
                  <div className="p-2 sm:p-4 rounded-xl bg-ui-100">
                    <CartaFiniquito trabajador={worker} tipo={tipo} d={d} prestamos={prestamos ?? 0} />
                  </div>
                </div>
              </TabPanel>
            </Tabs>
          )}
        </ModalBody>

        <ModalFooter>
          <p className="text-xs text-ui-500 sm:mr-auto min-w-0 text-center sm:text-left">
            Al dar de baja, el trabajador queda inactivo y se libera su máquina.
          </p>
          <Button variant="outline" onClick={cerrar} disabled={enviando} className="shrink-0">Cancelar</Button>
          <Button variant="danger" onClick={() => setConfirmarOpen(true)} disabled={!puedeConfirmar || enviando} className="shrink-0">
            Dar de baja
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirmación con botón rojo (FormModal solo tiene el primario y esto no se deshace). */}
      {worker && d && (
        <Modal open={confirmarOpen} onClose={() => { if (!enviando) setConfirmarOpen(false); }} size="sm">
          <ModalHeader title="Confirmar baja" onClose={() => { if (!enviando) setConfirmarOpen(false); }} />
          <ModalBody>
            <p className="text-sm text-ui-700">
              Se dará de baja a <span className="font-semibold text-ui-900">{worker.nombre}</span> por{' '}
              {motivo?.label.toLowerCase()}, con un finiquito estimado de{' '}
              <span className="font-semibold text-ui-900">{formatCurrency(d.granTotalNeto)}</span>. Quedará inactivo y su
              máquina libre. No se puede deshacer desde aquí.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setConfirmarOpen(false)} disabled={enviando}>Cancelar</Button>
            <Button variant="danger" onClick={ejecutarBaja} loading={enviando} disabled={enviando}>
              {enviando ? 'Registrando…' : 'Sí, dar de baja'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Copia solo para imprimir (ver `.solo-impresion` en globals.css). */}
      {worker && d && vista === 'carta' && (
        <Portal>
          <div className="solo-impresion">
            <CartaFiniquito trabajador={worker} tipo={tipo} d={d} prestamos={prestamos ?? 0} />
          </div>
        </Portal>
      )}
    </>
  );
}
