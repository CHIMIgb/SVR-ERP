/**
 * Asistencia del equipo (PWA, Residente) en sus estados, incluido sin red: el apiClient LANZA cuando fetch
 * falla (API caída / sin señal); la pantalla debe mostrar el error con Reintentar, no quedarse cargando.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { EquipoAsistencia } from './EquipoAsistencia';
import { asistenciaApi, type DiaAsistenciaSemanaDTO, type EquipoAsistenciaDTO, type MiembroAsistenciaEquipoDTO } from '@/lib/api';
import { MENSAJE_SIN_CONEXION } from '@/lib/pwa/asistencia-propia';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  asistenciaApi: { equipo: jest.fn() },
}));

const equipo = asistenciaApi.equipo as jest.Mock;

function miembro(
  nombre: string,
  dia: Partial<DiaAsistenciaSemanaDTO> | null,
  parcial: Partial<MiembroAsistenciaEquipoDTO> = {},
): MiembroAsistenciaEquipoDTO {
  return {
    trabajadorId: `t-${nombre}`,
    nombre,
    puesto: 'Albañil',
    telefono: '5512345678',
    estadoTrabajador: 'ACTIVO',
    dia: dia && { dia: 'Sab', fecha: '2026-11-21', estado: 'Puntual', horasTrabajadas: 0, enSitioGps: true, ...dia },
    ...parcial,
  };
}

function datos(miembros: MiembroAsistenciaEquipoDTO[]): EquipoAsistenciaDTO {
  return {
    fecha: '2026-11-21',
    totales: { miembros: miembros.length, presentes: 0, retardos: 0, faltas: 0, omisiones: 0, pendientes: 0 },
    miembros,
  };
}

const EQUIPO = [
  miembro('Ana Ruiz', { estado: 'Puntual', horaEntrada: '07:55' }),
  miembro('Beto Sosa', { estado: 'Omisión', horaEntrada: '08:40' }),
  miembro('Carlos Díaz', { estado: 'Falta' }),
  miembro('Dora Luna', { estado: 'Falta', horaEntrada: '09:10' }),
  miembro('Eva Mora', { estado: 'Omisión' }),
];

const ok = <T,>(data: T) => ({ success: true, data });

beforeEach(() => jest.clearAllMocks());

describe('EquipoAsistencia', () => {
  it('muestra el esqueleto mientras carga', () => {
    equipo.mockReturnValue(new Promise(() => {}));
    const { container } = render(<EquipoAsistencia />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('clasifica al equipo: omisión o falta con entrada = llegó tarde; sin entrada = falta llegar', async () => {
    equipo.mockResolvedValue(ok(datos(EQUIPO)));
    render(<EquipoAsistencia />);
    expect(await screen.findByText('Presente 07:55 a.m.')).toBeInTheDocument();
    expect(screen.getByText('Tarde 08:40 a.m.')).toBeInTheDocument();
    expect(screen.getByText('No asistió')).toBeInTheDocument();
    expect(screen.getByText('Tarde 09:10 a.m. · sin justificar')).toBeInTheDocument();
    expect(screen.getByText('Sin checar')).toBeInTheDocument();
    // Llegaron 3 de 5 (Ana, Beto y Dora); faltan Carlos y Eva.
    expect(screen.getByText('de 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Presentes\s*3/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Faltan\s*2/ })).toBeInTheDocument();
  });

  it('el filtro Faltan deja solo a quien no ha llegado', async () => {
    equipo.mockResolvedValue(ok(datos(EQUIPO)));
    render(<EquipoAsistencia />);
    fireEvent.click(await screen.findByRole('button', { name: /Faltan\s*2/ }));
    expect(screen.getByText('Carlos Díaz')).toBeInTheDocument();
    expect(screen.getByText('Eva Mora')).toBeInTheDocument();
    expect(screen.queryByText('Ana Ruiz')).not.toBeInTheDocument();
    expect(screen.queryByText('Dora Luna')).not.toBeInTheDocument();
  });

  it('sin trabajadores a su cargo', async () => {
    equipo.mockResolvedValue(ok(datos([])));
    render(<EquipoAsistencia />);
    expect(await screen.findByText('Aún no tienes trabajadores a tu cargo')).toBeInTheDocument();
  });

  it('error de la API con Reintentar', async () => {
    equipo.mockResolvedValue({ success: false, error: { code: 'FORBIDDEN', message: 'No tienes permiso' } });
    render(<EquipoAsistencia />);
    expect(await screen.findByText('No tienes permiso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
  });

  it('sin red: error con Reintentar (no se queda cargando) y se recupera', async () => {
    equipo.mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.')).mockResolvedValueOnce(ok(datos(EQUIPO)));
    render(<EquipoAsistencia />);
    expect(await screen.findByText(MENSAJE_SIN_CONEXION)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
  });
});
