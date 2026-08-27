import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TipoTransaccion } from '@prisma/client';
import { UpdateTransaccionDto } from './update-transaccion.dto';

describe('UpdateTransaccionDto', () => {
  it('should pass with empty dto (all fields optional)', async () => {
    const dto = plainToInstance(UpdateTransaccionDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid partial data', async () => {
    const dto = plainToInstance(UpdateTransaccionDto, {
      tipo: TipoTransaccion.EGRESO,
      monto: 500,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid tipo', async () => {
    const dto = plainToInstance(UpdateTransaccionDto, { tipo: 'X' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid categoria', async () => {
    const dto = plainToInstance(UpdateTransaccionDto, { categoria: 'No existe' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative monto', async () => {
    const dto = plainToInstance(UpdateTransaccionDto, { monto: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
