import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CambiarEstadoOrdenDto } from './cambiar-estado-orden.dto';
import { EstadoOrdenCompra } from '@prisma/client';

describe('CambiarEstadoOrdenDto', () => {
  it('should pass with a valid estado', async () => {
    const dto = plainToInstance(CambiarEstadoOrdenDto, { estado: EstadoOrdenCompra.APROBADA });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass without motivo', async () => {
    const dto = plainToInstance(CambiarEstadoOrdenDto, { estado: EstadoOrdenCompra.RECIBIDA });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid estado', async () => {
    const dto = plainToInstance(CambiarEstadoOrdenDto, { estado: 'INVENTADO' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'estado')).toBe(true);
  });

  it('should fail with motivo longer than 500', async () => {
    const dto = plainToInstance(CambiarEstadoOrdenDto, { estado: EstadoOrdenCompra.CANCELADA, motivo: 'x'.repeat(501) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'motivo')).toBe(true);
  });
});