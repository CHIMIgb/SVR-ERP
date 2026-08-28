import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EstadoCotizacion } from '@prisma/client';
import { CambiarEstadoCotizacionDto } from './cambiar-estado-cotizacion.dto';
import { QueryCotizacionesGlobalDto } from './query-cotizaciones-global.dto';

describe('CambiarEstadoCotizacionDto', () => {
  it('should pass with a valid estado', async () => {
    const dto = plainToInstance(CambiarEstadoCotizacionDto, {
      estado: EstadoCotizacion.ACEPTADA,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with an invalid estado', async () => {
    const dto = plainToInstance(CambiarEstadoCotizacionDto, { estado: 'CANCELADA' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('QueryCotizacionesGlobalDto', () => {
  it('should accept optional search, estado, clienteId and pagination', async () => {
    const dto = plainToInstance(QueryCotizacionesGlobalDto, {
      search: 'tierras',
      estado: EstadoCotizacion.PENDIENTE,
      clienteId: '550e8400-e29b-41d4-a716-446655440010',
      page: 2,
      limit: 25,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(25);
  });

  it('should coerce numeric strings for page/limit', async () => {
    const dto = plainToInstance(QueryCotizacionesGlobalDto, { page: '2', limit: '25' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
  });

  it('should fail with invalid estado', async () => {
    const dto = plainToInstance(QueryCotizacionesGlobalDto, { estado: 'NO_EXISTE' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
