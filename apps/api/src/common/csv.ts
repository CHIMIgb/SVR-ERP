/**
 * Utilidades de presentación CSV.
 *
 * Protección contra inyección de fórmulas (CWE-1236 / OWASP): al abrir el
 * archivo en Excel/Sheets/LibreOffice, una celda cuyo valor comienza con
 * `=`, `+`, `-`, `@` (o tab/CR) se interpreta como fórmula ejecutable —
 * p. ej. `=HYPERLINK("http://sitio-externo","clic")`. Neutralizar el prefijo
 * con `'` (apóstrofo de literal) mantiene el texto visible intacto y evita
 * la evaluación (misma defensa que Excel usa al pegar datos externos).
 *
 * Patrón compartido por cobranza, facturas, finanzas y conciliación-bancaria
 * (ver PR #11 Blocker "inyección de fórmulas CSV"). Los montos numéricos
 * (incluidos negativos) no se neutralizan: `Number('350')` no es una fórmula.
 */

/** Prefijos que las planillas de cálculo interpretan como fórmula (CWE-1236). */
const PREFIJOS_FORMULA = /^[=+\-@\t\r]/u;

/**
 * Neutraliza el prefijo de un valor para exportación CSV (CWE-1236).
 *
 * - Si el valor es NUMBER se devuelve tal cual (los negativos son datos, no
 *   fórmulas) y no se añade el apóstrofo.
 * - Si es string y comienza con un prefijo de fórmula, se antepone `'`
 *   (literal). La hoja de cálculo muestra el texto sin el `'` y NO lo evalúa.
 */
export function neutralizarFormula(v: unknown): string {
  if (typeof v === 'number') return String(v);
  const s = String(v ?? '');
  return PREFIJOS_FORMULA.test(s) ? `'${s}` : s;
}

/**
 * Escapa y neutraliza un valor como celda CSV manteniendo el formato de
 * RFC-4180: entrecomilla solo cuando el contenido lo exige (`,`, `"` o
 * saltos de línea), doblando las comillas dobles.
 */
export function escapeCsv(v: unknown): string {
  const s = neutralizarFormula(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
