import type { MaquinaCampoDTO } from '@/lib/api';
import {
  agruparPorObra,
  contarPestanas,
  esFlotaValida,
  estadoUi,
  filtrarMaquinas,
  haceCuanto,
  normalizar,
  pingSinSenal,
  totalPorObra,
  urlMapa,
} from './flota-campo';

const obraNorte = { proyectoId: 'p1', nombre: 'Obra Cribas Norte', ubicacion: 'Km 12', lat: 20.6, lng: -105.2 };
const obraSur = { proyectoId: 'p2', nombre: 'Obra Puente Sur', ubicacion: null, lat: null, lng: null };

function maquina(parcial: Partial<MaquinaCampoDTO>): MaquinaCampoDTO {
  return {
    id: 'm',
    codigo: 'M001',
    nombre: 'Criba 1',
    tipo: 'Criba',
    estado: 'operando',
    obraHoy: obraNorte,
    encargado: { nombre: 'Luis Pérez', rol: 'Operador' },
    posicion: null,
    ...parcial,
  };
}

const flota = [
  maquina({ id: 'a', nombre: 'Criba 1', codigo: 'M001' }),
  maquina({ id: 'b', nombre: 'Cargador 3', codigo: 'M002', tipo: 'Cargador', obraHoy: obraSur, encargado: { nombre: 'Andrés Gómez', rol: 'Operador' } }),
  maquina({ id: 'c', nombre: 'Camión 07', codigo: 'M003', tipo: 'Transporte', estado: 'en_taller', obraHoy: null, encargado: { nombre: 'Pedro Ruiz', rol: 'Chofer' } }),
  maquina({ id: 'd', nombre: 'Camión 11', codigo: 'M004', tipo: 'Transporte', obraHoy: obraNorte, encargado: null }),
];

describe('flota-campo', () => {
  it('normalizar quita acentos, mayúsculas y espacios repetidos', () => {
    expect(normalizar('  Camión  PÉREZ ')).toBe('camion perez');
    expect(normalizar('Güemes Ñuño')).toBe('guemes nuno');
  });

  it('totalPorObra cuenta las máquinas de cada obra sin filtrar', () => {
    expect(Object.fromEntries(totalPorObra(flota))).toEqual({ p1: 2, p2: 1 });
  });

  describe('filtrarMaquinas', () => {
    it('sin texto devuelve todo', () => {
      expect(filtrarMaquinas(flota, '   ')).toHaveLength(4);
    });
    it('por máquina sin acentos', () => {
      expect(filtrarMaquinas(flota, 'camion').map((m) => m.id)).toEqual(['c', 'd']);
    });
    it('por código y por tipo', () => {
      expect(filtrarMaquinas(flota, 'm002').map((m) => m.id)).toEqual(['b']);
      expect(filtrarMaquinas(flota, 'transporte').map((m) => m.id)).toEqual(['c', 'd']);
    });
    it('por obra y por la ubicación de la obra', () => {
      expect(filtrarMaquinas(flota, 'puente').map((m) => m.id)).toEqual(['b']);
      expect(filtrarMaquinas(flota, 'km 12').map((m) => m.id)).toEqual(['a', 'd']);
    });
    it('por encargado', () => {
      expect(filtrarMaquinas(flota, 'gomez').map((m) => m.id)).toEqual(['b']);
    });
    it('una máquina sin obra ni encargado no truena', () => {
      expect(filtrarMaquinas([maquina({ obraHoy: null, encargado: null, codigo: null })], 'x')).toEqual([]);
    });
  });

  it('agruparPorObra: solo las que tienen obra hoy, ordenadas por nombre', () => {
    const obras = agruparPorObra(flota);
    expect(obras.map((o) => [o.nombre, o.maquinas.map((m) => m.id)])).toEqual([
      ['Obra Cribas Norte', ['a', 'd']],
      ['Obra Puente Sur', ['b']],
    ]);
  });

  it('contarPestanas cuenta máquinas, obras y las que están en taller', () => {
    expect(contarPestanas(flota)).toEqual({ maquinaria: 4, obras: 2, taller: 1 });
  });

  it('urlMapa arma la búsqueda universal de Google Maps', () => {
    expect(urlMapa(20.6512, -105.2234)).toBe('https://www.google.com/maps/search/?api=1&query=20.6512,-105.2234');
  });

  it('estadoUi: los tres conocidos y "Sin estado" para uno que no conoce (no truena)', () => {
    expect(estadoUi('operando')).toEqual({ etiqueta: 'Operando', variante: 'success' });
    expect(estadoUi('en_taller').etiqueta).toBe('En taller');
    expect(estadoUi('detenida').etiqueta).toBe('Detenida');
    expect(estadoUi('averiada')).toEqual({ etiqueta: 'Sin estado', variante: 'neutral' });
  });

  describe('pingSinSenal', () => {
    const ahora = new Date('2026-11-24T18:00:00Z');
    it('respeta el flag del servidor', () => {
      expect(pingSinSenal({ lat: 1, lng: 1, fechaHora: '2026-11-24T17:59:00Z', sinSenal: true }, ahora)).toBe(true);
    });
    it('una copia vieja con sinSenal=false igual queda sin señal por la hora', () => {
      expect(pingSinSenal({ lat: 1, lng: 1, fechaHora: '2026-11-22T17:59:00Z', sinSenal: false }, ahora)).toBe(true);
      expect(pingSinSenal({ lat: 1, lng: 1, fechaHora: '2026-11-24T17:40:00Z', sinSenal: false }, ahora)).toBe(true);
    });
    it('un ping reciente sigue con señal', () => {
      expect(pingSinSenal({ lat: 1, lng: 1, fechaHora: '2026-11-24T17:50:00Z', sinSenal: false }, ahora)).toBe(false);
    });
  });

  it('esFlotaValida acepta la forma mínima y rechaza copias corruptas o viejas', () => {
    expect(esFlotaValida({ fecha: '2026-11-24', truncado: false, maquinas: [] })).toBe(true);
    expect(esFlotaValida(null)).toBe(false);
    expect(esFlotaValida({ fecha: '2026-11-24' })).toBe(false);
    expect(esFlotaValida({ maquinas: [] })).toBe(false);
    expect(esFlotaValida({ items: [], pagination: {} })).toBe(false);
  });

  describe('haceCuanto', () => {
    const ahora = new Date('2026-11-24T18:00:00Z');
    it.each([
      ['2026-11-24T17:59:40Z', 'hace un momento'],
      ['2026-11-24T17:57:00Z', 'hace 3 min'],
      ['2026-11-24T17:00:00Z', 'hace 1 h'],
      ['2026-11-24T13:00:00Z', 'hace 5 h'],
      ['2026-11-23T17:00:00Z', 'ayer'],
      ['2026-11-20T18:00:00Z', 'hace 4 días'],
    ])('%s → %s', (iso, texto) => {
      expect(haceCuanto(iso, ahora)).toBe(texto);
    });
  });
});
