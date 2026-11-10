import { inicioDelDiaEnZona, sumarDiasFecha } from './validacion';

describe('validacion: fechas en la zona de la empresa', () => {
  it('el día en México empieza a las 06:00 UTC (UTC-6, sin horario de verano)', () => {
    expect(inicioDelDiaEnZona('2026-11-06', 'America/Mexico_City').toISOString()).toBe('2026-11-06T06:00:00.000Z');
    expect(inicioDelDiaEnZona('2026-01-15', 'America/Mexico_City').toISOString()).toBe('2026-01-15T06:00:00.000Z');
  });

  it('acepta una fecha ISO completa y solo toma el día', () => {
    expect(inicioDelDiaEnZona('2026-11-06T23:59:00Z', 'America/Mexico_City').toISOString()).toBe('2026-11-06T06:00:00.000Z');
  });

  it('respeta el horario de verano de zonas que sí lo tienen', () => {
    // Tijuana: UTC-8 en invierno, UTC-7 en verano.
    expect(inicioDelDiaEnZona('2026-01-15', 'America/Tijuana').toISOString()).toBe('2026-01-15T08:00:00.000Z');
    expect(inicioDelDiaEnZona('2026-07-15', 'America/Tijuana').toISOString()).toBe('2026-07-15T07:00:00.000Z');
  });

  it('suma días sin pasar por la hora local, incluido el cambio de mes y de año', () => {
    expect(sumarDiasFecha('2026-11-30', 1)).toBe('2026-12-01');
    expect(sumarDiasFecha('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDiasFecha('2026-03-01', -1)).toBe('2026-02-28');
  });
});
