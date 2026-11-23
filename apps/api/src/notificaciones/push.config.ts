/**
 * Config VAPID del Web Push (fase b del plan de push). Lectura PEREZOSA:
 * si las claves no están configuradas, el push se salta con un warn — el
 * build, CI y los tests SIN VAPID no crashean. Las claves se generan con
 * `npx web-push generate-vapid-keys` y viven SOLO en apps/api/.env.
 */
export interface ConfigVapid {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function configVapid(): ConfigVapid | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT ?? 'mailto:dev@svr-constructora.com' };
}

export const vapidConfigurada = (): boolean => configVapid() !== null;
