import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBancoDto } from './create-banco.dto';

describe('CreateBancoDto', () => {
  it('should pass with valid nombre', async () => {
    const dto = plainToInstance(CreateBancoDto, { nombre: 'BBVA' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without nombre', async () => {
    const dto = plainToInstance(CreateBancoDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should fail with empty nombre', async () => {
    const dto = plainToInstance(CreateBancoDto, { nombre: '' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});