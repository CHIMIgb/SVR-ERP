/**
 * Helpers de la asistencia propia (revisión de chimi en el PR #24):
 * - clasificarMiembro: la rama Omisión/Falta CON y SIN horaEntrada (pasadas las 17:00 la API marca "Falta" la
 *   omisión sin resolver aunque el trabajador sí haya checado).
 * - Zona horaria: sale de APP_TIMEZONE (NEXT_PUBLIC_TZ), nunca de la zona del teléfono ni fija en el código.
 *   Se usa a propósito una zona distinta a la de la máquina (Cancún, UTC-5) para probar que no se usa la
 *   hora del dispositivo.
 * - mensajeDeApi: delega en mensajeErrorApi (details[] del 422) y solo agrega el caso sin conexión.
 */
import {
  MENSAJE_SIN_CONEXION,
  clasificarMiembro,
  contarEquipo,
  fechaHoyEnZona,
  fechaLarga,
  horaActual,
  mensajeDeApi,
  minutosTarde,
} from './asistencia-propia';
import type { DiaAsistenciaSemanaDTO } from '@/lib/api';

jest.mock('@/lib/formatters', () => ({
  ...jest.requireActual('@/lib/formatters'),
  APP_TIMEZONE: 'America/Cancun',
}));

function dia(parcial: Partial<DiaAsistenciaSemanaDTO>): DiaAsistenciaSemanaDTO {
  return { dia: 'Sab', fecha: '2026-11-21', estado: 'Puntual', horasTrabajadas: 0, enSitioGps: true, ...parcial };
}

describe('clasificarMiembro', () => {
  it('Omisión con entrada: llegó tarde y espera revisión (ya llegó)', () => {
    expect(clasificarMiembro(dia({ estado: 'Omisión', horaEntrada: '08:40' }), 'ACTIVO')).toEqual({
      grupo: 'tarde',
      etiqueta: 'Tarde 08:40 a.m.',
      variante: 'warning',
    });
  });

  it('Omisión sin entrada: aún no checa (falta llegar)', () => {
    expect(clasificarMiembro(dia({ estado: 'Omisión' }), 'ACTIVO')).toEqual({
      grupo: 'sin-checar',
      etiqueta: 'Sin checar',
      variante: 'warning',
    });
  });

  it('Falta con entrada (omisión vencida a las 17:00): está en la obra, no "No asistió"', () => {
    expect(clasificarMiembro(dia({ estado: 'Falta', horaEntrada: '09:10' }), 'ACTIVO')).toEqual({
      grupo: 'tarde',
      etiqueta: 'Tarde 09:10 a.m. · sin justificar',
      variante: 'error',
    });
  });

  it('Falta sin entrada: no asistió', () => {
    expect(clasificarMiembro(dia({ estado: 'Falta' }), 'ACTIVO')).toEqual({
      grupo: 'falta',
      etiqueta: 'No asistió',
      variante: 'error',
    });
  });

  it('sin día (domingo o trabajador no activo) no cuenta', () => {
    expect(clasificarMiembro(null, 'VACACIONES').grupo).toBe('sin-jornada');
    expect(clasificarMiembro(null, 'VACACIONES').etiqueta).toBe('De vacaciones');
    expect(clasificarMiembro(null, 'INACTIVO').etiqueta).toBe('De baja');
  });
});

describe('contarEquipo', () => {
  it('cuenta a quien ya llegó (presente o tarde), los retardos y a quien falta llegar', () => {
    expect(
      contarEquipo(['presente', 'tarde', 'tarde', 'falta', 'sin-checar', 'pendiente', 'descanso', 'sin-jornada']),
    ).toEqual({ total: 8, llegaron: 3, tarde: 2, faltan: 3 });
  });

  it('equipo vacío', () => {
    expect(contarEquipo([])).toEqual({ total: 0, llegaron: 0, tarde: 0, faltan: 0 });
  });
});

describe('zona horaria (APP_TIMEZONE, no la del teléfono)', () => {
  // 15:20 UTC = 10:20 en Cancún (UTC-5) = 09:20 en Ciudad de México (UTC-6).
  const instante = new Date('2026-11-21T15:20:00Z');

  it('minutosTarde usa la hora de la zona del negocio', () => {
    expect(minutosTarde('10:00', instante)).toBe(20);
    expect(minutosTarde('10:30', instante)).toBe(-10);
  });

  it('minutosTarde sin horario o con formato inválido', () => {
    expect(minutosTarde(undefined, instante)).toBeNull();
    expect(minutosTarde('10h', instante)).toBeNull();
  });

  it('horaActual en la zona del negocio', () => {
    expect(horaActual(instante)).toBe('10:20');
    expect(horaActual(new Date('2026-11-22T05:05:00Z'))).toBe('00:05');
  });

  it('fechaLarga en la zona del negocio (05:30 UTC ya es domingo en Cancún)', () => {
    expect(fechaLarga(new Date('2026-11-22T05:30:00Z'))).toBe('domingo, 22 de noviembre');
  });

  it('fechaHoyEnZona devuelve YYYY-MM-DD de la zona del negocio', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-22T05:30:00Z'));
    try {
      expect(fechaHoyEnZona()).toBe('2026-11-22');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('mensajeDeApi', () => {
  it('sin conexión (refresh sin red del apiClient)', () => {
    expect(mensajeDeApi({ code: 'API_DOWN', message: 'No hay conexión con el servidor' }, 'x')).toBe(
      MENSAJE_SIN_CONEXION,
    );
  });

  it('un 422 dice QUÉ campo falló (details[] de class-validator)', () => {
    expect(
      mensajeDeApi(
        { code: 'VALIDATION_ERROR', message: 'Error de validación', details: ['obraId must be a UUID', 'lat es requerido'] },
        'x',
      ),
    ).toBe('obraId must be a UUID · lat es requerido');
  });

  it('usa el message del contrato y, sin nada, el texto por defecto', () => {
    expect(mensajeDeApi({ code: 'FORBIDDEN', message: 'No tienes esa obra asignada' }, 'x')).toBe(
      'No tienes esa obra asignada',
    );
    expect(mensajeDeApi(undefined, 'No se pudo cargar.')).toBe('No se pudo cargar.');
  });
});
