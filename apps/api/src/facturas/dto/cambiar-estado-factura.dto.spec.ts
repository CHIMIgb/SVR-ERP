import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CambiarEstadoFacturaDto } from './cambiar-estado-factura.dto';

describe('CambiarEstadoFacturaDto', () => {
  it('should pass with estado TIMBRADA', async () => {
    const dto = plainToInstance(CambiarEstadoFacturaDto, { estado: 'TIMBRADA' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with estado CANCELADA and motivo', async () => {
    const dto = plainToInstance(CambiarEstadoFacturaDto, { estado: 'CANCELADA', motivoCancelacion: 'Datos incorrectos' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without estado', async () => {
    const dto = plainToInstance(CambiarEstadoFacturaDto, {});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'estado')).toBe(true);
  });

  it('should fail with estado no permitido (PENDIENTE)', async () => {
    const dto = plainToInstance(CambiarEstadoFacturaDto, { estado: 'PENDIENTE' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'estado')).toBe(true);
  });
});