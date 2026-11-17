import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MarcarEntradaPropiaDto, MarcarSalidaPropiaDto } from './marcar-propia.dto';
import { QueryEquipoDto } from './query-equipo.dto';

// Igual que el ValidationPipe global (main.ts): whitelist + forbidNonWhitelisted.
const errores = async <T extends object>(Clase: new () => T, datos: Record<string, unknown>) =>
  (await validate(plainToInstance(Clase, datos), { whitelist: true, forbidNonWhitelisted: true })).map((e) => e.property);

describe('DTO de asistencia propia (PWA)', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440001';
  const entrada = { obraId: uuid, lat: 19.4, lng: -99.1, dispositivo: 'Móvil' };
  const salida = { lat: 19.4, lng: -99.1, dispositivo: 'Móvil' };

  it('acepta una entrada propia válida', async () => {
    expect(await errores(MarcarEntradaPropiaDto, entrada)).toEqual([]);
  });

  it('rechaza trabajadorId en la entrada propia: nadie checa por otro', async () => {
    expect(await errores(MarcarEntradaPropiaDto, { ...entrada, trabajadorId: uuid })).toContain('trabajadorId');
  });

  it('exige obra y coordenadas válidas en la entrada propia', async () => {
    const e = await errores(MarcarEntradaPropiaDto, { obraId: 'x', lat: 91, lng: -181, dispositivo: 'M' });
    expect(e).toEqual(expect.arrayContaining(['obraId', 'lat', 'lng', 'dispositivo']));
  });

  it('acepta una salida propia válida y pide motivo solo si es anticipada', async () => {
    expect(await errores(MarcarSalidaPropiaDto, salida)).toEqual([]);
    expect(await errores(MarcarSalidaPropiaDto, { ...salida, salidaAnticipada: true })).toContain('motivoSalidaAnticipada');
    expect(await errores(MarcarSalidaPropiaDto, { ...salida, salidaAnticipada: true, motivoSalidaAnticipada: 'Cita médica' })).toEqual([]);
  });

  it('rechaza en la salida propia el trabajadorId y el override manual de horas', async () => {
    const e = await errores(MarcarSalidaPropiaDto, { ...salida, trabajadorId: uuid, horasTrabajadasOrdinarias: 12 });
    expect(e).toEqual(expect.arrayContaining(['trabajadorId', 'horasTrabajadasOrdinarias']));
  });

  it('la consulta del equipo solo acepta una fecha ISO', async () => {
    expect(await errores(QueryEquipoDto, {})).toEqual([]);
    expect(await errores(QueryEquipoDto, { fecha: '2026-11-17' })).toEqual([]);
    expect(await errores(QueryEquipoDto, { fecha: 'ayer' })).toContain('fecha');
  });
});
