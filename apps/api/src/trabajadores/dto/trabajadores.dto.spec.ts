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
    fechaContratacion: '2024-03-01',
    // ID estilo seed (versión 0): IsUUID lo rechazaba; el regex laxo debe aceptarlo.
    rolId: 'e0000000-0000-0000-0000-0000000000a5',
  };

  it('should fail with invalid rolId (P14: el alta siempre crea la identidad)', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, { ...base, rolId: 'no-uuid' });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('rolId');
  });

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

  it.each(['7am', '7:00', '24:00', '07:60', ''])('should fail with entrada "%s" (not HH:mm)', async (entrada) => {
    const dto = plainToInstance(CreateTrabajadorDto, { ...base, entrada });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('entrada');
  });

  it('should require fechaContratacion (the finiquito seniority comes from it)', async () => {
    const { fechaContratacion: _omitida, ...sinFecha } = base;
    void _omitida;
    const errors = await validate(plainToInstance(CreateTrabajadorDto, sinFecha));
    expect(errors.map((e) => e.property)).toContain('fechaContratacion');
  });

  it.each(['       ', '55-abc-1234', '12345'])('should fail with telefono "%s" (needs 7 digits)', async (telefono) => {
    const errors = await validate(plainToInstance(CreateTrabajadorDto, { ...base, telefono }));
    expect(errors.map((e) => e.property)).toContain('telefono');
  });

  it('should trim nombre before validating its length ("  a  " is not a name)', async () => {
    const errors = await validate(plainToInstance(CreateTrabajadorDto, { ...base, nombre: '  a  ' }));
    expect(errors.map((e) => e.property)).toContain('nombre');
  });

  it('should fail with a telefono longer than 20 characters', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, { ...base, telefono: '5'.repeat(21) });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('telefono');
  });

  it('should fail with invalid nested licencia categoria', async () => {
    const dto = plainToInstance(CreateTrabajadorDto, {
      ...base,
      licencia: { tipo: 'DC3 Operador', categoria: 'Inventada', folio: 'FOL-001' },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  // Topes de las columnas: antes un valor fuera de rango pasaba el DTO y la BD respondía con un 500.
  it.each([
    ['vacacionesDias con decimales (la columna es Int)', { vacacionesDias: 2.5 }],
    ['vacacionesDias de más de un año', { vacacionesDias: 400 }],
    ['horasExtraSemana de más de 168 h', { horasExtraSemana: 200 }],
    ['tarifaHoraExtra que no cabe en Decimal(10,2)', { tarifaHoraExtra: 1e9 }],
    ['descuentosSemana con 3 decimales', { descuentosSemana: 10.555 }],
  ])('should fail with %s', async (_caso, extra) => {
    const errors = await validate(plainToInstance(CreateTrabajadorDto, { ...base, ...extra }));
    expect(errors.map((e) => e.property)).toContain(Object.keys(extra)[0]);
  });

  it('should fail with a contacto de emergencia phone that is not a phone, or oversized texts', async () => {
    const telefonoMalo = await validate(
      plainToInstance(CreateTrabajadorDto, { ...base, contactoEmergencia: { nombre: 'María', telefono: 'abcdefgh', parentesco: 'Esposa' } }),
    );
    expect(telefonoMalo.map((e) => e.property)).toContain('contactoEmergencia');
    const folioEnorme = await validate(
      plainToInstance(CreateTrabajadorDto, { ...base, licencia: { tipo: 'DC3', categoria: 'DC3', folio: 'F'.repeat(300) } }),
    );
    expect(folioEnorme.map((e) => e.property)).toContain('licencia');
  });
});

describe('UpdateTrabajadorDto', () => {
  it('should pass with an empty payload', async () => {
    const dto = plainToInstance(UpdateTrabajadorDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with entrada not in HH:mm', async () => {
    const dto = plainToInstance(UpdateTrabajadorDto, { entrada: '25:00' });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('entrada');
  });

  it('should fail with invalid estado', async () => {
    const dto = plainToInstance(UpdateTrabajadorDto, { estado: 'Suspendido' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it.each([
    ['vacacionesDias con decimales', { vacacionesDias: 1.5 }],
    ['horasExtraSemana de más de 168 h', { horasExtraSemana: 500 }],
    ['tarifaHoraExtra que no cabe en Decimal(10,2)', { tarifaHoraExtra: 1e9 }],
    ['descuentosSemana que no cabe en Decimal(10,2)', { descuentosSemana: 1e9 }],
  ])('should fail with %s', async (_caso, extra) => {
    const errors = await validate(plainToInstance(UpdateTrabajadorDto, extra));
    expect(errors.map((e) => e.property)).toContain(Object.keys(extra)[0]);
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

  it('should fail with more than 31 dias trabajados or 365 dias de vacaciones', async () => {
    const dto = plainToInstance(LiquidarTrabajadorDto, {
      tipoTerminacion: 'Renuncia',
      diasTrabajadosPeriodo: 32,
      diasVacacionesPendientes: 366,
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property).sort()).toEqual(['diasTrabajadosPeriodo', 'diasVacacionesPendientes']);
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
