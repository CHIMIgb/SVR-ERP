import * as bcrypt from 'bcryptjs';

/**
 * Validador del PIN (plan §8.3 — reglas del spec §6.5):
 * 8 caracteres alfanuméricos case-insensitive, ≥1 letra y 1 número,
 * sin 3+ repetidos, sin secuencias asc/desc, sin el número de empleado,
 * distinto de los últimos 3 (verificado contra hashes con bcrypt).
 * El server SIEMPRE normaliza a mayúsculas antes de evaluar y hashear.
 */
const PIN_LARGO = 8;
const CARACTERES_CONFUSOS = /[0O1lI]/g;

/** Normaliza el PIN: trim + mayúsculas (case-insensitive por spec). */
export function normalizarPin(pin: string): string {
  return (pin ?? '').trim().toUpperCase();
}

/** ¿Contiene 3+ caracteres consecutivos idénticos? (ej. AAA, 7777) */
function tieneRepeticiones(pin: string): boolean {
  return /(.)\1{2,}/.test(pin);
}

/** ¿Contiene secuencias ascendentes o descendentes de 3+? (ABC, 123, CBA, 987) */
function tieneSecuencias(pin: string): boolean {
  for (let i = 0; i + 2 < pin.length; i++) {
    const a = pin.charCodeAt(i);
    const b = pin.charCodeAt(i + 1);
    const c = pin.charCodeAt(i + 2);
    if (b === a + 1 && c === a + 2) return true; // asc
    if (b === a - 1 && c === a - 2) return true; // desc
  }
  return false;
}

export interface ResultadoValidacionPin {
  valido: boolean;
  /** Código de fallo para la auditoría — null si es válido. */
  errorCode: string | null;
}

/**
 * Valida un PIN NUEVO contra todas las reglas del spec.
 * @param pin el PIN propuesto (se normaliza internamente)
 * @param numeroEmpleado el número del usuario (regla: no contenerlo)
 * @param hashesAnteriores hashes bcrypt de los últimos 3 PINs (pin_historial)
 */
export async function validarPinNuevo(
  pin: string,
  numeroEmpleado: string | null,
  hashesAnteriores: string[],
): Promise<ResultadoValidacionPin> {
  const p = normalizarPin(pin);

  if (!new RegExp(`^[A-Z0-9]{${PIN_LARGO}}$`).test(p)) {
    return { valido: false, errorCode: 'PIN_FORMATO' };
  }

  const tieneLetra = /[A-Z]/.test(p);
  const tieneNumero = /[0-9]/.test(p);
  if (!tieneLetra || !tieneNumero) {
    return { valido: false, errorCode: 'PIN_DEBIL' };
  }

  if (tieneRepeticiones(p)) {
    return { valido: false, errorCode: 'PIN_SECUENCIA' };
  }

  if (tieneSecuencias(p)) {
    return { valido: false, errorCode: 'PIN_SECUENCIA' };
  }

  if (numeroEmpleado) {
    const num = numeroEmpleado.toUpperCase().replace(/-/g, '');
    const pSinGuion = p; // el PIN no lleva guion
    if (num && (pSinGuion.includes(num) || pSinGuion.includes(num.replace(/^(ADM|RES|TEC|COB|TRA)/, '')))) {
      return { valido: false, errorCode: 'PIN_CONTIENE_EMPLEADO' };
    }
  }

  // distinto de los últimos 3 (hashes bcrypt)
  for (const hash of hashesAnteriores.slice(-3)) {
    if (hash && (await bcrypt.compare(p, hash))) {
      return { valido: false, errorCode: 'PIN_REPETIDO' };
    }
  }

  return { valido: true, errorCode: null };
}

/**
 * Genera un PIN TEMPORAL de 24 horas: sin caracteres confusos (0/O, 1/l/I),
 * con al menos 1 letra y 1 número, sin repeticiones de 3+ ni secuencias.
 */
export function generarPinTemporal(): string {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0,O,1,l,I
  for (;;) {
    let pin = '';
    for (let i = 0; i < PIN_LARGO; i++) {
      pin += alfabeto[Math.floor(Math.random() * alfabeto.length)];
    }
    const tieneLetra = /[A-Z]/.test(pin);
    const tieneNumero = /[0-9]/.test(pin);
    if (tieneLetra && tieneNumero && !tieneRepeticiones(pin) && !tieneSecuencias(pin)) {
      return pin;
    }
  }
}

/** Utilidad de prueba interna — limpia caracteres confusos (usada por generar). */
export function sinCaracteresConfusos(pin: string): string {
  return pin.replace(CARACTERES_CONFUSOS, '');
}
