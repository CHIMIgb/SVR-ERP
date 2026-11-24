"use client";

/**
 * Cola local (outbox) para capturas sin internet — plan §7c
 * (`pwa/offline-y-sincronizacion.md`). IndexedDB directo: wrapper mínimo,
 * SIN dependencias nuevas. La identidad de cada registro es un UUID
 * generado EN EL TELÉFONO → los reenvíos son idempotentes en el servidor.
 */
import { STORAGE_KEYS } from "@svr-erp/shared";

/** Foto del alta: base64 puro (WebP convertido localmente, sin red). */
export interface AdjuntoPendiente {
  nombre: string;
  mime: string;
  tamano: number;
  datos: string;
}

export interface ElementoCola {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  creado_en: string;
  intentos: number;
  /**
   * `rechazado` = estado TERMINAL: el server validó y negó la captura
   * (4xx de datos: 400/403/404/422) — NO se reenvía sola; espera decisión
   * humana (Descartar/Reintentar en EstadoCola). `conflicto` = 409 de
   * negocio (duplicado); `error` = fallo de red/5xx (se reintentan solos).
   */
  estado: "pendiente" | "error" | "conflicto" | "rechazado";
  /**
   * Dueño de la captura (id del usuario que encoló, tercera revisión 2026-
   * 11-22): el envío usa el token de la SESIÓN activa, así que una captura
   * solo sale con el token de quien la capturó — B nunca envía lo
   * pendiente de A. `undefined` = item VIEJO (anterior a este campo): no
   * se envía solo ni se cuenta — muere en el logout.
   */
  usuarioId?: string;
  /**
   * Fotos del alta — NO van en el payload (el ValidationPipe rechazaría el
   * POST). Tras el ACK del reporte el sincronizador las adjunta en secuencia.
   */
  adjuntos?: AdjuntoPendiente[];
  /**
   * Índices (sobre `adjuntos`) que aún NO subieron al server. `undefined` =
   * todas pendientes (primera pasada); vacío = subieron todas. El item solo
   * se elimina de la cola cuando esta lista queda vacía (PR #23, bloqueante 1:
   * sin esto un 403/413/422 de adjunto borraba el item con las fotos dentro).
   */
  adjuntosPendientes?: number[];
}

const DB_NOMBRE = "svr-pwa";
const STORE = "outbox";

/**
 * Usuario de la SESIÓN ACTIVA (del perfil persistido en `localStorage`).
 * El envío de la cola usa su token — la cola es de UN usuario por vez.
 */
export function usuarioSesionId(): string | null {
  try {
    const crudo = localStorage.getItem(STORAGE_KEYS.USER);
    if (!crudo) return null;
    const user = JSON.parse(crudo) as { id?: string };
    return typeof user.id === "string" && user.id ? user.id : null;
  } catch {
    return null;
  }
}

/** Abre la BD (una sola vez por pestaña). */
function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOMBRE, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function conStore<T>(modo: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await abrir();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, modo);
    const req = fn(tx.objectStore(STORE));
    // `onsuccess` de la request llega ANTES del commit: resolver ahí deja una
    // ventana donde un reload (HMR) pierde la captura recién encolada.
    let resultado: T;
    req.onsuccess = () => { resultado = req.result as T; };
    tx.oncomplete = () => resolve(resultado);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? req.error);
  });
}

/** UUID v4 del dispositivo (criptográfico). */
export function nuevoId(): string {
  return globalThis.crypto.randomUUID();
}

/** Encola una captura para sincronizar cuando haya señal. */
export async function encolar(
  endpoint: string,
  payload: Record<string, unknown>,
  adjuntos?: AdjuntoPendiente[],
): Promise<ElementoCola> {
  const item: ElementoCola = {
    id: nuevoId(),
    endpoint,
    payload,
    creado_en: new Date().toISOString(),
    intentos: 0,
    estado: "pendiente",
    usuarioId: usuarioSesionId() ?? undefined,
    ...(adjuntos && adjuntos.length > 0 ? { adjuntos } : {}),
  };
  await conStore<void>("readwrite", (store) => store.add(item));
  return item;
}

/** Todos los pendientes (FIFO por captura: lo viejo primero). */
export async function pendientes(): Promise<ElementoCola[]> {
  const todos = await conStore<ElementoCola[]>("readonly", (store) => store.getAll());
  return todos.sort((a, b) => a.creado_en.localeCompare(b.creado_en));
}

/** Cuántos esperan envío DEL USUARIO DE LA SESIÓN (alimenta el badge). */
export async function contarPendientes(): Promise<number> {
  const usuario = usuarioSesionId();
  const todos = await pendientes();
  return todos.filter((i) => i.usuarioId === usuario).length;
}

/** Marca un elemento como ENVIADO y lo elimina de la cola. */
export async function marcarEnviada(id: string): Promise<void> {
  await conStore<void>("readwrite", (store) => store.delete(id));
}

/**
 * El reporte ya quedó registrado (ACK) pero faltan fotos por subir: el item
 * NO se elimina — queda con los índices pendientes en estado `error` para
 * que el sincronizador reintente SOLO esas fotos en la próxima pasada.
 */
/**
 * Fotos del alta que NO subieron: el reporte ya existe (ACK) — el item NO
 * se elimina, queda con los índices pendientes para que el sincronizador
 * reenvíe SOLO esas fotos en la próxima pasada (PR #23, bloqueante 1).
 * `rechazado` = al menos una foto fue RECHAZADA por el server (4xx de
 * datos, p.ej. 413/422): no se reintentan solas; espera decisión humana
 * (Descartar/Reintentar en EstadoCola — menor 1 revisión PR #23).
 */
export async function guardarAdjuntosPendientes(
  id: string,
  indices: number[],
  rechazado = false,
): Promise<void> {
  const item = await conStore<ElementoCola | undefined>("readonly", (store) => store.get(id));
  if (!item) return;
  item.adjuntosPendientes = indices;
  item.estado = rechazado ? "rechazado" : "error";
  await conStore<void>("readwrite", (store) => store.put(item));
}

/** Marca un elemento con error (queda en la cola para reintentar). */
export async function marcarError(id: string): Promise<void> {
  const item = await conStore<ElementoCola | undefined>("readonly", (store) => store.get(id));
  if (!item) return;
  item.intentos += 1;
  item.estado = "error";
  await conStore<void>("readwrite", (store) => store.put(item));
}

/** Marca un CONFLICTO de negocio (409): NO se reintenta; espera decisión humana. */
export async function marcarConflicto(id: string): Promise<void> {
  const item = await conStore<ElementoCola | undefined>("readonly", (store) => store.get(id));
  if (!item) return;
  item.estado = "conflicto";
  await conStore<void>("readwrite", (store) => store.put(item));
}

/**
 * Estado TERMINAL de rechazo (4xx ≠ 409 — bloqueante 5 PR #23): el server
 * VALIDÓ la captura y la rechazó; reintentarla cada 2 min para siempre solo
 * martilla el endpoint con el mismo error. Espera decisión humana.
 */
export async function marcarRechazada(id: string): Promise<void> {
  const item = await conStore<ElementoCola | undefined>("readonly", (store) => store.get(id));
  if (!item) return;
  item.estado = "rechazado";
  await conStore<void>("readwrite", (store) => store.put(item));
}

/** Estado ACTUAL de un item de la cola (null si ya no existe). */
export async function consultarEstado(id: string): Promise<ElementoCola["estado"] | null> {
  const item = await conStore<ElementoCola | undefined>("readonly", (store) => store.get(id));
  return item?.estado ?? null;
}

/** Decisión humana sobre un conflicto: descartarlo (sale de la cola). */
export async function descartar(id: string): Promise<void> {
  await conStore<void>("readwrite", (store) => store.delete(id));
}

/** Decisión humana sobre un conflicto: volver a intentar (regresa a pendiente). */
export async function reencolar(id: string): Promise<void> {
  const item = await conStore<ElementoCola | undefined>("readonly", (store) => store.get(id));
  if (!item) return;
  item.estado = "pendiente";
  await conStore<void>("readwrite", (store) => store.put(item));
}

/**
 * Vacía la cola al CERRAR SESIÓN (PR #18, mediano): en un teléfono compartido,
 * lo pendiente de un trabajador no debe enviarse con el token del siguiente.
 */
export async function limpiarCola(): Promise<void> {
  await conStore<void>("readwrite", (store) => store.clear());
}
