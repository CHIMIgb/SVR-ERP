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
  estado: "pendiente" | "error" | "conflicto";
  /**
   * Fotos del alta — NO van en el payload (el ValidationPipe rechazaría el
   * POST). Tras el ACK del reporte el sincronizador las adjunta en secuencia.
   */
  adjuntos?: AdjuntoPendiente[];
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
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
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
