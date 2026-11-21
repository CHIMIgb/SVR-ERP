'use client';

/**
 * Web Push para la PWA (fase c del plan de push):
 * - `estadoPush()`: qué hay en este dispositivo (permiso, suscripción, SW).
 * - `activarPush()`: el GESTO del usuario dispara el permiso, la suscripción
 *   con la clave pública VAPID (del API) y el registro en el backend.
 *
 * Las notificaciones del sistema las muestra el `/sw.js` (handlers push y
 * notificationclick) — solo con la app instalada/producción: el shell NO
 * registra el SW en dev (cache-first de Turbopack).
 */
import { notificacionesApi, mensajeErrorApi } from '@/lib/api';

export type EstadoPush =
  | { estado: 'sin-sw' }        // dev: el SW no se registra en este entorno
  | { estado: 'no-soportado' }  // iOS sin instalar / navegador sin PushManager
  | { estado: 'bloqueadas' }    // permiso denegado: solo el usuario puede desbloquear
  | { estado: 'activadas' }     // permiso concedido + dispositivo suscrito
  | { estado: 'por-activar' };  // hay que pedir permiso y suscribir

/** base64 URL-safe de la clave VAPID → Uint8Array que exige PushManager. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const crudo = atob(b64);
  const salida = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) salida[i] = crudo.charCodeAt(i);
  return salida;
}

export async function estadoPush(): Promise<EstadoPush> {
  if (!('serviceWorker' in navigator)) return { estado: 'sin-sw' };
  if (!('PushManager' in window) || !('Notification' in window)) return { estado: 'no-soportado' };
  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro) return { estado: 'sin-sw' };
  if (Notification.permission === 'denied') return { estado: 'bloqueadas' };
  const suscripcion = await registro.pushManager.getSubscription();
  if (suscripcion) return { estado: 'activadas' };
  return { estado: 'por-activar' };
}

/**
 * ACTIVAR el push — DEBE dispararse desde un gesto del usuario (botón):
 * los navegadores bloquean el requestPermission automático y en iOS solo
 * funciona con la app instalada. Suscribe el dispositivo y lo registra en
 * el backend (upsert por endpoint — fase a).
 */
export async function activarPush(): Promise<{ ok: boolean; mensaje: string }> {
  if (!('serviceWorker' in navigator)) {
    return { ok: false, mensaje: 'Este entorno no tiene service worker (solo con la app instalada/producción).' };
  }
  if (!('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, mensaje: 'Tu navegador no soporta notificaciones push — en iPhone, instala la app primero.' };
  }

  let permiso: NotificationPermission = Notification.permission;
  if (permiso === 'default') {
    permiso = await Notification.requestPermission();
  }
  if (permiso !== 'granted') {
    return { ok: false, mensaje: 'No se otorgó el permiso de notificaciones.' };
  }

  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro) {
    return { ok: false, mensaje: 'El service worker no está activo — disponible solo con la app instalada/producción.' };
  }

  const res = await notificacionesApi.vapidPublica();
  if (!res.success || !res.data?.clavePublica) {
    return { ok: false, mensaje: 'El server no tiene el push configurado (falta VAPID).' };
  }

  try {
    const suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(res.data.clavePublica),
    });
    const json = suscripcion.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, mensaje: 'El navegador devolvió una suscripción incompleta.' };
    }
    const alta = await notificacionesApi.suscribirPush({
      endpoint: json.endpoint,
      llaves: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    if (!alta.success) {
      // Menor 4 PR #23: si el server NO registró el alta, el navegador queda
      // sin suscripción — `estadoPush()` dejará de decir "activadas" con un
      // backend que nunca la registró (desync de estados).
      await suscripcion.unsubscribe().catch(() => undefined);
      return { ok: false, mensaje: mensajeErrorApi(alta.error, 'No se pudo registrar la suscripción.') };
    }
    return { ok: true, mensaje: 'Notificaciones del teléfono activadas.' };
  } catch (e) {
    return {
      ok: false,
      mensaje: e instanceof Error ? e.message : 'No se pudo activar el push en este dispositivo.',
    };
  }
}

/**
 * DESACTIVAR el push (menor 4 PR #23): baja en el server + unsubscribe local
 * del navegador. En un teléfono COMPARTIDO, la suscripción de la cuenta
 * anterior no debe seguir recibiendo avisos. Se llama al CERRAR SESIÓN con
 * el token aún vivo (el logout lo revoca); nunca rompe el logout.
 */
export async function desactivarPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registro = await navigator.serviceWorker.getRegistration();
  if (!registro) return;
  const suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion) return;
  // baja en el server PRIMERO (necesita el token vigente), luego local
  await notificacionesApi
    .cancelarPush({ endpoint: suscripcion.endpoint })
    .catch(() => undefined);
  await suscripcion.unsubscribe().catch(() => undefined);
}
