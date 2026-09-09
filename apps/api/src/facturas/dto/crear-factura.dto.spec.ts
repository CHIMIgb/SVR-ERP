import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CrearFacturaDto } from './crear-factura.dto';

describe('CrearFacturaDto', () => {
  const base = {
    clienteId: '3e4b04a7-5f2a-4c1e-9b7d-8a2f0e1c9d6b',
    conceptos: [
      { cantidad: 1, unidad: 'Servicio', descripcion: 'Renta de maquinaria', valorUnitario: 1500 },
    ],
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CrearFacturaDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without clienteId', async () => {
    const dto = plainToInstance(CrearFacturaDto, { ...base, clienteId: undefined });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'clienteId')).toBe(true);
  });

  it('should fail with invalid clienteId', async () => {
    const dto = plainToInstance(CrearFacturaDto, { ...base, clienteId: 'no-uuid' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'clienteId')).toBe(true);
  });

  it('should fail without conceptos', async () => {
    const dto = plainToInstance(CrearFacturaDto, { clienteId: base.clienteId });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'conceptos')).toBe(true);
  });

  it('should fail with concepto cantidad 0', async () => {
    const dto = plainToInstance(CrearFacturaDto, {
      ...base,
      conceptos: [{ cantidad: 0, unidad: 'Servicio', descripcion: 'x', valorUnitario: 100 }],
    });
    const errors = await validate(dto);
    expect(errors).not.toHaveLength(0);
  });

  it('should fail with invalid formaPago', async () => {
    const dto = plainToInstance(CrearFacturaDto, { ...base, formaPago: 'CONTADO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'formaPago')).toBe(true);
  });
});