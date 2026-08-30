import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateIncidenteDto } from './create-incidente.dto';
import { Prioridad, EstadoIncidente } from '@prisma/client';

describe('CreateIncidenteDto', () => {
  const base = {
    titulo: 'Fuga de aceite',
    descripcion: 'Se detectó fuga',
    prioridad: Prioridad.ALTA,
    estado: EstadoIncidente.ABIERTO,
    fecha: '2025-04-27',
    obraId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateIncidenteDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without titulo', async () => {
    const dto = plainToInstance(CreateIncidenteDto, { ...base, titulo: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without descripcion', async () => {
    const dto = plainToInstance(CreateIncidenteDto, { ...base, descripcion: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid prioridad', async () => {
    const dto = plainToInstance(CreateIncidenteDto, { ...base, prioridad: 'URGENTE' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid estado', async () => {
    const dto = plainToInstance(CreateIncidenteDto, { ...base, estado: 'PENDIENTE' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid fecha', async () => {
    const dto = plainToInstance(CreateIncidenteDto, { ...base, fecha: 'no-es-fecha' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid obraId', async () => {
    const dto = plainToInstance(CreateIncidenteDto, { ...base, obraId: 'no-uuid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass without optional maquinaId', async () => {
    const dto = plainToInstance(CreateIncidenteDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
