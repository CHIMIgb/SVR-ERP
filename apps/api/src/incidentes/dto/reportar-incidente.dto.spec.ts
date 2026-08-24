import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ReportarIncidenteDto } from './reportar-incidente.dto';

describe('ReportarIncidenteDto', () => {
  const base = { descripcion: 'Se reporta por riesgo de caída de material' };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(ReportarIncidenteDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail without descripcion', async () => {
    const dto = plainToInstance(ReportarIncidenteDto, { ...base, descripcion: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with non-string descripcion', async () => {
    const dto = plainToInstance(ReportarIncidenteDto, { ...base, descripcion: 12345 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when descripcion exceeds 2000 characters', async () => {
    const dto = plainToInstance(ReportarIncidenteDto, { ...base, descripcion: 'a'.repeat(2001) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
