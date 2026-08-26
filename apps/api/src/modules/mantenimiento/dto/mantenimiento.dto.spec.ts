import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateMantenimientoDto } from './create-mantenimiento.dto';
import { UpdateMantenimientoDto } from './update-mantenimiento.dto';
import { QueryMantenimientoDto } from './query-mantenimiento.dto';

describe('CreateMantenimientoDto', () => {
  const base = {
    maquinaId: 'M001',
    tipo: 'Preventivo',
    descripcion: 'Cambio de aceite y filtros',
    fecha: '2026-08-20',
    horasServicio: 1000,
    costo: 5500,
    proximoServicioHoras: 1250,
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateMantenimientoDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid tipo', async () => {
    const dto = plainToInstance(CreateMantenimientoDto, { ...base, tipo: 'Urgente' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with descripcion shorter than 3 chars', async () => {
    const dto = plainToInstance(CreateMantenimientoDto, { ...base, descripcion: 'ab' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid fecha', async () => {
    const dto = plainToInstance(CreateMantenimientoDto, { ...base, fecha: 'no-es-fecha' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative costo', async () => {
    const dto = plainToInstance(CreateMantenimientoDto, { ...base, costo: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateMantenimientoDto', () => {
  it('should pass with an empty payload (all optional)', async () => {
    const dto = plainToInstance(UpdateMantenimientoDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when a provided field is invalid', async () => {
    const dto = plainToInstance(UpdateMantenimientoDto, { costo: -100 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('QueryMantenimientoDto', () => {
  it('should pass with an empty query', async () => {
    const dto = plainToInstance(QueryMantenimientoDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with page < 1', async () => {
    const dto = plainToInstance(QueryMantenimientoDto, { page: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid tipo filter', async () => {
    const dto = plainToInstance(QueryMantenimientoDto, { tipo: 'Urgente' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
