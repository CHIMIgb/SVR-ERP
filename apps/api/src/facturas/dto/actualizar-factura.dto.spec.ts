import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ActualizarFacturaDto } from './actualizar-factura.dto';

describe('ActualizarFacturaDto', () => {
  it('should pass with empty body (all fields optional)', async () => {
    const dto = plainToInstance(ActualizarFacturaDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid fields', async () => {
    const dto = plainToInstance(ActualizarFacturaDto, {
      formaPago: 'PPD',
      moneda: 'MXN',
      tipoCambio: 17.5,
      periodoInicio: '2026-09-01',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid formaPago', async () => {
    const dto = plainToInstance(ActualizarFacturaDto, { formaPago: 'INVALIDO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'formaPago')).toBe(true);
  });

  it('should fail with invalid usoCfdi', async () => {
    const dto = plainToInstance(ActualizarFacturaDto, { usoCfdi: 'ZZ99' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'usoCfdi')).toBe(true);
  });
});