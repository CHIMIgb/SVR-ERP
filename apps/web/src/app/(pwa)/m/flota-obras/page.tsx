"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, MapPin, RefreshCw, Truck } from "lucide-react";
import { maquinasApi, type FlotaCampoDTO } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { AvisoSinConexion } from "@/components/pwa/AvisoSinConexion";
import { TarjetaMaquina, enlaceMapaClase } from "@/components/pwa/TarjetaMaquina";
import { guardarDatos, leerDatos } from "@/lib/pwa/datos-cache";
import { MENSAJE_SIN_CONEXION, fechaHoyEnZona, fechaLarga, mensajeDeApi } from "@/lib/pwa/asistencia-propia";
import {
  agruparPorObra,
  contarPestanas,
  esFlotaValida,
  filtrarMaquinas,
  totalPorObra,
  urlMapa,
  type PestanaFlota,
} from "@/lib/pwa/flota-campo";

/**
 * "Flota y obras" (PWA, rol Técnico): dónde está cada máquina hoy, quién la opera y cómo llegar.
 * Datos de GET /maquinas/campo (permiso propio maquinaria.flota_campo:ver: solo lo de la pantalla, sin costos).
 *
 * - La lista llega completa y la búsqueda y las pestañas se resuelven aquí: instantáneo y también sin señal.
 * - Sin señal (o con el servidor caído) se muestra la última copia guardada en el teléfono, con el aviso de
 *   AvisoSinConexion; si esa copia es de otro día lo dice claro y no habla de "hoy" (revisión 2026-11-24).
 * - Si falla "Actualizar" con datos en pantalla, se conservan y se avisa arriba (antes se borraban por la
 *   pantalla de error). Sin datos ni copia: error con Reintentar.
 * - Del diseño falta el ingeniero de cada obra: no existe en los datos (pregunta al cliente pendiente).
 * - El estado de cada máquina es el registrado en oficina (`maquinas.estado`, igual que el escritorio).
 */

type Carga =
  | { tipo: "cargando" }
  // `ahora` y `hoy` se toman al llegar los datos (no en el render, que debe ser puro): sirven para "hace X min",
  // para saber si un ping ya está viejo y si la copia es de otro día.
  | { tipo: "ok"; datos: FlotaCampoDTO; ahora: Date; hoy: string }
  | { tipo: "error"; mensaje: string };

/** Clave de la copia sin señal en datos-cache (por usuario). Versionada: si cambia la forma, se sube a v2. */
const CLAVE_SNAPSHOT = "flota-campo:v1";

/** "YYYY-MM-DD" → fecha larga en la zona del negocio (mediodía UTC: cae en el mismo día en México). */
function diaLargo(fecha: string): string {
  return fechaLarga(new Date(`${fecha}T12:00:00Z`));
}

export default function FlotaObrasMovilPage() {
  const { user } = useAuth();
  // userId plano: el React Compiler no preserva la memoización con `user?.id` en las deps (igual que reportes).
  const userId = user?.id;
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  /** Fecha de la copia guardada que se está mostrando (null = datos vivos del servidor). */
  const [snapshot, setSnapshot] = useState<{ fecha: string | null } | null>(null);
  /** Falló "Actualizar" pero los datos de antes siguen en pantalla. */
  const [avisoActualizar, setAvisoActualizar] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState<PestanaFlota>("maquinaria");
  const solicitudRef = useRef(0);
  /** Día de los datos en pantalla, para el listener de visibilitychange (no lee `carga` con una closure vieja). */
  const fechaDatosRef = useRef<string | null>(null);

  // Sin setState antes del await: el estado inicial ya es "cargando" (regla react-hooks/set-state-in-effect).
  const cargar = useCallback(async () => {
    const solicitud = ++solicitudRef.current;
    // El apiClient LANZA sin red / con la API caída: sin este catch la pantalla se quedaba cargando para
    // siempre (lo corrigió chimi en el Inicio, aae4842). Solo se atrapa la llamada.
    const res = await maquinasApi.campo().catch(() => null);
    if (solicitud !== solicitudRef.current) return; // llegó una más nueva: descartar
    setRefrescando(false);
    const ahora = new Date();
    const hoy = fechaHoyEnZona();

    if (res?.success) {
      setCarga({ tipo: "ok", datos: res.data, ahora, hoy });
      setSnapshot(null);
      setAvisoActualizar(null);
      if (userId) guardarDatos(userId, CLAVE_SNAPSHOT, res.data);
      return;
    }

    // Solo sin conexión se sirve la copia: un 403 o un 500 se dicen tal cual, no se tapan con datos viejos.
    // API_DOWN es lo que devuelve el apiClient cuando el refresh del token falla sin red.
    const sinConexion = !res || res.error?.code === "API_DOWN";
    const mensaje = sinConexion ? MENSAJE_SIN_CONEXION : mensajeDeApi(res.error, "No se pudo cargar la flota.");
    const guardado = sinConexion && userId ? leerDatos<unknown>(userId, CLAVE_SNAPSHOT) : null;
    // Una copia corrupta o de otra versión se ignora (como si no hubiera): no debe dejar la pantalla en blanco.
    if (guardado && esFlotaValida(guardado.datos)) {
      setCarga({ tipo: "ok", datos: guardado.datos, ahora, hoy });
      setSnapshot({ fecha: guardado.fechaGuardada });
      setAvisoActualizar(null);
      return;
    }
    // Con datos ya en pantalla, el fallo no los borra: se conservan y se avisa arriba.
    setCarga((prev) => (prev.tipo === "ok" ? prev : { tipo: "error", mensaje }));
    setAvisoActualizar(mensaje);
  }, [userId]);

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, [cargar]);

  useEffect(() => {
    fechaDatosRef.current = carga.tipo === "ok" ? carga.datos.fecha : null;
  }, [carga]);

  // Al volver la señal se refresca solo (mismo patrón que /m/reportes). Al volver a la pestaña, solo si cambió
  // el día: una PWA abierta desde ayer seguiría diciendo "obras de hoy" con las de ayer.
  useEffect(() => {
    const alVolverLaSenal = () => {
      setRefrescando(true);
      void cargar();
    };
    const alVolverALaPestana = () => {
      if (document.visibilityState !== "visible") return;
      const fecha = fechaDatosRef.current;
      if (fecha && fecha !== fechaHoyEnZona()) {
        setRefrescando(true);
        void cargar();
      }
    };
    window.addEventListener("online", alVolverLaSenal);
    document.addEventListener("visibilitychange", alVolverALaPestana);
    return () => {
      window.removeEventListener("online", alVolverLaSenal);
      document.removeEventListener("visibilitychange", alVolverALaPestana);
    };
  }, [cargar]);

  const actualizar = () => {
    setRefrescando(true);
    void cargar();
  };

  const reintentar = () => {
    setCarga({ tipo: "cargando" });
    void cargar();
  };

  const todas = useMemo(() => (carga.tipo === "ok" ? carga.datos.maquinas : []), [carga]);
  const filtradas = useMemo(() => filtrarMaquinas(todas, busqueda), [todas, busqueda]);
  const conteo = useMemo(() => contarPestanas(filtradas), [filtradas]);
  const obras = useMemo(() => agruparPorObra(filtradas), [filtradas]);
  const totalObra = useMemo(() => totalPorObra(todas), [todas]);

  const encabezado = (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-ui-900">Flota y obras</h1>
      <p className="text-sm text-ui-500">Maquinaria y ubicación</p>
    </div>
  );

  if (carga.tipo === "cargando") {
    return (
      <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
        {encabezado}
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton variant="row" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </section>
    );
  }

  if (carga.tipo === "error") {
    return (
      <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
        {encabezado}
        <EmptyState
          icon={<CircleAlert className="w-10 h-10" />}
          title="No se pudo cargar la flota"
          subtitle={carga.mensaje}
          action={
            <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />} onClick={reintentar}>
              Reintentar
            </Button>
          }
        />
      </section>
    );
  }

  const { datos, ahora } = carga;
  const deOtroDia = datos.fecha !== carga.hoy;
  const cuando = deOtroDia ? "ese día" : "hoy";
  const buscando = busqueda.trim() !== "";

  // Encabezado de datos + avisos: van en todos los casos con datos (también con la flota vacía, que necesita
  // su Actualizar para ver altas nuevas).
  const barraDatos = (
    <>
      <AvisoSinConexion sirviendoSnapshot={snapshot !== null} fechaDatos={snapshot?.fecha} />
      {deOtroDia && (
        <p
          role="alert"
          className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm font-bold text-warning-dark dark:text-warning"
        >
          Estas asignaciones son del {diaLargo(datos.fecha)}, no de hoy. Con señal, Actualizar trae las de hoy.
        </p>
      )}
      {avisoActualizar && (
        <p
          role="alert"
          className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error dark:text-red-300"
        >
          No se pudo actualizar: {avisoActualizar} Lo que ves es de la carga anterior.
        </p>
      )}
      {datos.truncado && (
        <p className="rounded-xl border border-ui-200 bg-ui-50 p-3 text-xs text-ui-600">
          La lista llegó cortada: la flota pasa del tope que cabe en el teléfono. Si no encuentras una máquina,
          búscala en la vista de escritorio.
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-xs font-bold first-letter:uppercase min-w-0 truncate",
            deOtroDia ? "text-warning-dark dark:text-warning" : "text-ui-500",
          )}
        >
          {deOtroDia ? "Asignaciones del" : "Obras de hoy ·"} {diaLargo(datos.fecha)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className={cn("w-4 h-4", refrescando && "animate-spin")} />}
          onClick={actualizar}
          disabled={refrescando}
        >
          Actualizar
        </Button>
      </div>
    </>
  );

  if (datos.maquinas.length === 0) {
    return (
      <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
        {encabezado}
        {barraDatos}
        <EmptyState
          icon={<Truck className="w-10 h-10" />}
          title="No hay máquinas activas"
          subtitle="Cuando la oficina dé de alta la flota, aparecerá aquí con su obra del día."
        />
      </section>
    );
  }

  const cortada = datos.truncado ? " (la lista está cortada)" : "";
  const vacioPestana: Record<PestanaFlota, string> = {
    maquinaria: buscando ? `Ninguna máquina coincide con la búsqueda${cortada}.` : "No hay máquinas.",
    obras: buscando
      ? `Ninguna obra coincide con la búsqueda${cortada}.`
      : deOtroDia
        ? "Ese día ninguna máquina tenía obra asignada."
        : "Hoy ninguna máquina tiene obra asignada.",
    taller: buscando ? `Ninguna máquina en taller coincide con la búsqueda${cortada}.` : "No hay máquinas en taller.",
  };
  const maquinasPestana = pestana === "taller" ? filtradas.filter((m) => m.estado === "en_taller") : filtradas;
  const vacia = pestana === "obras" ? obras.length === 0 : maquinasPestana.length === 0;

  return (
    <section className="max-w-md mx-auto w-full flex flex-col gap-4 pb-2">
      {encabezado}
      {barraDatos}

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Máquina, obra o encargado" />

      <Tabs
        ariaLabel="Ver flota"
        value={pestana}
        onChange={(k) => setPestana(k as PestanaFlota)}
        tabs={[
          { key: "maquinaria", label: "Maquinaria", count: conteo.maquinaria },
          { key: "obras", label: "Obras", count: conteo.obras },
          { key: "taller", label: "En taller", count: conteo.taller },
        ]}
      >
        {vacia ? (
          <p className="text-sm text-ui-500 text-center py-6">{vacioPestana[pestana]}</p>
        ) : pestana === "obras" ? (
          <ul className="flex flex-col gap-4">
            {obras.map((obra) => {
              // El total es el real de la obra; con búsqueda se dice cuántas coinciden (no "1 máquina" si tiene 5).
              const total = totalObra.get(obra.proyectoId) ?? obra.maquinas.length;
              const resumen = [
                obra.ubicacion,
                `${total} ${total === 1 ? "máquina" : "máquinas"} ${cuando}`,
                buscando && obra.maquinas.length !== total ? `${obra.maquinas.length} coinciden` : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={obra.proyectoId} className="flex flex-col gap-2">
                  <div className="bg-surface border border-ui-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-black tracking-tight text-ui-900 break-words">{obra.nombre}</p>
                      <p className="text-xs text-ui-500 break-words">{resumen}</p>
                    </div>
                    {obra.lat != null && obra.lng != null && (
                      <a
                        href={urlMapa(obra.lat, obra.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={enlaceMapaClase}
                        aria-label={`Ver en el mapa la obra ${obra.nombre}`}
                      >
                        <MapPin className="w-4 h-4" aria-hidden />
                        Ver obra
                      </a>
                    )}
                  </div>
                  <ul className="flex flex-col gap-2 pl-3 border-l-2 border-ui-200">
                    {obra.maquinas.map((m) => (
                      <li key={m.id}>
                        <TarjetaMaquina maquina={m} ahora={ahora} ocultarObra deOtroDia={deOtroDia} />
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2">
            {maquinasPestana.map((m) => (
              <li key={m.id}>
                <TarjetaMaquina maquina={m} ahora={ahora} deOtroDia={deOtroDia} />
              </li>
            ))}
          </ul>
        )}
      </Tabs>
    </section>
  );
}
