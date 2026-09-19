import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CrearConceptoDto, ActualizarConceptoDto, ListarFacturasQuery } from './conceptos.dto';

describe('CrearConceptoDto', () => {
  const base = { cantidad: 1, unidad: 'Servicio', descripcion: 'Renta de maquinaria', valorUnitario: 1500 };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CrearConceptoDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with cantidad 0', async () => {
    const dto = plainToInstance(CrearConceptoDto, { ...base, cantidad: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'cantidad')).toBe(true);
  });

  it('should fail with descripcion longer than 500', async () => {
    const dto = plainToInstance(CrearConceptoDto, { ...base, descripcion: 'x'.repeat(501) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'descripcion')).toBe(true);
  });
});

describe('ActualizarConceptoDto', () => {
  it('should pass with empty body (all fields optional)', async () => {
    const dto = plainToInstance(ActualizarConceptoDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with impuestoTasa > 1', async () => {
    const dto = plainToInstance(ActualizarConceptoDto, { impuestoTasa: 1.5 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'impuestoTasa')).toBe(true);
  });
});

describe('ListarFacturasQuery', () => {
  it('should fail with estado no permitido', async () => {
    const dto = plainToInstance(ListarFacturasQuery, { estado: 'EMITIDA' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'estado')).toBe(true);
  });

  it('should fail with limit > 100', async () => {
    const dto = plainToInstance(ListarFacturasQuery, { limit: 101 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });
});