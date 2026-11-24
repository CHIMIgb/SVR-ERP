"use client";

/**
 * Lista declarativa de DATOS que la PWA precarga para usarse SIN SEÑAL
 * (fase offline-datos, 2026-11-20). Agregar/quitar líneas AQUÍ es todo:
 * el shell las precarga al entrar (con señal, en segundo plano) y las
 * pantallas leen con `leerDatos(userId, clave)` al fallar la red.
 *
 * Las claves son las mismas del `datos-cache.ts` (localStorage por usuario).
 * El perfil NO va aquí: vive en localStorage desde el login (storeUser).
 */
import type { ApiResponse } from "@svr-erp/shared";
import { reportesCampoApi, trabajadoresApi } from "@/lib/api";
import { guardarDatos } from "./datos-cache";
import { haySenal } from "./sincronizador";

interface DatoOffline {
  /** Clave del snapshot (la misma que el consumidor usa con leerDatos). */
  clave: string;
  /** Llamada a la API que trae el dato (el .data completo va al snapshot). */
  traer: () => Promise<ApiResponse<unknown>>;
}

export const DATOS_OFFLINE: DatoOffline[] = [
  { clave: "subcategorias", traer: () => reportesCampoApi.subcategorias() },
  { clave: "proyectos", traer: () => reportesCampoApi.proyectos() },
  {
    // I-2 revisión PR #23: solo lo que usa el select de asignar (/m/reportes)
    // va al snapshot — el DTO completo trae sueldos y contactos de emergencia
    // (nómina en el teléfono). La misma proyección vive en el live de la vista.
    clave: "trabajadores",
    traer: async () => {
      const res = await trabajadoresApi.listar({ limit: 100 });
      if (!res.success) return res;
      return {
        ...res,
        data: {
          ...res.data,
          items: res.data.items.map(({ id, nombre, puesto }) => ({ id, nombre, puesto })),
        },
      };
    },
  },
];

/**
 * Precarga SECUENCIAL y best-effort de la lista (una visita de la app lanza
 * una sola). Con señal cortada a mitad se detiene — el snapshot anterior
 * queda y la próxima visita lo refresca.
 */
export async function precargarDatosOffline(userId: string): Promise<void> {
  for (const dato of DATOS_OFFLINE) {
    if (!haySenal()) return;
    try {
      const res = await dato.traer();
      if (res.success) guardarDatos(userId, dato.clave, res.data);
    } catch {
      // Fallo de red/BD: el snapshot anterior queda intacto
    }
  }
}
