"use client";

/**
 * Cola local (outbox) para capturas sin internet — plan §7c
 * (`pwa/offline-y-sincronizacion.md`). IndexedDB directo: wrapper mínimo,
 * SIN dependencias nuevas. La identidad de cada registro es un UUID
 * generado EN EL TELÉFONO → los reenvíos son idempotentes en el servidor.
 */

export interface ElementoCola {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  creado_en: string;
  intentos: number;
  estado: "pendiente" | "error";
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
export async function encolar(endpoint: string, payload: Record<string, unknown>): Promise<ElementoCola> {
  const item: ElementoCola = {
    id: nuevoId(),
    endpoint,
    payload,
    creado_en: new Date().toISOString(),
    intentos: 0,
    estado: "pendiente",
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

/**
 * Vacía la cola al CERRAR SESIÓN (PR #18, mediano): en un teléfono compartido,
 * lo pendiente de un trabajador no debe enviarse con el token del siguiente.
 */
export async function limpiarCola(): Promise<void> {
  await conStore<void>("readwrite", (store) => store.clear());
}
