import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TipoTransaccion } from '@prisma/client';
import { QueryTransaccionesDto } from './query-transacciones.dto';

describe('QueryTransaccionesDto', () => {
  it('should pass with empty query', async () => {
    const dto = plainToInstance(QueryTransaccionesDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid filters', async () => {
    const dto = plainToInstance(QueryTransaccionesDto, {
      search: 'anticipo',
      tipo: TipoTransaccion.INGRESO,
      categoria: 'Pago de Obra',
      fechaDesde: '2026-08-01',
      fechaHasta: '2026-08-31',
      page: 2,
      limit: 25,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should coerce string page/limit to numbers', async () => {
    const dto = plainToInstance(QueryTransaccionesDto, { page: '2', limit: '10' });
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
  });

  it('should fail with invalid tipo', async () => {
    const dto = plainToInstance(QueryTransaccionesDto, { tipo: 'X' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid categoria', async () => {
    const dto = plainToInstance(QueryTransaccionesDto, { categoria: 'Nope' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
