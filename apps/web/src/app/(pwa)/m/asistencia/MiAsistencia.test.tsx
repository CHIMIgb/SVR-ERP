/**
 * Mi asistencia (PWA) en sus estados. Incluye el caso sin red que chimi corrigió en el Inicio (aae4842):
 * el apiClient LANZA cuando fetch falla (API caída / sin señal), no devuelve success:false. La pantalla debe
 * mostrar el error con Reintentar y el botón de checar no puede quedarse trabado.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MiAsistencia } from './MiAsistencia';
import { asistenciaApi, type MiAsistenciaDTO, type RegistroAsistenciaDTO } from '@/lib/api';
import { MENSAJE_SIN_CONEXION, obtenerUbicacion } from '@/lib/pwa/asistencia-propia';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  asistenciaApi: { mia: jest.fn(), marcarEntradaPropia: jest.fn(), marcarSalidaPropia: jest.fn() },
}));

jest.mock('@/lib/pwa/asistencia-propia', () => ({
  ...jest.requireActual('@/lib/pwa/asistencia-propia'),
  obtenerUbicacion: jest.fn(),
}));

const mia = asistenciaApi.mia as jest.Mock;
const marcarEntrada = asistenciaApi.marcarEntradaPropia as jest.Mock;
const ubicacion = obtenerUbicacion as jest.Mock;

const OBRA = { id: 'obra-1', nombre: 'Torre Norte', tieneUbicacion: true, geocerca: { lat: 19.4, lng: -99.1, radioMetros: 200 } };

function datos(parcial: Partial<MiAsistenciaDTO> = {}): MiAsistenciaDTO {
  return {
    trabajador: { id: 't-1', nombre: 'Juan Pérez', puesto: 'Albañil', estado: 'ACTIVO', entradaProgramada: '08:00' },
    obras: [OBRA],
    registroHoy: null,
    turnoNocturnoAbierto: false,
    semana: null,
    ...parcial,
  };
}

function registro(parcial: Partial<RegistroAsistenciaDTO> = {}): RegistroAsistenciaDTO {
  return {
    id: 'r-1',
    trabajadorId: 't-1',
    fecha: '2026-11-21',
    horaEntrada: '08:05',
    estado: 'Puntual',
    sinMarcaje: false,
    ubicacion: '',
    coordenadas: { lat: 19.4, lng: -99.1 },
    obraAsignada: 'Torre Norte',
    obraCoordenadas: { lat: 19.4, lng: -99.1 },
    distanciaMetros: 10,
    radioPermitidoMetros: 200,
    enSitio: true,
    precisionGpsMetros: 8,
    dispositivo: 'PWA móvil',
    ...parcial,
  };
}

const ok = <T,>(data: T) => ({ success: true, data });
const falla = (code: string, message: string, details?: unknown[]) => ({ success: false, error: { code, message, details } });
const sinRed = () => new Error('No se pudo conectar con el servidor.');

beforeEach(() => {
  jest.clearAllMocks();
  ubicacion.mockResolvedValue({ lat: 19.4, lng: -99.1, precisionGpsMetros: 8 });
});

const botonEntrada = () => screen.findByRole('button', { name: /Registrar entrada/ });

describe('MiAsistencia', () => {
  it('muestra el esqueleto mientras carga', () => {
    mia.mockReturnValue(new Promise(() => {}));
    const { container } = render(<MiAsistencia />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('lista para checar la entrada con la obra y el GPS', async () => {
    mia.mockResolvedValue(ok(datos()));
    render(<MiAsistencia />);
    expect(await botonEntrada()).toBeEnabled();
    expect(screen.getByText('Torre Norte')).toBeInTheDocument();
  });

  it('cuenta sin enlazar a un trabajador', async () => {
    mia.mockResolvedValue(falla('NOT_FOUND', 'SIN_TRABAJADOR_ENLAZADO'));
    render(<MiAsistencia />);
    expect(await screen.findByText('Tu cuenta aún no está enlazada')).toBeInTheDocument();
  });

  it('error de la API: dice qué falló (details[]) y ofrece Reintentar', async () => {
    mia.mockResolvedValue(falla('VALIDATION_ERROR', 'Error de validación', ['fecha inválida']));
    render(<MiAsistencia />);
    expect(await screen.findByText('fecha inválida')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
  });

  it('sin red al cargar: error con Reintentar (no se queda cargando) y se recupera', async () => {
    mia.mockRejectedValueOnce(sinRed()).mockResolvedValueOnce(ok(datos()));
    render(<MiAsistencia />);
    expect(await screen.findByText(MENSAJE_SIN_CONEXION)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await botonEntrada()).toBeEnabled();
  });

  it('sin red al checar: no afirma nada, avisa y libera el botón para volver a intentar', async () => {
    mia.mockResolvedValue(ok(datos()));
    marcarEntrada.mockRejectedValue(sinRed());
    render(<MiAsistencia />);
    fireEvent.click(await botonEntrada());
    expect(await screen.findByRole('status')).toHaveTextContent(`No se pudo confirmar tu registro. ${MENSAJE_SIN_CONEXION}`);
    expect(await botonEntrada()).toBeEnabled();
    expect(mia).toHaveBeenCalledTimes(2); // recargó por si la entrada sí había llegado
  });

  it('sin red al checar pero la entrada sí llegó: recarga y lo dice', async () => {
    mia.mockResolvedValueOnce(ok(datos())).mockResolvedValueOnce(ok(datos({ registroHoy: registro() })));
    marcarEntrada.mockRejectedValue(sinRed());
    render(<MiAsistencia />);
    fireEvent.click(await botonEntrada());
    expect(await screen.findByRole('button', { name: /Registrar salida/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Entrada registrada a las 08:05 a.m.');
  });

  it('si la entrada ya había quedado (la API dice "ya tiene entrada"), recarga y pasa a la salida', async () => {
    mia.mockResolvedValueOnce(ok(datos())).mockResolvedValueOnce(ok(datos({ registroHoy: registro() })));
    marcarEntrada.mockResolvedValue(falla('BAD_REQUEST', 'Este trabajador ya tiene una entrada registrada hoy'));
    render(<MiAsistencia />);
    fireEvent.click(await botonEntrada());
    expect(await screen.findByRole('button', { name: /Registrar salida/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Entrada registrada a las 08:05 a.m.');
    expect(mia).toHaveBeenCalledTimes(2);
  });

  it('rechazo de la API y la recarga falla por red: conserva la pantalla y el motivo del rechazo', async () => {
    mia.mockResolvedValueOnce(ok(datos())).mockRejectedValueOnce(sinRed());
    marcarEntrada.mockResolvedValue(falla('FORBIDDEN', 'No tienes esa obra asignada'));
    render(<MiAsistencia />);
    fireEvent.click(await botonEntrada());
    expect(await screen.findByRole('status')).toHaveTextContent('No tienes esa obra asignada');
    expect(await botonEntrada()).toBeEnabled();
    expect(screen.queryByText('No se pudo cargar tu asistencia')).not.toBeInTheDocument();
  });

  it('entrada registrada y la recarga falla: pasa a la salida con lo que respondió la API', async () => {
    mia.mockResolvedValueOnce(ok(datos())).mockRejectedValueOnce(sinRed());
    marcarEntrada.mockResolvedValue(ok(registro({ horaEntrada: '08:02' })));
    render(<MiAsistencia />);
    fireEvent.click(await botonEntrada());
    expect(await screen.findByRole('button', { name: /Registrar salida/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Entrada registrada a las 08:02 a.m.');
    expect(screen.queryByText('No se pudo cargar tu asistencia')).not.toBeInTheDocument();
  });

  it('jornada cerrada: muestra el resumen y ya no deja checar', async () => {
    mia.mockResolvedValue(ok(datos({ registroHoy: registro({ horaSalida: '17:00', horasTrabajadasOrdinarias: 8 }) })));
    render(<MiAsistencia />);
    expect(await screen.findByText('Tu jornada de hoy')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar/ })).not.toBeInTheDocument();
  });

  it('trabajador de vacaciones no checa', async () => {
    mia.mockResolvedValue(ok(datos({ trabajador: { ...datos().trabajador, estado: 'VACACIONES' } })));
    render(<MiAsistencia />);
    expect(await screen.findByText('Estás de vacaciones')).toBeInTheDocument();
  });
});
