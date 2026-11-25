import { Prisma } from '@prisma/client';
import { FlotaCampoService } from './flota-campo.service';
import { TOPE_CATALOGO_MAQUINAS } from '../modules/maquinas/maquinas.service';
import { PrismaService } from '../prisma/prisma.service';

/** Fila como la devuelve el findMany con el select del servicio. */
function maquina(parcial: Record<string, unknown> = {}) {
  return {
    id: 'maq-1',
    codigo: 'M001',
    nombre: 'Criba 1',
    estado: 'ENCENDIDA',
    tipos_maquina: { nombre: 'Criba' },
    trabajadores: { nombre: 'Luis Pérez', puesto: 'Operador', eliminado_en: null },
    despachos_maquina: [
      {
        proyectos: {
          id: 'proy-1',
          nombre: 'Proyecto Cribas',
          obras: [{ id: 'obra-1', nombre: 'Obra Cribas Norte', ubicacion: 'Km 12', lat: new Prisma.Decimal('20.6'), lng: new Prisma.Decimal('-105.2') }],
        },
      },
    ],
    ...parcial,
  };
}

describe('FlotaCampoService', () => {
  const zonaOriginal = process.env.TIMEZONE;
  let prisma: { maquinas: { findMany: jest.Mock }; $queryRaw: jest.Mock };
  let service: FlotaCampoService;

  beforeEach(() => {
    process.env.TIMEZONE = 'America/Mexico_City';
    // 24-nov-2026 a las 20:30 en México = 25-nov 02:30 UTC: el caso en que cortar el día por UTC falla.
    jest.useFakeTimers({ now: new Date('2026-11-25T02:30:00Z'), doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    prisma = { maquinas: { findMany: jest.fn().mockResolvedValue([maquina()]) }, $queryRaw: jest.fn().mockResolvedValue([]) };
    service = new FlotaCampoService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.TIMEZONE = zonaOriginal;
  });

  it('"hoy" es el día de la empresa, no el de UTC: a las 20:30 de México sigue siendo el 24', async () => {
    const r = await service.findCampo();
    expect(r.fecha).toBe('2026-11-24');
    const where = prisma.maquinas.findMany.mock.calls[0][0].select.despachos_maquina.where;
    expect(where.fecha_inicio).toEqual({ lte: new Date('2026-11-24T00:00:00Z') });
    expect(where.fecha_fin).toEqual({ gte: new Date('2026-11-24T00:00:00Z') });
    expect(where).toMatchObject({ eliminado_en: null, activo: true, proyectos: { eliminado_en: null } });
  });

  it('solo máquinas vivas y activas', async () => {
    await service.findCampo();
    expect(prisma.maquinas.findMany.mock.calls[0][0].where).toEqual({ eliminado_en: null, activo: true });
  });

  it.each([
    ['ENCENDIDA', 'operando'],
    ['MOVIMIENTO', 'operando'],
    ['MANTENIMIENTO', 'en_taller'],
    ['APAGADA', 'detenida'],
  ])('estado %s → %s', async (db, campo) => {
    prisma.maquinas.findMany.mockResolvedValue([maquina({ estado: db })]);
    const r = await service.findCampo();
    expect(r.maquinas[0].estado).toBe(campo);
  });

  it('obra de hoy: el nombre de la obra, con su ubicación y coordenadas', async () => {
    const r = await service.findCampo();
    expect(r.maquinas[0].obraHoy).toEqual({
      proyectoId: 'proy-1',
      nombre: 'Obra Cribas Norte',
      ubicacion: 'Km 12',
      lat: 20.6,
      lng: -105.2,
    });
  });

  it('proyecto sin obra: usa el nombre del proyecto y sin coordenadas', async () => {
    prisma.maquinas.findMany.mockResolvedValue([
      maquina({ despachos_maquina: [{ proyectos: { id: 'proy-2', nombre: 'Puente Sur', obras: [] } }] }),
    ]);
    const r = await service.findCampo();
    expect(r.maquinas[0].obraHoy).toEqual({ proyectoId: 'proy-2', nombre: 'Puente Sur', ubicacion: null, lat: null, lng: null });
  });

  it('sin despacho vigente hoy: obraHoy null', async () => {
    prisma.maquinas.findMany.mockResolvedValue([maquina({ despachos_maquina: [] })]);
    const r = await service.findCampo();
    expect(r.maquinas[0].obraHoy).toBeNull();
  });

  it('encargado: "Chofer" por el puesto del trabajador, "Operador" en lo demás', async () => {
    prisma.maquinas.findMany.mockResolvedValue([
      maquina({ id: 'a', trabajadores: { nombre: 'Pedro Ruiz', puesto: 'Chofer', eliminado_en: null } }),
      maquina({ id: 'b', trabajadores: { nombre: 'Luis Pérez', puesto: 'Operador', eliminado_en: null } }),
      maquina({ id: 'c', trabajadores: null }),
    ]);
    const r = await service.findCampo();
    expect(r.maquinas.map((m) => m.encargado)).toEqual([
      { nombre: 'Pedro Ruiz', rol: 'Chofer' },
      { nombre: 'Luis Pérez', rol: 'Operador' },
      null,
    ]);
  });

  it('un operador dado de baja no aparece como encargado', async () => {
    prisma.maquinas.findMany.mockResolvedValue([
      maquina({ trabajadores: { nombre: 'Ex operador', puesto: 'Operador', eliminado_en: new Date('2026-11-01') } }),
    ]);
    const r = await service.findCampo();
    expect(r.maquinas[0].encargado).toBeNull();
  });

  it('posición del último ping; sin señal si tiene más de 15 min', async () => {
    prisma.maquinas.findMany.mockResolvedValue([maquina({ id: 'a' }), maquina({ id: 'b' })]);
    prisma.$queryRaw.mockResolvedValue([
      { maquina_id: 'a', fecha_hora: new Date('2026-11-25T02:25:00Z'), lat: new Prisma.Decimal('20.61'), lng: new Prisma.Decimal('-105.23') },
      { maquina_id: 'b', fecha_hora: new Date('2026-11-25T02:00:00Z'), lat: new Prisma.Decimal('20.7'), lng: new Prisma.Decimal('-105.3') },
    ]);
    const r = await service.findCampo();
    expect(r.maquinas[0].posicion).toEqual({ lat: 20.61, lng: -105.23, fechaHora: '2026-11-25T02:25:00.000Z', sinSenal: false });
    expect(r.maquinas[1].posicion).toMatchObject({ sinSenal: true });
  });

  it('sin ping no inventa la posición (no cae a maquinas.lat/lng, que nacen con un punto por defecto)', async () => {
    const r = await service.findCampo();
    expect(r.maquinas[0].posicion).toBeNull();
  });

  it('no devuelve costos, horómetro, combustible ni sueldos', async () => {
    const r = await service.findCampo();
    const texto = JSON.stringify(r).toLowerCase();
    for (const campo of ['costo', 'horometro', 'combustible', 'sueldo', 'mantenimiento']) {
      expect(texto).not.toContain(campo);
    }
    const select = prisma.maquinas.findMany.mock.calls[0][0].select;
    expect(Object.keys(select).sort()).toEqual(
      ['codigo', 'despachos_maquina', 'estado', 'id', 'nombre', 'tipos_maquina', 'trabajadores'].sort(),
    );
  });

  it('sin máquinas no consulta el GPS (IN () truena)', async () => {
    prisma.maquinas.findMany.mockResolvedValue([]);
    const r = await service.findCampo();
    expect(r.maquinas).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('marca truncado si la flota pasa del tope del catálogo', async () => {
    const muchas = Array.from({ length: TOPE_CATALOGO_MAQUINAS + 1 }, (_, i) => maquina({ id: `m${i}` }));
    prisma.maquinas.findMany.mockResolvedValue(muchas);
    const r = await service.findCampo();
    expect(r.truncado).toBe(true);
    expect(r.maquinas).toHaveLength(TOPE_CATALOGO_MAQUINAS);
    expect(prisma.maquinas.findMany.mock.calls[0][0].take).toBe(TOPE_CATALOGO_MAQUINAS + 1);
  });
});
