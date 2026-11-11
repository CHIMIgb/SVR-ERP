"use client";

/**
 * Sincronizador (plan §7c): envía la cola FIFO cuando hay señal.
 * Disparadores: al abrir la app · evento `online` · intervalo de 2 min.
 * Cada envío lleva `X-Idempotencia-Key` (el UUID del teléfono) — los
 * reenvíos NUNCA duplican filas en el servidor.
 * Los errores NO bloquean la cola: el elemento queda para reintentar.
 */
import { pendientes, marcarEnviada, marcarError, contarPendientes, type ElementoCola } from "./offline";

export type PuertoEnvio = (
  item: ElementoCola,
) => Promise<{ ok: boolean }>;

/** Envío real (import perezoso del apiClient con el token en memoria). */
const puertoPorDefecto: PuertoEnvio = async (item) => {
  const { getAccessToken } = await import("@/lib/api");
  const token = getAccessToken();
  const r = await fetch(`/api${item.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotencia-Key": item.id,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(item.payload),
  });
  return { ok: r.status >= 200 && r.status < 300 };
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
    const cola = await pendientes();
    for (const item of cola) {
      try {
        const { ok } = await enviar(item);
        if (ok) {
          await marcarEnviada(item.id);
          enviados++;
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
