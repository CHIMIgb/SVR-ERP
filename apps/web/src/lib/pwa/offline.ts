"use client";

/**
 * Cola local (outbox) para capturas sin internet — plan §7c
 * (`pwa/offline-y-sincronizacion.md`). IndexedDB directo: wrapper mínimo,
 * SIN dependencias nuevas. La identidad de cada registro es un UUID
 * generado EN EL TELÉFONO → los reenvíos son idempotentes en el servidor.
 */

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
   * `rechazado` = estado TERMINAL: el server respondió 4xx (≠409) — la
   * captura es inválida tal cual y NO se reenvía sola; espera decisión
   * humana (Descartar/Reintentar en EstadoCola). `conflicto` = 409 de
   * negocio (duplicado); `error` = fallo de red/5xx (se reintentan solos).
   */
  estado: "pendiente" | "error" | "conflicto" | "rechazado";
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

/** Cuántos esperan envío (alimenta el badge de la nav). */
export async function contarPendientes(): Promise<number> {
  const todos = await pendientes();
  return todos.length;
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
export async function guardarAdjuntosPendientes(id: string, indices: number[]): Promise<void> {
  const item = await conStore<ElementoCola | undefined>("readonly", (store) => store.get(id));
  if (!item) return;
  item.adjuntosPendientes = indices;
  item.estado = "error";
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
