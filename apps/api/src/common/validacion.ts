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

/** Hoy en la zona de la empresa, como "YYYY-MM-DD". La zona vive SOLO en .env (TIMEZONE). */
export function hoyEnZona(timeZone = process.env.TIMEZONE): string {
  return new Date().toLocaleDateString('en-CA', { timeZone });
}

/** true si la fecha ("YYYY-MM-DD" o ISO) cae después de hoy en la zona de la empresa. */
export function esFechaFutura(fecha: string): boolean {
  return fecha.slice(0, 10) > hoyEnZona();
}

/** Suma días a una fecha "YYYY-MM-DD" (sin pasar por la hora local). */
export function sumarDiasFecha(fecha: string, dias: number): string {
  const d = new Date(`${fecha.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Instante (en UTC) en que empieza el día `fecha` ("YYYY-MM-DD") en la zona de la empresa.
 * En México es las 06:00 UTC: cortar el día a medianoche UTC mete las 6 p.m.–12 a.m. del día anterior.
 */
export function inicioDelDiaEnZona(fecha: string, timeZone = process.env.TIMEZONE): Date {
  const medianocheUtc = new Date(`${fecha.slice(0, 10)}T00:00:00Z`);
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(medianocheUtc)
      .map((p) => [p.type, p.value]),
  );
  // Qué hora marcaba el reloj de la zona en la medianoche UTC; la diferencia es el desfase (ej. -6 h).
  const comoLocal = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second);
  return new Date(medianocheUtc.getTime() - (comoLocal - medianocheUtc.getTime()));
}
