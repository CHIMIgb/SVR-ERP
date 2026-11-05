import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateGeocercaDto } from './create-geocerca.dto';
import { UpdateGeocercaDto } from './update-geocerca.dto';
import { QueryGeocercasDto } from './query-geocercas.dto';
import { QueryHistorialDto } from './query-historial.dto';

const base = {
  nombre: 'Obra Norte',
  tipo: 'OBRA',
  centroLat: 19.4326,
  centroLng: -99.1332,
  radioMetros: 300,
};

async function erroresDe(dto: object, cls: new () => object = CreateGeocercaDto) {
  const instancia = plainToInstance(cls, dto);
  const errores = await validate(instancia as object);
  return errores.map((e) => e.property);
}

describe('CreateGeocercaDto', () => {
  it('acepta una geocerca válida', async () => {
    expect(await erroresDe(base)).toEqual([]);
  });

  it('rechaza un tipo fuera del dominio del CHECK de la tabla', async () => {
    expect(await erroresDe({ ...base, tipo: 'Taller' })).toContain('tipo');
  });

  it('acepta los cinco tipos permitidos', async () => {
    for (const tipo of ['OBRA', 'PATIO', 'ESTACION', 'RUTA', 'PROHIBIDA']) {
      expect(await erroresDe({ ...base, tipo })).toEqual([]);
    }
  });

  it('rechaza un nombre de menos de 3 caracteres', async () => {
    expect(await erroresDe({ ...base, nombre: 'AB' })).toContain('nombre');
  });

  it('rechaza latitud fuera de rango', async () => {
    expect(await erroresDe({ ...base, centroLat: 91 })).toContain('centroLat');
    expect(await erroresDe({ ...base, centroLat: -91 })).toContain('centroLat');
  });

  it('rechaza longitud fuera de rango', async () => {
    expect(await erroresDe({ ...base, centroLng: 181 })).toContain('centroLng');
    expect(await erroresDe({ ...base, centroLng: -181 })).toContain('centroLng');
  });

  it('rechaza un radio menor a 10 m o mayor a 50 km', async () => {
    expect(await erroresDe({ ...base, radioMetros: 9 })).toContain('radioMetros');
    expect(await erroresDe({ ...base, radioMetros: 50001 })).toContain('radioMetros');
  });

  it('rechaza un color que no sea hex de 6 dígitos', async () => {
    expect(await erroresDe({ ...base, color: 'rojo' })).toContain('color');
    expect(await erroresDe({ ...base, color: '#fff' })).toContain('color');
    expect(await erroresDe({ ...base, color: '#3b82f6' })).toEqual([]);
  });

  it('rechaza más de 6 decimales en las coordenadas (precisión de la columna)', async () => {
    expect(await erroresDe({ ...base, centroLat: 19.43261234 })).toContain('centroLat');
  });
});

describe('UpdateGeocercaDto', () => {
  it('acepta un objeto vacío (todos los campos son opcionales)', async () => {
    expect(await erroresDe({}, UpdateGeocercaDto)).toEqual([]);
  });

  it('valida los campos que sí vienen', async () => {
    expect(await erroresDe({ radioMetros: 3 }, UpdateGeocercaDto)).toContain('radioMetros');
    expect(await erroresDe({ tipo: 'INVENTADO' }, UpdateGeocercaDto)).toContain('tipo');
  });
});

describe('QueryGeocercasDto', () => {
  it('acepta filtros válidos', async () => {
    expect(await erroresDe({ search: 'obra', tipo: 'OBRA', activa: 'true', page: 1, limit: 20 }, QueryGeocercasDto)).toEqual([]);
  });

  it('rechaza activa con un valor que no sea booleano en texto', async () => {
    expect(await erroresDe({ activa: 'si' }, QueryGeocercasDto)).toContain('activa');
  });

  it('rechaza página menor a 1', async () => {
    expect(await erroresDe({ page: 0 }, QueryGeocercasDto)).toContain('page');
  });
});

describe('QueryHistorialDto', () => {
  it('acepta fecha ISO y límite dentro de rango', async () => {
    expect(await erroresDe({ fecha: '2026-09-13', limit: 100 }, QueryHistorialDto)).toEqual([]);
  });

  it('rechaza un límite mayor al máximo permitido', async () => {
    expect(await erroresDe({ limit: 501 }, QueryHistorialDto)).toContain('limit');
  });

  it('rechaza una fecha que no sea ISO', async () => {
    expect(await erroresDe({ fecha: '13/09/2026' }, QueryHistorialDto)).toContain('fecha');
  });
});
