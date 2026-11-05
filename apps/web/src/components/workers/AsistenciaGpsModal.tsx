"use client";

import React, { useState } from 'react';
import { Building2, User } from 'lucide-react';
import type { RegistroAsistenciaDTO } from '@/lib/api';
import { useToast } from '@/components/layout/Toast';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';

interface TrabajadorResumen {
  nombre: string;
  puesto: string;
  avatar: string;
}

interface AsistenciaGpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  registro: RegistroAsistenciaDTO | null;
  trabajador?: TrabajadorResumen;
  /** Sin este callback (usuario sin permiso de editar) no se muestran las acciones de validación. */
  onActualizarEstado?: (registroId: string, nuevoEstado: 'Puntual' | 'Retardo' | 'Falta' | 'Justificado') => Promise<void>;
  /** Sin este callback no se muestra el botón de autorizar horas extra. */
  onAprobarHorasExtra?: (horasExtraId: string) => Promise<void>;
}

function mensajeError(error: unknown, respaldo: string): string {
  return error instanceof Error && error.message ? error.message : respaldo;
}

function Dato({ etiqueta, valor, detalle }: { etiqueta: string; valor: React.ReactNode; detalle?: React.ReactNode }) {
  return (
    <div className="bg-surface px-3 py-2.5 min-w-0">
      <dt className="text-xs text-ui-500">{etiqueta}</dt>
      <dd className="text-sm font-semibold text-ui-900 truncate">{valor}</dd>
      {detalle && <dd className="text-xs text-ui-400 truncate">{detalle}</dd>}
    </div>
  );
}

export default function AsistenciaGpsModal({
  isOpen,
  onClose,
  registro,
  trabajador,
  onActualizarEstado,
  onAprobarHorasExtra,
}: AsistenciaGpsModalProps) {
  const { showToast } = useToast();
  const [procesando, setProcesando] = useState(false);

  if (!isOpen || !registro) return null;

  const distancia = registro.distanciaMetros >= 1000
    ? `${(registro.distanciaMetros / 1000).toFixed(2)} km`
    : `${registro.distanciaMetros} m`;
  const radioKm = (registro.radioPermitidoMetros / 1000).toFixed(1);
  const horasExtra = registro.horasExtra;
  const puedeAutorizarHorasExtra =
    !!onAprobarHorasExtra && !!horasExtra && horasExtra.estado !== 'Aprobado' && horasExtra.estado !== 'Rechazado';

  // Posición esquemática del trabajador: dentro o fuera del círculo de la geocerca.
  // La distancia real es la del texto; el dibujo no está a escala.
  // En sitio: arriba del centro (dentro del círculo y sin tapar el nombre de la obra).
  const posicionTrabajador = registro.enSitio ? { x: 58, y: 28 } : { x: 80, y: 22 };

  const googleMapsUrl = `https://www.google.com/maps?q=${registro.coordenadas.lat},${registro.coordenadas.lng}`;

  const handleAprobar = async () => {
    if (!onActualizarEstado || procesando) return;
    setProcesando(true);
    try {
      await onActualizarEstado(registro.id, registro.enSitio ? 'Puntual' : 'Justificado');
      showToast(`Asistencia de ${trabajador?.nombre ?? 'el trabajador'} validada.`, 'success');
      onClose();
    } catch (error) {
      showToast(mensajeError(error, 'No se pudo actualizar la asistencia.'), 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleMarcarFalta = async () => {
    if (!onActualizarEstado || procesando) return;
    setProcesando(true);
    try {
      await onActualizarEstado(registro.id, 'Falta');
      showToast(`Falta registrada: marcó fuera del radio permitido de ${radioKm} km.`, 'warning');
      onClose();
    } catch (error) {
      showToast(mensajeError(error, 'No se pudo marcar la falta.'), 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleAutorizarHorasExtra = async () => {
    if (!onAprobarHorasExtra || !horasExtra || procesando) return;
    setProcesando(true);
    try {
      await onAprobarHorasExtra(horasExtra.id);
      showToast(`${horasExtra.horasCalculadas} h extra autorizadas para ${trabajador?.nombre ?? 'el trabajador'}.`, 'success');
    } catch (error) {
      showToast(mensajeError(error, 'No se pudieron autorizar las horas extra.'), 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="full">
      <ModalHeader
        title="Detalle de asistencia"
        subtitle={`${trabajador?.nombre ?? 'Trabajador'}${trabajador?.puesto ? ` · ${trabajador.puesto}` : ''} · ${registro.obraAsignada}`}
        onClose={onClose}
      />

      <ModalBody className="space-y-5">
        {/* Resultado de la geocerca */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Badge variant={registro.enSitio ? 'success' : 'error'}>{registro.enSitio ? 'En sitio' : 'Fuera de rango'}</Badge>
          <p className="text-sm text-ui-600">
            Marcó a <span className="font-semibold text-ui-900">{distancia}</span> de la obra · radio permitido {radioKm} km
          </p>
        </div>

        {/* Datos del marcaje */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
          <Dato etiqueta="Entrada" valor={registro.horaEntrada ?? 'Sin marcar'} detalle={registro.horaMarcajeExacta} />
          <Dato etiqueta="Salida" valor={registro.horaSalida ?? 'Jornada activa'} detalle={registro.horaSalidaExacta} />
          <Dato etiqueta="Horas ordinarias" valor={registro.horasTrabajadasOrdinarias != null ? `${registro.horasTrabajadasOrdinarias} h` : '—'} />
          <Dato
            etiqueta="Dispositivo"
            valor={registro.dispositivo || '—'}
            detalle={registro.bateria != null ? `Batería ${registro.bateria} %` : undefined}
          />
        </dl>

        {registro.salidaAnticipada && (
          <div className="px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Salida anticipada{registro.horasTrabajadasOrdinarias != null ? ` · ${registro.horasTrabajadasOrdinarias} h laboradas` : ''}
            </p>
            <p className="text-amber-700 dark:text-amber-300 mt-0.5 break-words">
              Motivo: {registro.motivoSalidaAnticipada || 'Sin motivo capturado.'}
            </p>
          </div>
        )}

        {/* Esquema de la geocerca */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ui-500">Ubicación del marcaje (esquema, no a escala)</p>
            <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-primary hover:underline">
              Ver en Google Maps
            </a>
          </div>

          <div className="relative h-56 sm:h-64 w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 select-none">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Geocerca */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-emerald-400/70 bg-emerald-500/10" />

            {/* Obra */}
            <div className="absolute flex flex-col items-center z-10 -translate-x-1/2 -translate-y-1/2" style={{ top: '50%', left: '50%' }}>
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center border-2 border-white">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="mt-1 max-w-[140px] truncate bg-slate-950/80 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                {registro.obraAsignada}
              </div>
            </div>

            {/* Línea obra → trabajador */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" aria-hidden="true">
              <line
                x1="50%"
                y1="50%"
                x2={`${posicionTrabajador.x}%`}
                y2={`${posicionTrabajador.y}%`}
                stroke={registro.enSitio ? '#34d399' : '#f87171'}
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>

            {/* Trabajador */}
            <div
              className="absolute flex flex-col items-center z-30 -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${posicionTrabajador.y}%`, left: `${posicionTrabajador.x}%` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white ${registro.enSitio ? 'bg-blue-600' : 'bg-red-600'}`}>
                <User className="w-4 h-4" />
              </div>
              <div className="mt-1 whitespace-nowrap bg-slate-950/80 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                {distancia}
              </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-x-3 bg-slate-950/80 px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-300 z-30 tabular-nums">
              <span>GPS: {registro.coordenadas.lat.toFixed(5)}, {registro.coordenadas.lng.toFixed(5)}</span>
              <span>Precisión ±{registro.precisionGpsMetros} m</span>
            </div>
          </div>
        </div>

        {/* Horas extra */}
        {horasExtra && (
          <section className="space-y-3 pt-4 border-t border-ui-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-ui-900">Horas extra</h4>
              <Badge variant={horasExtra.estado === 'Aprobado' ? 'success' : horasExtra.estado === 'Rechazado' ? 'error' : 'warning'} size="sm">
                {horasExtra.estado}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-ui-200 border border-ui-200 rounded-xl overflow-hidden">
              <Dato etiqueta="Horario" valor={`${horasExtra.inicio} – ${horasExtra.fin ?? 'en curso'}`} />
              <Dato etiqueta="Horas" valor={`${horasExtra.horasCalculadas} h`} />
              <Dato etiqueta="Tarifa" valor={`${formatCurrency(horasExtra.tarifaPorHora)} / h`} />
              <Dato etiqueta="A pagar" valor={formatCurrency(horasExtra.montoTotal)} />
            </dl>
            <p className="text-sm text-ui-700 break-words">
              <span className="text-ui-500">Motivo: </span>
              {horasExtra.motivo || 'Sin motivo capturado.'}
            </p>
            {horasExtra.coordenadasInicio && (
              <p className="text-xs text-ui-500 tabular-nums">
                Ubicación al iniciar: {horasExtra.coordenadasInicio.lat.toFixed(5)}, {horasExtra.coordenadasInicio.lng.toFixed(5)}
              </p>
            )}
            {puedeAutorizarHorasExtra && (
              <Button onClick={handleAutorizarHorasExtra} loading={procesando} className="w-full sm:w-auto">
                Autorizar horas extra
              </Button>
            )}
          </section>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        {onActualizarEstado && !registro.enSitio && (
          <Button
            variant="outline"
            onClick={handleMarcarFalta}
            disabled={procesando}
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            Marcar falta
          </Button>
        )}
        {onActualizarEstado && (
          <Button onClick={handleAprobar} loading={procesando}>
            {registro.enSitio ? 'Confirmar asistencia' : 'Justificar excepción'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
