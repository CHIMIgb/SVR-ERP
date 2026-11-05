/**
 * Reglas de formato compartidas por los DTO (trabajadores, bitácoras de renta).
 * El frontend usa las mismas para que un dato válido en pantalla no lo rechace la API.
 */

/** Hora en formato 24 h "HH:mm". Sin esto, un valor como "7am" llegaba a la BD como fecha inválida (500). */
export const HORA_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Teléfono: dígitos, espacios, guiones, paréntesis o +, con al menos 7 dígitos (siete espacios ya no pasan). */
export const TELEFONO_VALIDO = /^(?=(?:\D*\d){7})[0-9+()\s-]+$/;

/** `@Transform` para quitar espacios a los extremos antes de validar largo y formato. */
export const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Hoy en la zona de la empresa, como "YYYY-MM-DD". */
export function hoyEnZona(timeZone = process.env.TIMEZONE || 'America/Mexico_City'): string {
  return new Date().toLocaleDateString('en-CA', { timeZone });
}

/** true si la fecha ("YYYY-MM-DD" o ISO) cae después de hoy en la zona de la empresa. */
export function esFechaFutura(fecha: string): boolean {
  return fecha.slice(0, 10) > hoyEnZona();
}
