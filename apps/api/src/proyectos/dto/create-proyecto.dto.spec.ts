import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProyectoDto } from './create-proyecto.dto';

describe('CreateProyectoDto', () => {
  const base = {
    nombre: 'Puente Atizapán',
    clienteId: '550e8400-e29b-41d4-a716-446655440001',
    presupuesto: 8900000,
    fechaInicio: '2025-06-15',
    fechaFin: '2026-04-20',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateProyectoDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without nombre', async () => {
    const dto = plainToInstance(CreateProyectoDto, { ...base, nombre: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid clienteId', async () => {
    const dto = plainToInstance(CreateProyectoDto, { ...base, clienteId: 'no-uuid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with zero presupuesto', async () => {
    const dto = plainToInstance(CreateProyectoDto, { ...base, presupuesto: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid fechaInicio', async () => {
    const dto = plainToInstance(CreateProyectoDto, { ...base, fechaInicio: 'no-es-fecha' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with progreso over 100', async () => {
    const dto = plainToInstance(CreateProyectoDto, { ...base, progreso: 150 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with optional fields present', async () => {
    const dto = plainToInstance(CreateProyectoDto, {
      ...base,
      progreso: 10,
      ingresoCobrado: 500000,
      gastado: 120000,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
