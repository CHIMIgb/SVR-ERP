import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ResolverOmisionDto, ResolverOmisionSinMarcajeDto } from './resolver-omision.dto';
import { RegistrarUbicacionObraDto } from './registrar-ubicacion-obra.dto';

const propiedades = async (Clase: new () => object, datos: object) =>
  (await validate(plainToInstance(Clase, datos))).map((e) => e.property).sort();

describe('ResolverOmisionDto', () => {
  it('should pass with Falta or Retardo and a reason', async () => {
    expect(await propiedades(ResolverOmisionDto, { resolucion: 'Falta', motivo: 'Enfermedad' })).toEqual([]);
    expect(await propiedades(ResolverOmisionDto, { resolucion: 'Retardo', motivo: 'Tráfico' })).toEqual([]);
  });

  it('should only accept Falta or Retardo (no Justificado, no Puntual)', async () => {
    expect(await propiedades(ResolverOmisionDto, { resolucion: 'Justificado', motivo: 'Tráfico' })).toEqual(['resolucion']);
  });

  it('should require a real reason (trimmed, 3 to 500 characters)', async () => {
    expect(await propiedades(ResolverOmisionDto, { resolucion: 'Falta', motivo: '   a   ' })).toEqual(['motivo']);
    expect(await propiedades(ResolverOmisionDto, { resolucion: 'Falta', motivo: 'x'.repeat(501) })).toEqual(['motivo']);
    expect(await propiedades(ResolverOmisionDto, { resolucion: 'Falta' })).toEqual(['motivo']);
  });
});

describe('ResolverOmisionSinMarcajeDto', () => {
  it('should require a valid trabajadorId and accept an optional date', async () => {
    const base = { resolucion: 'Falta', motivo: 'Enfermedad' };
    expect(await propiedades(ResolverOmisionSinMarcajeDto, { ...base, trabajadorId: '550e8400-e29b-41d4-a716-446655440000' })).toEqual([]);
    expect(await propiedades(ResolverOmisionSinMarcajeDto, { ...base, trabajadorId: 'x', fecha: 'ayer' })).toEqual(['fecha', 'trabajadorId']);
  });
});

describe('RegistrarUbicacionObraDto', () => {
  const base = { lat: 19.43, lng: -99.13, radioPermitidoMetros: 150 };

  it('should pass with coordinates and a radius (accuracy optional: manual capture)', async () => {
    expect(await propiedades(RegistrarUbicacionObraDto, base)).toEqual([]);
    expect(await propiedades(RegistrarUbicacionObraDto, { ...base, precisionGpsMetros: 8 })).toEqual([]);
  });

  it('should reject out-of-range coordinates and a radius outside 20 m – 2 km', async () => {
    expect(await propiedades(RegistrarUbicacionObraDto, { lat: 91, lng: -181, radioPermitidoMetros: 10 })).toEqual([
      'lat',
      'lng',
      'radioPermitidoMetros',
    ]);
    expect(await propiedades(RegistrarUbicacionObraDto, { ...base, radioPermitidoMetros: 5000 })).toEqual(['radioPermitidoMetros']);
  });
});
