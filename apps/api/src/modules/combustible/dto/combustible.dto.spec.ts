import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCargaCombustibleDto } from './create-carga-combustible.dto';
import { UpdateCargaCombustibleDto } from './update-carga-combustible.dto';
import { QueryCargaCombustibleDto } from './query-carga-combustible.dto';

describe('CreateCargaCombustibleDto', () => {
  const base = {
    maquinaId: 'M001',
    litros: 112,
    horasTrabajadasPeriodo: 8,
    lugar: 'Gasolinera Norte',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateCargaCombustibleDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass without the optional fields (costo/operador/fecha)', async () => {
    const dto = plainToInstance(CreateCargaCombustibleDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with litros <= 0', async () => {
    const dto = plainToInstance(CreateCargaCombustibleDto, { ...base, litros: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with lugar shorter than 3 chars', async () => {
    const dto = plainToInstance(CreateCargaCombustibleDto, { ...base, lugar: 'ab' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative horasTrabajadasPeriodo', async () => {
    const dto = plainToInstance(CreateCargaCombustibleDto, { ...base, horasTrabajadasPeriodo: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid fecha when provided', async () => {
    const dto = plainToInstance(CreateCargaCombustibleDto, { ...base, fecha: 'no-es-fecha' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateCargaCombustibleDto', () => {
  it('should pass with an empty payload (all optional)', async () => {
    const dto = plainToInstance(UpdateCargaCombustibleDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when a provided field is invalid', async () => {
    const dto = plainToInstance(UpdateCargaCombustibleDto, { litros: -5 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('QueryCargaCombustibleDto', () => {
  it('should pass with an empty query', async () => {
    const dto = plainToInstance(QueryCargaCombustibleDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with limit < 1', async () => {
    const dto = plainToInstance(QueryCargaCombustibleDto, { limit: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with a non-boolean soloAlertas', async () => {
    const dto = plainToInstance(QueryCargaCombustibleDto, { soloAlertas: 'maybe' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
