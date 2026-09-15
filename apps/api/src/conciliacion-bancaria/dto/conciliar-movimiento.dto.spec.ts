import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConciliarMovimientoDto } from './conciliar-movimiento.dto';

describe('ConciliarMovimientoDto', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440005';

  it('should pass with valid transaccionId', async () => {
    const dto = plainToInstance(ConciliarMovimientoDto, { transaccionId: validUuid });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without transaccionId', async () => {
    const dto = plainToInstance(ConciliarMovimientoDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should fail with non-uuid transaccionId', async () => {
    const dto = plainToInstance(ConciliarMovimientoDto, { transaccionId: 'not-a-uuid' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});