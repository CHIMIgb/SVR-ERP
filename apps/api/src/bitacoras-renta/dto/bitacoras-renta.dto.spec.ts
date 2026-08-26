import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBitacoraRentaDto } from './create-bitacora-renta.dto';
import { UpdateBitacoraRentaDto } from './update-bitacora-renta.dto';
import { QueryBitacorasRentaDto } from './query-bitacoras-renta.dto';

describe('CreateBitacoraRentaDto', () => {
  const base = {
    trabajadorId: '550e8400-e29b-41d4-a716-446655440000',
    maquinaId: 'M001',
    fecha: '2026-08-20',
    cliente: 'Inmobiliaria ARCO',
    obraUbicacion: 'Fracc. Valle Sur',
    horaInicio: '07:00',
    horaFin: '17:00',
    horasEfectivas: 8,
    horometroInicial: 1245,
    horometroFinal: 1255,
    actividadRealizada: 'Excavación de zanja',
    tarifaHoraRenta: 1450,
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateBitacoraRentaDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid trabajadorId', async () => {
    const dto = plainToInstance(CreateBitacoraRentaDto, { ...base, trabajadorId: 'no-uuid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should require nombreResidente when firmado is true', async () => {
    const dto = plainToInstance(CreateBitacoraRentaDto, { ...base, firmado: true });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nombreResidente')).toBe(true);
  });

  it('should pass without nombreResidente when firmado is false', async () => {
    const dto = plainToInstance(CreateBitacoraRentaDto, { ...base, firmado: false });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with tarifaHoraRenta <= 0', async () => {
    const dto = plainToInstance(CreateBitacoraRentaDto, { ...base, tarifaHoraRenta: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateBitacoraRentaDto', () => {
  it('should pass with an empty payload', async () => {
    const dto = plainToInstance(UpdateBitacoraRentaDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid estadoCobro', async () => {
    const dto = plainToInstance(UpdateBitacoraRentaDto, { estadoCobro: 'Cancelado' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('QueryBitacorasRentaDto', () => {
  it('should pass with an empty query', async () => {
    const dto = plainToInstance(QueryBitacorasRentaDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with an invalid trabajadorId', async () => {
    const dto = plainToInstance(QueryBitacorasRentaDto, { trabajadorId: 'no-uuid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
