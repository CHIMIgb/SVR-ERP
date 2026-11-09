import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MarcarSalidaDto } from './marcar-salida.dto';
import { RegistrarHorasExtraDto } from './registrar-horas-extra.dto';
import { MarcarCuadrillaDto } from './marcar-cuadrilla.dto';
import { MarcarEntradaDto } from './marcar-entrada.dto';

const errores = async <T extends object>(Clase: new () => T, datos: Record<string, unknown>) =>
  (await validate(plainToInstance(Clase, datos))).map((e) => e.property);

describe('Topes de los DTO de Asistencia', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440001';
  const salida = { trabajadorId: uuid, lat: 19.4, lng: -99.1, dispositivo: 'Móvil' };
  const horasExtra = { inicio: '17:00', fin: '20:00', horasCalculadas: 3 };

  it('una salida válida pasa', async () => {
    expect(await errores(MarcarSalidaDto, { ...salida, horasTrabajadasOrdinarias: 8.5 })).toEqual([]);
  });

  it.each([
    ['más de 24 horas trabajadas', { horasTrabajadasOrdinarias: 25 }, 'horasTrabajadasOrdinarias'],
    ['horas con 3 decimales', { horasTrabajadasOrdinarias: 8.123 }, 'horasTrabajadasOrdinarias'],
    ['dispositivo de más de 100 caracteres', { dispositivo: 'x'.repeat(101) }, 'dispositivo'],
    ['ubicación de más de 200 caracteres', { ubicacion: 'x'.repeat(201) }, 'ubicacion'],
  ])('la salida rechaza %s', async (_caso, cambio, campo) => {
    expect(await errores(MarcarSalidaDto, { ...salida, ...cambio })).toContain(campo);
  });

  it('unas horas extra válidas pasan', async () => {
    expect(await errores(RegistrarHorasExtraDto, horasExtra)).toEqual([]);
  });

  it.each([
    ['más de 24 horas', { horasCalculadas: 30 }, 'horasCalculadas'],
    ['inicio sin formato HH:mm', { inicio: '5pm' }, 'inicio'],
    ['fin con hora imposible', { fin: '25:00' }, 'fin'],
    ['tarifa con 3 decimales', { tarifaPorHora: 90.123 }, 'tarifaPorHora'],
    ['motivo de más de 500 caracteres', { motivo: 'x'.repeat(501) }, 'motivo'],
  ])('las horas extra rechazan %s', async (_caso, cambio, campo) => {
    expect(await errores(RegistrarHorasExtraDto, { ...horasExtra, ...cambio })).toContain(campo);
  });

  it('la cuadrilla no acepta más de 200 trabajadores en una sola petición', async () => {
    const base = { obraId: uuid, lat: 19.4, lng: -99.1, dispositivo: 'Móvil' };
    expect(await errores(MarcarCuadrillaDto, { ...base, trabajadorIds: Array(200).fill(uuid) })).toEqual([]);
    expect(await errores(MarcarCuadrillaDto, { ...base, trabajadorIds: Array(201).fill(uuid) })).toContain('trabajadorIds');
  });

  it('la entrada limita las notas a 500 caracteres', async () => {
    const entrada = { trabajadorId: uuid, obraId: uuid, lat: 19.4, lng: -99.1, dispositivo: 'Móvil' };
    expect(await errores(MarcarEntradaDto, { ...entrada, notas: 'x'.repeat(501) })).toContain('notas');
  });
});
