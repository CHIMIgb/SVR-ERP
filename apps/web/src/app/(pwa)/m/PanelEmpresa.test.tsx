/**
 * Panel de empresa del Inicio móvil (Administrador). Cada fuente carga por separado: si una falla por red
 * (el apiClient LANZA cuando fetch falla), solo esa tarjeta muestra el error con Reintentar y las demás se
 * ven; nada se queda cargando para siempre.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import type { UserAuth } from '@svr-erp/shared';
import { PanelEmpresa } from './PanelEmpresa';
import { asistenciaApi, cobranzaApi, maquinasApi, reportesCampoApi } from '@/lib/api';
import { MENSAJE_SIN_CONEXION } from '@/lib/pwa/asistencia-propia';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  asistenciaApi: { semanal: jest.fn() },
  maquinasApi: { listar: jest.fn() },
  cobranzaApi: { stats: jest.fn() },
  reportesCampoApi: { stats: jest.fn() },
}));

const semanal = asistenciaApi.semanal as jest.Mock;
const listarMaquinas = maquinasApi.listar as jest.Mock;
const statsCobranza = cobranzaApi.stats as jest.Mock;
const statsReportes = reportesCampoApi.stats as jest.Mock;

const vista = (ruta: string) => ({ ruta, puedeVer: true });
const ADMIN = {
  id: 'u-1',
  vistas: [vista('/asistencia'), vista('/maquinaria'), vista('/cobranza'), vista('/reportes')],
} as unknown as UserAuth;

const ok = <T,>(data: T) => ({ success: true, data });
const sinRed = () => new Error('No se pudo conectar con el servidor.');

beforeEach(() => {
  jest.clearAllMocks();
  listarMaquinas.mockResolvedValue(ok([{ estado: 'Encendida' }, { estado: 'Mantenimiento' }]));
  statsCobranza.mockResolvedValue(ok({ totalPorCobrar: 340_000, vencido: 0, cobradoMes: 1_200_000, clientesConSaldo: 4 }));
  statsReportes.mockResolvedValue(ok({ nuevos: 0, enCurso: 0, cerrados: 0, criticosActivos: 0, porArea: {} }));
});

describe('PanelEmpresa', () => {
  it('una fuente sin red muestra su error con Reintentar; las demás se ven', async () => {
    semanal.mockRejectedValueOnce(sinRed()).mockResolvedValueOnce(ok([]));
    render(<PanelEmpresa user={ADMIN} rutas={new Set()} />);

    // En la tarjeta (que dice de qué métrica es) y como causa de las alertas.
    expect(await screen.findAllByText(MENSAJE_SIN_CONEXION)).toHaveLength(2);
    expect(screen.getByText('Personal activo')).toBeInTheDocument();
    expect(await screen.findByText('Flota operando')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('$340K')).toBeInTheDocument();
    expect(screen.getByText('$1.2M')).toBeInTheDocument();

    // El primero es el de la tarjeta; el segundo, el de las alertas (la asistencia también da alertas).
    expect(screen.getByText(/No se pudieron revisar las alertas de asistencia/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Reintentar/ })[0]);
    expect(await screen.findByText('0 con asistencia hoy')).toBeInTheDocument();
    expect(screen.queryByText(/No se pudieron revisar/)).not.toBeInTheDocument();
    expect(screen.queryByText(MENSAJE_SIN_CONEXION)).not.toBeInTheDocument();
  });

  it('todas las fuentes sin red: cada tarjeta con su Reintentar, sin quedarse cargando', async () => {
    semanal.mockRejectedValue(sinRed());
    listarMaquinas.mockRejectedValue(sinRed());
    statsCobranza.mockRejectedValue(sinRed());
    statsReportes.mockRejectedValue(sinRed());
    render(<PanelEmpresa user={ADMIN} rutas={new Set()} />);

    // Asistencia, flota, las dos de cobranza y el de las alertas.
    expect(await screen.findAllByRole('button', { name: /Reintentar/ })).toHaveLength(5);
    // Sin poder revisarlas no se puede decir que no hay alertas.
    expect(screen.queryByText(/Sin alertas/)).not.toBeInTheDocument();
    expect(screen.getByText(/No se pudieron revisar las alertas de reportes, asistencia y cobranza/)).toBeInTheDocument();
  });

  it('alertas: muestra la causa del error (un 403 no es falta de señal)', async () => {
    semanal.mockResolvedValue(ok([]));
    statsReportes.mockResolvedValue({ success: false, error: { code: 'FORBIDDEN', message: 'No tienes permiso para ver reportes' } });
    render(<PanelEmpresa user={ADMIN} rutas={new Set()} />);
    expect(await screen.findByText(/No se pudieron revisar las alertas de reportes\./)).toBeInTheDocument();
    expect(screen.getByText('No tienes permiso para ver reportes')).toBeInTheDocument();
  });

  it('alertas: reintenta solo las fuentes que fallaron', async () => {
    semanal.mockResolvedValue(ok([]));
    statsReportes
      .mockRejectedValueOnce(sinRed())
      .mockResolvedValueOnce(ok({ nuevos: 2, enCurso: 0, cerrados: 0, criticosActivos: 0, porArea: {} }));
    render(<PanelEmpresa user={ADMIN} rutas={new Set()} />);

    expect(await screen.findByText(/No se pudieron revisar las alertas de reportes/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('2 reporte(s) sin atender')).toBeInTheDocument();
    expect(statsCobranza).toHaveBeenCalledTimes(1);
  });

  it('sin errores ni alertas: "Sin alertas por ahora"', async () => {
    semanal.mockResolvedValue(ok([]));
    render(<PanelEmpresa user={ADMIN} rutas={new Set()} />);
    expect(await screen.findByText('Sin alertas por ahora.')).toBeInTheDocument();
  });
});
