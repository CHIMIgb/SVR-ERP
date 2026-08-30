import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReporteCampoDto } from './create-reporte-campo.dto';
import { CambiarEstadoDto } from './cambiar-estado.dto';

describe('CreateReporteCampoDto', () => {
  const base = {
    tipo: 'PIPERO',
    usuario: 'Marcos G.',
    maquinaId: '550e8400-e29b-41d4-a716-446655440020',
    obraTexto: 'Valle Sur',
    fecha: '2025-04-27',
    hora: '14:15',
    descripcion: 'Suministro de 200L de diésel. Tanque lleno.',
    prioridad: 'MEDIA',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid tipo', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, { ...base, tipo: 'SUPERVISOR' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail without usuario', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, { ...base, usuario: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with bad hora format', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, { ...base, hora: '25:99' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid prioridad', async () => {
    const dto = plainToInstance(CreateReporteCampoDto, { ...base, prioridad: 'URGENTE' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass without optionals (maquinaId, obraId, prioridad)', async () => {
    const { maquinaId: _m, prioridad: _p, ...sinOpcionales } = base;
    const dto = plainToInstance(CreateReporteCampoDto, sinOpcionales);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('CambiarEstadoDto', () => {
  it('should pass with a valid estado', async () => {
    const dto = plainToInstance(CambiarEstadoDto, { estado: 'ATENDIDO' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with an invalid estado', async () => {
    const dto = plainToInstance(CambiarEstadoDto, { estado: 'CANCELADO' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
