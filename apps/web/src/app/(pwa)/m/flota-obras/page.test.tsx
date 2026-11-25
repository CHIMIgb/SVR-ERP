/**
 * "Flota y obras" (PWA, Técnico) en sus estados, incluido sin red: el apiClient LANZA cuando fetch falla (API
 * caída / sin señal) y devuelve API_DOWN cuando el refresh del token falla sin red; la pantalla sirve la copia
 * guardada con su aviso o, sin copia, el error con Reintentar. Con datos en pantalla, un fallo al actualizar
 * no los borra.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import FlotaObrasMovilPage from './page';
import { maquinasApi, type FlotaCampoDTO, type MaquinaCampoDTO } from '@/lib/api';
import { MENSAJE_SIN_CONEXION, fechaHoyEnZona } from '@/lib/pwa/asistencia-propia';
import { guardarDatos } from '@/lib/pwa/datos-cache';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  maquinasApi: { campo: jest.fn() },
}));
// Objeto nuevo en cada render: la página solo usa el `userId` plano (no lo pongas en deps).
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'tecnico-1' } }) }));

const campo = maquinasApi.campo as jest.Mock;
const CLAVE = 'flota-campo:v1';

const obraNorte = { proyectoId: 'p1', nombre: 'Obra Cribas Norte', ubicacion: 'Km 12', lat: 20.6, lng: -105.2 };

function maquina(parcial: Partial<MaquinaCampoDTO>): MaquinaCampoDTO {
  return {
    id: 'm',
    codigo: 'M001',
    nombre: 'Criba 1',
    tipo: 'Criba',
    estado: 'operando',
    obraHoy: obraNorte,
    encargado: { nombre: 'Luis Pérez', rol: 'Operador' },
    posicion: { lat: 20.6512, lng: -105.2234, fechaHora: new Date().toISOString(), sinSenal: false },
    ...parcial,
  };
}

/** Flota de "hoy" (la fecha se calcula al correr la prueba: no depende del día). */
function flota(fecha = fechaHoyEnZona()): FlotaCampoDTO {
  return {
    fecha,
    truncado: false,
    maquinas: [
      maquina({ id: 'a' }),
      maquina({
        id: 'b', nombre: 'Camión 07', codigo: 'M003', tipo: 'Transporte', estado: 'en_taller', obraHoy: null,
        encargado: { nombre: 'Pedro Ruiz', rol: 'Chofer' }, posicion: null,
      }),
      maquina({ id: 'c', nombre: 'Cargador 3', codigo: 'M002', tipo: 'Cargador', estado: 'detenida', encargado: null }),
    ],
  };
}

const ok = <T,>(data: T) => ({ success: true, data });
const sinRed = () => new Error('No se pudo conectar con el servidor.');
const apiDown = () => ({ success: false, error: { code: 'API_DOWN', message: 'sin red' } });
const tarjeta = (nombre: string) => within(screen.getByText(nombre).closest('article') as HTMLElement);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('Flota y obras (PWA)', () => {
  it('muestra el esqueleto mientras carga', () => {
    campo.mockReturnValue(new Promise(() => {}));
    const { container } = render(<FlotaObrasMovilPage />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('pinta cada máquina con su estado, obra de hoy, encargado y la liga al mapa', async () => {
    campo.mockResolvedValue(ok(flota()));
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByText('Criba 1')).toBeInTheDocument();
    expect(tarjeta('Criba 1').getByText('Operando')).toBeInTheDocument();
    // Dentro de la tarjeta: la pestaña "En taller" también lleva ese texto.
    expect(tarjeta('Camión 07').getByText('En taller')).toBeInTheDocument();
    expect(tarjeta('Cargador 3').getByText('Detenida')).toBeInTheDocument();
    expect(tarjeta('Camión 07').getByText('Chofer:')).toBeInTheDocument();
    expect(screen.getByText('Sin obra asignada hoy')).toBeInTheDocument();
    expect(screen.getByText('Sin operador asignado')).toBeInTheDocument();
    expect(screen.getByText('Sin datos de GPS')).toBeInTheDocument();
    expect(screen.getByText(/Obras de hoy ·/)).toBeInTheDocument();

    const enlace = screen.getByRole('link', { name: 'Ver ubicación exacta de Criba 1' });
    expect(enlace).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=20.6512,-105.2234');
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('con el ping viejo dice "Ver última ubicación", no "exacta"', async () => {
    const vieja = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    campo.mockResolvedValue(ok({ ...flota(), maquinas: [maquina({ posicion: { lat: 1, lng: 2, fechaHora: vieja, sinSenal: false } })] }));
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByRole('link', { name: 'Ver última ubicación de Criba 1' })).toBeInTheDocument();
    expect(screen.getByText(/Sin señal GPS · último dato hace 3 h/)).toBeInTheDocument();
  });

  it('pestañas: Obras agrupa por obra de hoy y En taller filtra', async () => {
    campo.mockResolvedValue(ok(flota()));
    render(<FlotaObrasMovilPage />);
    await screen.findByText('Criba 1');

    fireEvent.click(screen.getByRole('button', { name: /Obras\s*1/ }));
    expect(screen.getByText('Obra Cribas Norte')).toBeInTheDocument();
    expect(screen.getByText('Km 12 · 2 máquinas hoy')).toBeInTheDocument();
    expect(screen.queryByText('Camión 07')).not.toBeInTheDocument(); // sin obra hoy

    fireEvent.click(screen.getByRole('button', { name: /En taller\s*1/ }));
    expect(screen.getByText('Camión 07')).toBeInTheDocument();
    expect(screen.queryByText('Criba 1')).not.toBeInTheDocument();
  });

  it('con búsqueda, la obra dice su total real y cuántas coinciden', async () => {
    campo.mockResolvedValue(ok(flota()));
    render(<FlotaObrasMovilPage />);
    await screen.findByText('Criba 1');

    fireEvent.change(screen.getByLabelText('Máquina, obra o encargado'), { target: { value: 'cargador' } });
    fireEvent.click(screen.getByRole('button', { name: /Obras\s*1/ }));
    expect(screen.getByText('Km 12 · 2 máquinas hoy · 1 coinciden')).toBeInTheDocument();
  });

  it('busca por máquina, obra o encargado sin importar acentos', async () => {
    campo.mockResolvedValue(ok(flota()));
    render(<FlotaObrasMovilPage />);
    await screen.findByText('Criba 1');

    fireEvent.change(screen.getByLabelText('Máquina, obra o encargado'), { target: { value: 'pedro' } });
    expect(screen.getByText('Camión 07')).toBeInTheDocument();
    expect(screen.queryByText('Criba 1')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Máquina, obra o encargado'), { target: { value: 'zzz' } });
    expect(screen.getByText('Ninguna máquina coincide con la búsqueda.')).toBeInTheDocument();
  });

  it('sin red y sin copia guardada: error con Reintentar, y al reintentar aparecen los datos', async () => {
    campo.mockRejectedValueOnce(sinRed()).mockResolvedValueOnce(ok(flota()));
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByText(MENSAJE_SIN_CONEXION)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('Criba 1')).toBeInTheDocument();
  });

  it('sin red con copia guardada: muestra la copia con el aviso de datos guardados', async () => {
    guardarDatos('tecnico-1', CLAVE, flota());
    campo.mockRejectedValue(sinRed());
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByText('Criba 1')).toBeInTheDocument();
    expect(screen.getByText(/Sin conexión — mostrando los datos guardados/)).toBeInTheDocument();
  });

  it('API_DOWN (refresh sin red, respuesta y no excepción) también sirve la copia', async () => {
    guardarDatos('tecnico-1', CLAVE, flota());
    campo.mockResolvedValue(apiDown());
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByText('Criba 1')).toBeInTheDocument();
    expect(screen.getByText(/Sin conexión — mostrando los datos guardados/)).toBeInTheDocument();
  });

  it('una copia de otro día lo dice y no habla de "hoy"', async () => {
    guardarDatos('tecnico-1', CLAVE, flota('2026-01-10'));
    campo.mockRejectedValue(sinRed());
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/no de hoy/);
    expect(screen.getByText(/Asignaciones del/)).toBeInTheDocument();
    expect(screen.queryByText(/Obras de hoy/)).not.toBeInTheDocument();
    expect(screen.getByText('Sin obra asignada ese día')).toBeInTheDocument();
  });

  it('una copia corrupta o de otra versión se ignora: error con Reintentar, no pantalla en blanco', async () => {
    guardarDatos('tecnico-1', CLAVE, { items: [{ nombre: 'algo viejo' }] });
    campo.mockRejectedValue(sinRed());
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByText(MENSAJE_SIN_CONEXION)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
  });

  it('un 403 se dice tal cual aunque haya copia guardada (no se tapa con datos viejos)', async () => {
    guardarDatos('tecnico-1', CLAVE, flota());
    campo.mockResolvedValue({ success: false, error: { code: 'FORBIDDEN', message: 'No tienes permiso para maquinaria.flota_campo.ver' } });
    render(<FlotaObrasMovilPage />);

    expect(await screen.findByText('No se pudo cargar la flota')).toBeInTheDocument();
    expect(screen.queryByText('Criba 1')).not.toBeInTheDocument();
  });

  it('si falla Actualizar con datos en pantalla, se conservan y se avisa', async () => {
    campo.mockResolvedValueOnce(ok(flota())).mockResolvedValueOnce({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Error interno' },
    });
    render(<FlotaObrasMovilPage />);
    await screen.findByText('Criba 1');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Actualizar/ }));
    });
    expect(await screen.findByText(/No se pudo actualizar:/)).toBeInTheDocument();
    expect(screen.getByText('Criba 1')).toBeInTheDocument();
  });

  it('con datos frescos guarda la copia para usarla sin señal', async () => {
    campo.mockResolvedValue(ok(flota()));
    render(<FlotaObrasMovilPage />);
    await screen.findByText('Criba 1');
    const guardado = JSON.parse(localStorage.getItem(`svr-pwa-datos:tecnico-1:${CLAVE}`) ?? 'null');
    expect(guardado?.datos.maquinas).toHaveLength(3);
  });

  it('flota vacía: mensaje claro y su botón Actualizar', async () => {
    campo.mockResolvedValue(ok({ fecha: fechaHoyEnZona(), truncado: false, maquinas: [] }));
    render(<FlotaObrasMovilPage />);
    expect(await screen.findByText('No hay máquinas activas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actualizar/ })).toBeInTheDocument();
  });

  it('al volver la señal recarga sola', async () => {
    campo.mockResolvedValue(ok(flota()));
    render(<FlotaObrasMovilPage />);
    await screen.findByText('Criba 1');
    expect(campo).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(campo).toHaveBeenCalledTimes(2);
  });
});
