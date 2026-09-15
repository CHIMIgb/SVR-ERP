import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateMovimientoDto } from './create-movimiento.dto';

describe('CreateMovimientoDto', () => {
  const base = { fecha: '2026-09-01', descripcion: 'Depósito cliente', deposito: 5000 };

  it('should pass with deposito', async () => {
    const dto = plainToInstance(CreateMovimientoDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without fecha', async () => {
    const dto = plainToInstance(CreateMovimientoDto, { ...base, fecha: 'no-date' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should fail without descripcion', async () => {
    const dto = plainToInstance(CreateMovimientoDto, { ...base, descripcion: '' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should fail with monto <= 0', async () => {
    const dto = plainToInstance(CreateMovimientoDto, { ...base, deposito: 0 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});