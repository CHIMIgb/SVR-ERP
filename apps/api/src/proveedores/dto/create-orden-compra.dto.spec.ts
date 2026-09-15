import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrdenCompraDto } from './create-orden-compra.dto';

describe('CreateOrdenCompraDto', () => {
  const base = {
    proveedorId: '3e4b04a7-5f2a-4c1e-9b7d-8a2f0e1c9d6b',
    descripcion: 'Compra de refacciones',
    monto: 12500,
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without proveedorId', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, proveedorId: undefined });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'proveedorId')).toBe(true);
  });

  it('should fail with monto 0', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, monto: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'monto')).toBe(true);
  });

  it('should fail with bad fecha', async () => {
    const dto = plainToInstance(CreateOrdenCompraDto, { ...base, fecha: 'ayer' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'fecha')).toBe(true);
  });
});