import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateRegistroCribaDto } from './create-registro-criba.dto';

describe('CreateRegistroCribaDto', () => {
  const base = {
    fecha: '2026-08-20',
    turno: 'VESPERTINO',
    operadorId: '550e8400-e29b-41d4-a716-446655440001',
    tipoMaterial: 'Criba fina',
    materialProducido: 320,
    horasTrabajadas: 8,
    materialAlBanco: 290,
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without fecha', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, { ...base, fecha: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid turno', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, { ...base, turno: 'NOCTURNO' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with material outside catalog', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, { ...base, tipoMaterial: 'Grava suelta' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with zero materialProducido', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, { ...base, materialProducido: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with horasTrabajadas over 24', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, { ...base, horasTrabajadas: 25 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative materialAlBanco', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, { ...base, materialAlBanco: -5 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid operadorId UUID', async () => {
    const dto = plainToInstance(CreateRegistroCribaDto, { ...base, operadorId: 'no-uuid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass without optional fields (operadorId)', async () => {
    const { operadorId: _op, ...sinOpcionales } = base;
    const dto = plainToInstance(CreateRegistroCribaDto, sinOpcionales);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
