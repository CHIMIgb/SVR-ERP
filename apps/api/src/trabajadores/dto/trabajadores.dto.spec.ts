import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTrabajadorDto } from './create-trabajador.dto';
import { UpdateTrabajadorDto } from './update-trabajador.dto';
import { QueryTrabajadoresDto } from './query-trabajadores.dto';
import { LiquidarTrabajadorDto } from './liquidar-trabajador.dto';

describe('CreateTrabajadorDto', () => {
  const base = {
    nombre: 'Juan Pérez García',
    puesto: 'Operador de Excavadora CAT',
    categoriaPuesto: 'Operador',
    telefono: '55 1234 5678',
    entrada: '07:00',
    sueldoFiscal: 2500,
    sueldoEfectivo: 3500,
    metodoPago: 'Mixto',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, base);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid categoriaPuesto', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, { ...base, categoriaPuesto: 'Piloto' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid metodoPago', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, { ...base, metodoPago: 'Cripto' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative sueldoFiscal', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, { ...base, sueldoFiscal: -100 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate nested licencia', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, {
      ...base,
      licencia: { tipo: 'DC3 Operador', categoria: 'DC3', folio: 'FOL-001' },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid nested licencia categoria', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, {
      ...base,
      licencia: { tipo: 'DC3 Operador', categoria: 'Inventada', folio: 'FOL-001' },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateTrabajadorDto', () => {
  it('should pass with an empty payload', async () => {
    const dto = plainToInstance(UpdateTrabajadorDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid estado', async () => {
    const dto = plainToInstance(UpdateTrabajadorDto, { estado: 'Suspendido' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('QueryTrabajadoresDto', () => {
  it('should pass with an empty query', async () => {
    const dto = plainToInstance(QueryTrabajadoresDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with page < 1', async () => {
    const dto = plainToInstance(QueryTrabajadoresDto, { page: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('LiquidarTrabajadorDto', () => {
  it('should pass with valid data', async () => {
    const dto = plainToInstance(LiquidarTrabajadorDto, {
      tipoTerminacion: 'Despido',
      diasTrabajadosPeriodo: 6,
      diasVacacionesPendientes: 8,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid tipoTerminacion', async () => {
    const dto = plainToInstance(LiquidarTrabajadorDto, {
      tipoTerminacion: 'Vacaciones',
      diasTrabajadosPeriodo: 6,
      diasVacacionesPendientes: 8,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
