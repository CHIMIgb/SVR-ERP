"use client";

/**
 * Sincronizador (plan §7c): envía la cola FIFO cuando hay señal.
 * Disparadores: al abrir la app · evento `online` · intervalo de 2 min.
 * Cada envío lleva `idempotenciaKey` en el BODY (el UUID del teléfono): el
 * ValidationPipe solo lee el body, no los headers. El endpoint debe respetar
 * la key para que un reenvío no duplique filas (convención de la cola).
 * Los errores NO bloquean la cola: el elemento queda para reintentar. Un
 * CONFLICTO de negocio (409) NO se reintenta: espera decisión humana. Un
 * RECHAZO (4xx ≠ 409) tampoco: estado terminal "rechazado" (bloqueante 5
 * PR #23) — el server ya validó y negó la captura; martillarlo cada 2 min
 * no la arregla. El envío devuelve los IDS enviados, no un conteo global.
 */
import {
  pendientes,
  marcarEnviada,
  marcarError,
  marcarConflicto,
  marcarRechazada,
  guardarAdjuntosPendientes,
  contarPendientes,
  type ElementoCola,
} from "./offline";

export type PuertoEnvio = (
  item: ElementoCola,
) => Promise<{ ok: boolean; conflicto?: boolean; rechazo?: boolean; data?: unknown }>;

/** Códigos 4xx del contrato (AllExceptionsFilter) que son rechazo terminal:
 * solo los de DATOS (400/403/404/422) — el server validó y negó la captura.
 * 401 (sesión), 423 (bloqueo IP) y 429 (throttler) NO van aquí: son
 * temporales y el reporte es válido → quedan en `error` reintentable
 * (I-1, revisión PR #23). */
const CODIGOS_RECHAZO_TERMINAL = new Set([
  'BAD_REQUEST',
  'FORBIDDEN',
  'NOT_FOUND',
  'UNPROCESSABLE_ENTITY',
]);

/**
 * Códigos 4xx del ADJUNTO que son rechazo terminal (menor 1 revisión PR
 * #23): esa foto NO subirá reintentando igual (demasiado grande, tipo
 * inválido, sin permiso). El reporte ya existe (ACK del alta); la decisión
 * de Descartar/Reintentar es humana en EstadoCola.
 */
const CODIGOS_ADJUNTO_TERMINAL = new Set([
  ...CODIGOS_RECHAZO_TERMINAL,
  'PAYLOAD_TOO_LARGE', // 413: la foto excede el límite del server
]);

/** Envío real (import perezoso del apiClient: token en memoria + refresh único en 401). */
const puertoPorDefecto: PuertoEnvio = async (item) => {
  const { apiClient } = await import("@/lib/api");
  const res = await apiClient.post(item.endpoint, {
    ...item.payload,
    idempotenciaKey: item.id,
  });
  const codigo = res.success === false ? res.error.code : undefined;
  return {
    ok: res.success === true,
    // 409 = CONFLICTO de negocio (duplicado): espera decisión humana
    conflicto: codigo === 'CONFLICT',
    // resto de 4xx = RECHAZO terminal (el server validó y negó la captura)
    rechazo: codigo !== undefined && CODIGOS_RECHAZO_TERMINAL.has(codigo),
    data: res.success === true ? res.data : undefined,
  };
};

let corriendo = false;

/**
 * Una pasada de sincronización: envía los pendientes en orden.
 * Devuelve los IDS enviados con éxito (bloqueante 5 PR #23: el conteo de
 * TODA la cola hacía felicitar un envío que no era el del operario).
 */
export async function sincronizarAhora(enviar: PuertoEnvio = puertoPorDefecto): Promise<string[]> {
  const enviados: string[] = [];
  if (corriendo) return enviados; // una sola pasada a la vez
  corriendo = true;
  try {
    // Los conflictos NO se reenvían: esperan decisión humana (descartar/reencolar).
    // Los RECHAZADOS tampoco: el server los validó y negó (4xx ≠ 409).
    const cola = (await pendientes()).filter(
      (i) => i.estado !== "conflicto" && i.estado !== "rechazado",
    );
    for (const item of cola) {
      try {
        const { ok, conflicto, rechazo, data } = await enviar(item);
        if (ok) {
          // Fotos del alta: el reporte ya existe (ACK, y el reenvío con la
          // misma idempotenciaKey devuelve el original sin duplicar folio).
          // Cada adjunto se revisa por `res.success` (apiClient NO lanza ante
          // 403/413/422): el item solo se elimina cuando TODAS subieron; si
          // faltan, queda en la cola para reintentar SOLO las faltantes
          // (PR #23, bloqueante 1: sin esto se borraban fotos sin avisar).
          const nuevoId =
            data && typeof data === 'object' && 'id' in data && typeof (data as { id: unknown }).id === 'string'
              ? (data as { id: string }).id
              : null;
          let faltantes: number[] = [];
          let algunaRechazada = false;
          if (item.adjuntos?.length) {
            faltantes = item.adjuntosPendientes ?? item.adjuntos.map((_, i) => i);
            if (nuevoId) {
              const { reportesCampoApi } = await import('@/lib/api');
              for (const idx of faltantes.slice()) {
                const adj = item.adjuntos[idx];
                try {
                  // SIN `tamano`: el server lo calcula del base64 (whitelist lo rechaza)
                  const res = await reportesCampoApi.adjuntar(nuevoId, {
                    nombre: adj.nombre,
                    mime: adj.mime,
                    datos: adj.datos,
                  });
                  if (res.success) faltantes = faltantes.filter((i) => i !== idx);
                  else {
                    const codigo = res.error?.code;
                    if (codigo && CODIGOS_ADJUNTO_TERMINAL.has(codigo)) algunaRechazada = true;
                    console.warn('Adjunto fallido (reporte ya guardado):', adj.nombre);
                  }
                } catch {
                  // Error de RED (apiClient lanza): deja de intentar y conserva
                  // los índices restantes — el item no se pierde (bloqueante 1)
                  console.warn('Adjunto sin señal (reporte ya guardado):', adj.nombre);
                  break;
                }
              }
            }
          }
          if (faltantes.length > 0) {
            await guardarAdjuntosPendientes(item.id, faltantes, algunaRechazada);
            // Menor 1: el item NO entra a `enviados` — el modal no felicita
            // con fotos sin subir; el estado real lo pinta EstadoCola.
          } else {
            await marcarEnviada(item.id);
            enviados.push(item.id);
          }
        } else if (conflicto) {
          await marcarConflicto(item.id);
        } else if (rechazo) {
          // 4xx ≠ 409: estado TERMINAL — no martillar el server cada 2 min
          await marcarRechazada(item.id);
        } else {
          await marcarError(item.id);
        }
      } catch {
        await marcarError(item.id);
      }
    }
  } finally {
    corriendo = false;
  }
  return enviados;
}

/** ¿Hay señal? (la app decide con navigator.onLine + eventos). */
export function haySenal(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/** Arranca los disparadores del sincronizador (idempotente). */
export function iniciarSincronizador(onCambio?: (pendientes: number) => void): () => void {
  const avisar = () => {
    contarPendientes().then((n) => onCambio?.(n));
  };

  const pasada = () => {
    if (!haySenal()) return;
    sincronizarAhora().then(() => avisar());
  };

  pasada();
  window.addEventListener("online", pasada);
  const intervalo = window.setInterval(pasada, 120_000); // 2 min

  return () => {
    window.removeEventListener("online", pasada);
    window.clearInterval(intervalo);
  };
}
