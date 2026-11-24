"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Clock, MapPin, Check, LogOut, RefreshCw, UserX, Building2, CircleAlert, CircleCheck } from "lucide-react";
import { asistenciaApi, type MiAsistenciaDTO, type RegistroAsistenciaDTO } from "@/lib/api";
import { formatHora12 } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import {
  DISPOSITIVO_PWA,
  MENSAJE_SIN_CONEXION,
  TOLERANCIA_RETARDO_MINUTOS,
  distanciaMetros,
  fechaLarga,
  horaActual,
  mensajeDeApi,
  minutosTarde,
  obtenerUbicacion,
  varianteEstado,
  type UbicacionDispositivo,
} from "@/lib/pwa/asistencia-propia";

/**
 * Asistencia propia (PWA, rebanada 2). El trabajador checa SU entrada y SU salida con el GPS del teléfono:
 * la API toma al trabajador del token y valida geocerca, obra asignada y omisión. Lo que se muestra aquí
 * ("dentro de la zona", "llegas tarde") es aviso; la decisión es del servidor.
 *
 * Sin cola offline a propósito: la hora del marcaje la pone el servidor al recibirlo, así que una entrada
 * encolada sin señal quedaría con la hora en que volvió la señal, no con la hora real.
 *
 * Pendiente del cliente: foto obligatoria y catálogo de motivos del retardo (el comentario ya viaja en `notas`).
 */

type EstadoGps =
  | { tipo: "obteniendo" }
  | { tipo: "ok"; ubicacion: UbicacionDispositivo }
  | { tipo: "error"; mensaje: string };

type Carga =
  | { tipo: "cargando" }
  | { tipo: "ok"; datos: MiAsistenciaDTO }
  | { tipo: "sin-enlace" }
  | { tipo: "error"; mensaje: string };

export function MiAsistencia() {
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const [gps, setGps] = useState<EstadoGps>({ tipo: "obteniendo" });
  const [ahora, setAhora] = useState(() => new Date());
  const [obraId, setObraId] = useState("");
  const [comentario, setComentario] = useState("");
  const [salidaAnticipada, setSalidaAnticipada] = useState(false);
  const [motivoSalida, setMotivoSalida] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  // Descarta respuestas viejas si el trabajador recarga o pide el GPS otra vez antes de que llegue la anterior.
  const solicitudCargaRef = useRef(0);
  const solicitudGpsRef = useRef(0);

  // Sin setState antes del await: el estado inicial ya es "cargando" y al recargar tras checar no se
  // vuelve a mostrar el esqueleto (la pantalla se actualiza en su lugar). Devuelve los datos nuevos (o null).
  // `conservar`: recarga después de checar. Si falla, se deja la pantalla como está (formulario, obra y aviso)
  // en vez de cambiarla por "No se pudo cargar" (revisión: un rechazo normal acababa en pantalla de error).
  const cargar = useCallback(async (conservar = false): Promise<MiAsistenciaDTO | null> => {
    const solicitud = ++solicitudCargaRef.current;
    // API caída / sin señal: el apiClient LANZA en vez de devolver success:false. Sin este catch la pantalla se
    // quedaba cargando para siempre (lo corrigió chimi en el Inicio, aae4842). Solo se atrapa la llamada.
    const res = await asistenciaApi.mia().catch(() => null);
    if (solicitud !== solicitudCargaRef.current) return null;
    if (res?.success) {
      const datos = res.data;
      setCarga({ tipo: "ok", datos });
      // Preselecciona la primera obra donde sí se puede checar.
      setObraId((actual) =>
        datos.obras.some((o) => o.id === actual && o.geocerca) ? actual : (datos.obras.find((o) => o.geocerca)?.id ?? ""),
      );
      return datos;
    }
    if (conservar) return null;
    if (!res) setCarga({ tipo: "error", mensaje: MENSAJE_SIN_CONEXION });
    else if (res.error.code === "NOT_FOUND") setCarga({ tipo: "sin-enlace" });
    else setCarga({ tipo: "error", mensaje: mensajeDeApi(res.error, "No se pudo cargar tu asistencia.") });
    return null;
  }, []);

  const pedirUbicacion = useCallback(async () => {
    const solicitud = ++solicitudGpsRef.current;
    try {
      const ubicacion = await obtenerUbicacion();
      if (solicitud === solicitudGpsRef.current) setGps({ tipo: "ok", ubicacion });
    } catch (e) {
      if (solicitud === solicitudGpsRef.current) {
        setGps({ tipo: "error", mensaje: e instanceof Error ? e.message : "No se pudo obtener la ubicación." });
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([cargar(), pedirUbicacion()]);
    })();
  }, [cargar, pedirUbicacion]);

  const reintentarCarga = () => {
    setCarga({ tipo: "cargando" });
    void cargar();
  };
  const actualizarUbicacion = () => {
    setGps({ tipo: "obteniendo" });
    void pedirUbicacion();
  };

  // El aviso de retardo depende de la hora: se refresca cada 30 s.
  useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const datos = carga.tipo === "ok" ? carga.datos : null;
  const registro = datos?.registroHoy ?? null;
  const fase: "entrada" | "salida" | "cerrada" = !registro?.horaEntrada
    ? "entrada"
    : registro.horaSalida
      ? "cerrada"
      : "salida";

  const obra = datos?.obras.find((o) => o.id === obraId) ?? null;
  const distancia = useMemo(() => {
    if (gps.tipo !== "ok" || !obra?.geocerca) return null;
    return distanciaMetros(gps.ubicacion.lat, gps.ubicacion.lng, obra.geocerca.lat, obra.geocerca.lng);
  }, [gps, obra]);
  const dentroDeZona = distancia !== null && obra?.geocerca ? distancia <= obra.geocerca.radioMetros : null;

  const tarde = minutosTarde(datos?.trabajador.entradaProgramada, ahora);
  const esRetardo = fase === "entrada" && tarde !== null && tarde > TOLERANCIA_RETARDO_MINUTOS;

  const registrar = async () => {
    if (gps.tipo !== "ok" || enviando) return;
    setEnviando(true);
    setResultado(null);
    const { lat, lng, precisionGpsMetros } = gps.ubicacion;
    const solicitud =
      fase === "entrada"
        ? asistenciaApi.marcarEntradaPropia({
            obraId,
            lat,
            lng,
            precisionGpsMetros,
            dispositivo: DISPOSITIVO_PWA,
            notas: comentario.trim() || undefined,
          })
        : asistenciaApi.marcarSalidaPropia({
            lat,
            lng,
            precisionGpsMetros,
            dispositivo: DISPOSITIVO_PWA,
            salidaAnticipada: salidaAnticipada || undefined,
            motivoSalidaAnticipada: salidaAnticipada ? motivoSalida.trim() : undefined,
          });
    // Si se va la señal al checar, el apiClient LANZA: el `.catch` lo vuelve aviso y el `finally` libera el botón
    // pase lo que pase. Antes se quedaba trabado en "enviando" (mismo bug que chimi corrigió en el Inicio,
    // aae4842). No quitar ninguno de los dos.
    try {
      const res = await solicitud.catch(() => null);
      if (res?.success) {
        const registrado = res.data;
        setAhora(new Date());
        setResultado({ tipo: "ok", texto: mensajeExito(fase, registrado) });
        setComentario("");
        setSalidaAnticipada(false);
        setMotivoSalida("");
        // La pantalla pasa de fase con lo que respondió la API, sin esperar la recarga (si la recarga falla, no
        // vuelve a ofrecer checar lo que ya quedó).
        setCarga((previa) => (previa.tipo === "ok" ? { tipo: "ok", datos: { ...previa.datos, registroHoy: registrado } } : previa));
        await cargar(true);
        return;
      }
      // Falló (sin señal o rechazo de la API). Si la petición sí llegó y se perdió la respuesta con la señal, el
      // registro ya existe: se recarga sin perder la pantalla y, si ya quedó, se dice eso en vez de pedir otro
      // intento (revisión: antes el trabajador veía "intenta de nuevo" con la entrada ya guardada).
      const actual = await cargar(true);
      const yaQuedo = fase === "entrada" ? actual?.registroHoy?.horaEntrada : actual?.registroHoy?.horaSalida;
      if (yaQuedo && actual?.registroHoy) {
        setResultado({ tipo: "ok", texto: mensajeExito(fase, actual.registroHoy) });
      } else if (!res) {
        // Una escritura sin respuesta no se sabe si quedó: no se dice "revisa tu señal" como si nada hubiera pasado.
        setResultado({ tipo: "error", texto: `No se pudo confirmar tu registro. ${MENSAJE_SIN_CONEXION}` });
      } else {
        setResultado({ tipo: "error", texto: mensajeDeApi(res.error, "No se pudo registrar. Intenta de nuevo.") });
      }
    } finally {
      setEnviando(false);
    }
  };

  if (carga.tipo === "cargando") {
    return (
      <section className="max-w-md mx-auto w-full flex flex-col gap-4" aria-busy="true">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </section>
    );
  }

  if (carga.tipo === "sin-enlace") {
    return (
      <EmptyState
        icon={<UserX className="w-10 h-10" />}
        title="Tu cuenta aún no está enlazada"
        subtitle="Pide a la oficina que enlace tu cuenta con tu registro de trabajador para poder checar."
      />
    );
  }

  if (carga.tipo === "error") {
    return (
      <EmptyState
        icon={<CircleAlert className="w-10 h-10" />}
        title="No se pudo cargar tu asistencia"
        subtitle={carga.mensaje}
        action={
          <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />} onClick={reintentarCarga}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const d = carga.datos;

  if (d.trabajador.estado !== "ACTIVO") {
    return (
      <EmptyState
        icon={<Clock className="w-10 h-10" />}
        title={d.trabajador.estado === "VACACIONES" ? "Estás de vacaciones" : "Tu registro está dado de baja"}
        subtitle="Mientras tanto no se registra asistencia. Si es un error, avisa a la oficina."
      />
    );
  }

  const obrasConUbicacion = d.obras.filter((o) => o.geocerca);
  const necesitaObra = fase === "entrada";
  const sinObra = necesitaObra && d.obras.length === 0;
  const sinUbicacion = necesitaObra && d.obras.length > 0 && obrasConUbicacion.length === 0;
  const motivoSalidaValido = !salidaAnticipada || motivoSalida.trim().length >= 3;
  const puedeRegistrar =
    fase !== "cerrada" &&
    gps.tipo === "ok" &&
    !enviando &&
    (!necesitaObra || Boolean(obra?.geocerca)) &&
    (fase !== "salida" || motivoSalidaValido);

  return (
    <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
      <AvisoDelDia
        fase={fase}
        registro={registro}
        turnoNocturno={d.turnoNocturnoAbierto}
        entradaProgramada={d.trabajador.entradaProgramada}
        ahora={ahora}
        tarde={tarde}
        esRetardo={esRetardo}
      />

      {resultado && (
        <div
          role="status"
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm font-semibold flex items-start gap-2",
            resultado.tipo === "ok"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error",
          )}
        >
          {resultado.tipo === "ok" ? (
            <CircleCheck className="w-5 h-5 shrink-0" />
          ) : (
            <CircleAlert className="w-5 h-5 shrink-0" />
          )}
          <span>{resultado.texto}</span>
        </div>
      )}

      {sinObra && (
        <EmptyState
          icon={<Building2 className="w-10 h-10" />}
          title="No tienes una obra asignada"
          subtitle="Pide a tu encargado que te asigne a un proyecto para poder checar."
        />
      )}

      {sinUbicacion && (
        <EmptyState
          icon={<MapPin className="w-10 h-10" />}
          title="Tu obra aún no tiene ubicación"
          subtitle="Mientras la oficina no registre la ubicación de la obra no se puede checar en ella."
        />
      )}

      {fase !== "cerrada" && !sinObra && !sinUbicacion && (
        <div className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-black text-ui-900">Tu ubicación</h2>
            <EtiquetaGps gps={gps} dentroDeZona={dentroDeZona} />
          </div>

          {necesitaObra && obrasConUbicacion.length > 1 ? (
            <Select
              label="Obra"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              options={obrasConUbicacion.map((o) => ({ value: o.id, label: o.nombre }))}
            />
          ) : (
            necesitaObra &&
            obra && (
              <p className="flex items-center gap-2 text-sm text-ui-700">
                <Building2 className="w-4 h-4 text-ui-500 shrink-0" />
                <span className="font-semibold truncate">{obra.nombre}</span>
              </p>
            )
          )}

          <DetalleGps gps={gps} distancia={distancia} dentroDeZona={dentroDeZona} necesitaObra={necesitaObra} />

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={actualizarUbicacion}
            disabled={gps.tipo === "obteniendo"}
            className="self-start"
          >
            Actualizar ubicación
          </Button>
        </div>
      )}

      {fase === "entrada" && esRetardo && !sinObra && !sinUbicacion && (
        <div className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-black text-ui-900">¿Qué pasó?</h2>
            <Badge variant="warning" size="sm">Opcional</Badge>
          </div>
          <p className="text-xs text-ui-500">
            Tu entrada quedará en revisión (omisión) hasta que la oficina la resuelva. Lo que escribas le llega con
            tu registro.
          </p>
          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Cuéntale a tu encargado qué pasó"
            maxLength={500}
            showCounter
            rows={3}
          />
        </div>
      )}

      {fase === "salida" && (
        <div className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-3">
          <Switch
            checked={salidaAnticipada}
            onChange={setSalidaAnticipada}
            label="Salgo antes de terminar mi turno"
          />
          {salidaAnticipada && (
            <Textarea
              label="Motivo"
              value={motivoSalida}
              onChange={(e) => setMotivoSalida(e.target.value)}
              placeholder="Ej. cita médica"
              maxLength={500}
              rows={2}
              error={motivoSalida.length > 0 && !motivoSalidaValido ? "Escribe al menos 3 letras" : undefined}
            />
          )}
        </div>
      )}

      {fase !== "cerrada" && !sinObra && !sinUbicacion && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={enviando}
          disabled={!puedeRegistrar}
          icon={fase === "entrada" ? <Check className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          onClick={() => void registrar()}
        >
          {fase === "entrada" ? "Registrar entrada" : "Registrar salida"}
        </Button>
      )}

      {fase === "cerrada" && registro && <ResumenJornada registro={registro} />}
    </section>
  );
}

function mensajeExito(fase: "entrada" | "salida" | "cerrada", r: RegistroAsistenciaDTO): string {
  if (fase === "entrada") {
    // formatHora12 ya termina en "a.m."/"p.m.": la hora nunca va seguida de otro punto.
    const hora = r.horaEntrada ? formatHora12(r.horaEntrada) : "";
    const zona = r.enSitio ? "" : ", fuera de la zona de la obra";
    if (r.estado === "Omisión") return `Entrada registrada${zona}. Quedó en revisión por llegar tarde (${hora})`;
    return `Entrada registrada a las ${hora}${zona}`;
  }
  return `Salida registrada a las ${r.horaSalida ? formatHora12(r.horaSalida) : ""}`;
}

function AvisoDelDia({
  fase,
  registro,
  turnoNocturno,
  entradaProgramada,
  ahora,
  tarde,
  esRetardo,
}: {
  fase: "entrada" | "salida" | "cerrada";
  registro: RegistroAsistenciaDTO | null;
  turnoNocturno: boolean;
  entradaProgramada?: string;
  ahora: Date;
  tarde: number | null;
  esRetardo: boolean;
}) {
  const turno = entradaProgramada ? `Turno ${formatHora12(entradaProgramada)}` : "Sin horario registrado";
  let titulo: string;
  // "ahora" solo sirve antes de checar (para ver cuánto falta o cuánto se pasó).
  let detalle = fase === "entrada" ? `${turno} · ahora ${formatHora12(horaActual(ahora))}` : turno;
  let insignia: ReactNode = null;

  if (fase === "entrada") {
    if (tarde !== null && tarde > 0) {
      titulo = `Llegas ${tarde} min tarde`;
      insignia = esRetardo ? (
        <Badge variant="warning" size="sm">Retardo</Badge>
      ) : (
        <Badge variant="neutral" size="sm">En tolerancia</Badge>
      );
    } else {
      titulo = "Aún no registras tu entrada";
    }
  } else {
    const entrada = registro?.horaEntrada ? formatHora12(registro.horaEntrada) : "";
    titulo = fase === "salida" ? `Entrada ${entrada}` : "Jornada cerrada";
    if (turnoNocturno) detalle = "Turno de ayer: falta registrar tu salida";
    insignia = registro ? (
      <Badge variant={varianteEstado(registro.estado)} size="sm">
        {registro.estado}
      </Badge>
    ) : null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 flex items-start gap-3",
        esRetardo ? "bg-warning/10 border-warning/30" : "bg-surface border-ui-200",
      )}
    >
      <Clock className={cn("w-6 h-6 shrink-0 mt-0.5", esRetardo ? "text-warning" : "text-ui-500")} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-ui-500 first-letter:uppercase">Hoy · {fechaLarga(ahora)}</p>
        <p className="text-lg font-black text-ui-900 leading-tight mt-0.5">{titulo}</p>
        <p className="text-xs text-ui-500 mt-1">{detalle}</p>
      </div>
      {insignia && <div className="shrink-0">{insignia}</div>}
    </div>
  );
}

function EtiquetaGps({ gps, dentroDeZona }: { gps: EstadoGps; dentroDeZona: boolean | null }) {
  if (gps.tipo === "obteniendo") return <Badge variant="neutral" size="sm">Buscando GPS…</Badge>;
  if (gps.tipo === "error") return <Badge variant="error" size="sm">Sin GPS</Badge>;
  if (dentroDeZona === false) return <Badge variant="warning" size="sm">Fuera de zona</Badge>;
  return <Badge variant="success" size="sm">GPS ok</Badge>;
}

function DetalleGps({
  gps,
  distancia,
  dentroDeZona,
  necesitaObra,
}: {
  gps: EstadoGps;
  distancia: number | null;
  dentroDeZona: boolean | null;
  necesitaObra: boolean;
}) {
  if (gps.tipo === "obteniendo") {
    return <p className="text-sm text-ui-500">Buscando tu ubicación… puede tardar unos segundos.</p>;
  }
  if (gps.tipo === "error") {
    return <p className="text-sm text-error">{gps.mensaje}</p>;
  }
  const precision = `Precisión ±${gps.ubicacion.precisionGpsMetros} m`;
  if (!necesitaObra || distancia === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-ui-700">
        <MapPin className="w-4 h-4 text-ui-500 shrink-0" />
        Ubicación lista · {precision}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-2 text-sm text-ui-700">
        <MapPin className="w-4 h-4 text-ui-500 shrink-0" />
        {dentroDeZona ? "Dentro de la zona de la obra" : `Fuera de la zona: a ${formatearDistancia(distancia)} de la obra`}
      </p>
      <p className="text-xs text-ui-500">{precision}</p>
      {!dentroDeZona && (
        <p className="text-xs text-warning font-semibold">
          Puedes checar, pero tu entrada quedará marcada como fuera de la zona.
        </p>
      )}
    </div>
  );
}

function formatearDistancia(metros: number): string {
  return metros >= 1000 ? `${(metros / 1000).toFixed(1)} km` : `${Math.round(metros)} m`;
}

function ResumenJornada({ registro }: { registro: RegistroAsistenciaDTO }) {
  const filas: [string, string][] = [
    ["Entrada", registro.horaEntrada ? formatHora12(registro.horaEntrada) : "—"],
    ["Salida", registro.horaSalida ? formatHora12(registro.horaSalida) : "—"],
    [
      "Horas",
      registro.horasTrabajadasOrdinarias != null ? `${registro.horasTrabajadasOrdinarias} h` : "—",
    ],
  ];
  return (
    <div className="bg-surface border border-ui-200 rounded-2xl p-4 flex flex-col gap-3">
      <h2 className="text-sm font-black text-ui-900">Tu jornada de hoy</h2>
      <dl className="grid grid-cols-2 gap-3">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-ui-500">{etiqueta}</dt>
            <dd className="text-sm font-semibold text-ui-900 truncate">{valor}</dd>
          </div>
        ))}
      </dl>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ui-500">Obra</p>
        <p className="text-sm font-semibold text-ui-900 break-words">{registro.obraAsignada || "—"}</p>
      </div>
      {!registro.enSitio && (
        <p className="text-xs text-warning font-semibold">La entrada quedó marcada como fuera de la zona.</p>
      )}
    </div>
  );
}
