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

/** "30000.5" → "30,000.5" — separador de miles para inputs de dinero (max 2 decimales). */
export function formatearMiles(valor: string): string {
  const limpio = valor.replace(/,/g, '').replace(/[^\d.]/g, '');
  const [entero, ...decimales] = limpio.split('.');
  const conComas = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimales.length > 0 ? `${conComas}.${decimales.join('').slice(0, 2)}` : conComas;
}

/** "30,000.50" → 30000.5 */
export function parsearMiles(valor: string): number {
  return parseFloat(valor.replace(/,/g, ''));
}

/** Fecha de hoy en horario local como YYYY-MM-DD (toISOString usaría UTC). */
export function fechaLocalHoy(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
    hoy.getDate(),
  ).padStart(2, '0')}`;
}

/** Teléfono MX válido: exactamente 10 dígitos (ignora espacios y guiones). */
export function telefonoEsValido(valor: string): boolean {
  return valor.replace(/\D/g, '').length === 10;
}

/** Solo dígitos, espacios y guiones (para el onChange del input teléfono). */
export function limpiarTelefono(valor: string): string {
  return valor.replace(/[^\d\s\-]/g, '');
}

/**
 * RFC mexicano válido: 3-4 letras + 6 dígitos de fecha + homoclave de 3
 * (13 chars persona física, 12 persona moral). Acepta ñ y & en las letras.
 */
export function rfcEsValido(valor: string): boolean {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(valor.trim().toUpperCase());
}

/** RFC en mayúsculas, sin caracteres ajenos al formato (para el onChange). */
export function limpiarRfc(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-ZÑ&0-9]/g, '')
    .slice(0, 13);
}
