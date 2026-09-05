import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TipoTransaccion } from '@prisma/client';
import { CreateTransaccionDto } from './create-transaccion.dto';

describe('CreateTransaccionDto', () => {
  const base = {
    tipo: TipoTransaccion.INGRESO,
    categoria: 'Pago de Obra',
    monto: 15000,
    fecha: '2026-08-20',
    descripcion: 'Anticipo obra Vista al Mar',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateTransaccionDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without tipo', async () => {
    const dto = plainToInstance(CreateTransaccionDto, { ...base, tipo: undefined });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid tipo', async () => {
    const dto = plainToInstance(CreateTransaccionDto, { ...base, tipo: 'TRANSFERENCIA' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with categoria outside catalog', async () => {
    const dto = plainToInstance(CreateTransaccionDto, { ...base, categoria: 'Inversión' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with zero/negative monto', async () => {
    const dto = plainToInstance(CreateTransaccionDto, { ...base, monto: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without fecha', async () => {
    const dto = plainToInstance(CreateTransaccionDto, { ...base, fecha: 'no-date' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without descripcion', async () => {
    const dto = plainToInstance(CreateTransaccionDto, { ...base, descripcion: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
