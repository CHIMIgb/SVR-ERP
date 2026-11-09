import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateLecturaHorometroDto } from './create-lectura-horometro.dto';

describe('CreateLecturaHorometroDto', () => {
  const base = { maquinaId: 'M001', fecha: '2026-11-05', lecturaInicial: 1245.5, lecturaFinal: 1253.25 };
  const errores = async (datos: Record<string, unknown>) => validate(plainToInstance(CreateLecturaHorometroDto, datos));

  it('pasa con datos válidos y recorta el código', async () => {
    const dto = plainToInstance(CreateLecturaHorometroDto, { ...base, maquinaId: '  M001 ' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.maquinaId).toBe('M001');
  });

  it.each([
    ['sin máquina', { maquinaId: '   ' }],
    ['código de más de 20 caracteres', { maquinaId: 'M'.repeat(21) }],
    ['fecha inválida', { fecha: '05/11/2026' }],
    ['lectura negativa', { lecturaInicial: -1 }],
    ['más de 2 decimales', { lecturaFinal: 10.123 }],
    ['lectura que no cabe en la columna', { lecturaFinal: 100_000_000 }],
    ['lectura como texto', { lecturaInicial: '100' }],
  ])('falla con %s', async (_caso, cambio) => {
    expect((await errores({ ...base, ...cambio })).length).toBeGreaterThan(0);
  });
});
