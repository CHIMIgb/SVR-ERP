"use client";

/**
 * Sincronizador (plan §7c): envía la cola FIFO cuando hay señal.
 * Disparadores: al abrir la app · evento `online` · intervalo de 2 min.
 * Cada envío lleva `idempotenciaKey` en el BODY (el UUID del teléfono): el
 * ValidationPipe solo lee el body, no los headers. El endpoint debe respetar
 * la key para que un reenvío no duplique filas (convención de la cola).
 * Los errores NO bloquean la cola: el elemento queda para reintentar. Un
 * CONFLICTO de negocio (409) NO se reintenta: espera decisión humana.
 */
import {
  pendientes,
  marcarEnviada,
  marcarError,
  marcarConflicto,
  contarPendientes,
  type ElementoCola,
} from "./offline";

export type PuertoEnvio = (
  item: ElementoCola,
) => Promise<{ ok: boolean; conflicto?: boolean }>;

/** Envío real (import perezoso del apiClient: token en memoria + refresh único en 401). */
const puertoPorDefecto: PuertoEnvio = async (item) => {
  const { apiClient } = await import("@/lib/api");
  const res = await apiClient.post(item.endpoint, {
    ...item.payload,
    idempotenciaKey: item.id,
  });
  return {
    ok: res.success === true,
    conflicto: res.success === false && res.error.code === "CONFLICT",
  };
};

let corriendo = false;

/**
 * Una pasada de sincronización: envía los pendientes en orden.
 * Devuelve cuántos se enviaron con éxito.
 */
export async function sincronizarAhora(enviar: PuertoEnvio = puertoPorDefecto): Promise<number> {
  if (corriendo) return 0; // una sola pasada a la vez
  corriendo = true;
  let enviados = 0;
  try {
    // Los conflictos NO se reenvían: esperan decisión humana (descartar/reencolar).
    const cola = (await pendientes()).filter((i) => i.estado !== "conflicto");
    for (const item of cola) {
      try {
        const { ok, conflicto } = await enviar(item);
        if (ok) {
          await marcarEnviada(item.id);
          enviados++;
        } else if (conflicto) {
          await marcarConflicto(item.id);
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
