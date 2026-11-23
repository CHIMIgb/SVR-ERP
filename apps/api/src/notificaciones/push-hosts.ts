/**
 * Lista blanca de hosts de servicios Web Push (bloqueante 2 de PR #23 —
 * SSRF): sin esto, cualquier usuario autenticado podía registrar
 * `https://192.168.0.x:puerto/...` como "suscripción" y el servidor le
 * hacía POST en cada notificación emitida. Se valida en el DTO (entrada) y
 * OTRA VEZ al enviar (defensa en profundidad: filtra endpoints ya guardados
 * con la regla antigua).
 */
const SUFIJOS_PERMITIDOS = [
  'fcm.googleapis.com', // Chrome / Android (FCM)
  'push.services.mozilla.com', // Firefox
  'notify.windows.com', // Edge / Windows
  'push.apple.com', // Safari / iOS (APNs)
];

/**
 * Host exacto o subdominio de un servicio conocido. `endsWith('.' + sufijo)`
 * bloquea lookalikes (`evil-fcm.googleapis.com`), y una URL malformada
 * devuelve false (el push nunca fue para URLs raras).
 */
export function esEndpointPushPermitido(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname;
    return SUFIJOS_PERMITIDOS.some(
      (sufijo) => host === sufijo || host.endsWith(`.${sufijo}`),
    );
  } catch {
    return false;
  }
}
