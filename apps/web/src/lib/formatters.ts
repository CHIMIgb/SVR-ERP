/**
 * Utilidades de formateo centralizadas para SVR-ERP.
 *
 * Todas las fechas/horas se muestran en la zona horaria oficial de la empresa:
 * Nayarit Costa Sur => America/Mexico_City.
 */

export const APP_TIMEZONE = 'America/Mexico_City';

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = typeof value === 'object' ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: Date | string | number | null | undefined,
  options: { short?: boolean } = {},
): string {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: options.short ? 'short' : '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  options: { seconds?: boolean } = {},
): string {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: options.seconds ? '2-digit' : undefined,
    hour12: true,
  }).format(date);
}

export function formatTime(
  value: Date | string | number | null | undefined,
  options: { seconds?: boolean; hour12?: boolean } = {},
): string {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: options.seconds ? '2-digit' : undefined,
    hour12: options.hour12 ?? true,
  }).format(date);
}

/**
 * Formatea una fecha PURA sin hora (ej. "2026-08-23" de una columna
 * `@db.Date`) sin pasar por conversión de zona horaria. A diferencia de
 * `formatDate()`, que interpreta el string como medianoche UTC y por eso
 * puede mostrar el día anterior al convertir a `America/Mexico_City`
 * (UTC-6), esto solo reordena los mismos dígitos.
 */
export function formatFechaSolo(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month, day] = value.split('T')[0].split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
