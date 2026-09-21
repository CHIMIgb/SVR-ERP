import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCuentaDto } from './create-cuenta.dto';

describe('CreateCuentaDto', () => {
  it('should pass with numero only', async () => {
    const dto = plainToInstance(CreateCuentaDto, { numero: '0123456789' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without numero', async () => {
    const dto = plainToInstance(CreateCuentaDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should fail with negative saldoInicial', async () => {
    const dto = plainToInstance(CreateCuentaDto, { numero: '0123456789', saldoInicial: -1 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});