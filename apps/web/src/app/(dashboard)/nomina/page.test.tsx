/**
 * Exportar SPEI (Nómina): el archivo para el banco solo lleva lo que falta transferir. Antes incluía las nóminas
 * ya marcadas como pagadas, y al exportar después de pagar a algunos se les volvía a transferir.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NominaPage from './page';
import { nominaApi, type NominaRowDTO } from '@/lib/api';

const showToast = jest.fn();

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  nominaApi: { actual: jest.fn() },
}));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { vistas: [{ ruta: '/nomina', puedeVer: true, puedeCrear: true, puedeEditar: true, puedeExportar: true }] },
  }),
}));
jest.mock('@/components/layout/Toast', () => ({ useToast: () => ({ showToast }) }));
jest.mock('@/components/layout/NotificationContext', () => ({ useNotifications: () => ({ addNotification: jest.fn() }) }));
jest.mock('@/components/layout/RecibosNominaModal', () => ({ __esModule: true, default: () => null }));

const actual = nominaApi.actual as jest.Mock;

function fila(nombre: string, estado: NominaRowDTO['estado'], sueldoFiscal: number): NominaRowDTO {
  return {
    id: `n-${nombre}`, trabajadorId: `t-${nombre}`, trabajadorNombre: nombre, puesto: 'Operador', categoriaPuesto: 'Operador',
    avatar: nombre.slice(0, 2), metodoPago: 'Mixto', sueldoFiscal, sueldoEfectivo: 1000, diasTrabajados: 6, diasFaltas: 0,
    horasOrdinarias: 48, horasExtra: 0, totalPercepciones: 0, totalDeducciones: 0, totalNeto: sueldoFiscal + 1000, estado,
    percepciones: [], deducciones: [],
  };
}

const PERIODO = { id: 'p-1', codigo: 'S47-2026', nombre: 'Semana 47', fechaInicio: '2026-11-16', fechaFin: '2026-11-21', estado: 'ABIERTO' };

// El CSV se lee del Blob que arma la página (jsdom no descarga archivos).
let csv = '';
const BlobReal = global.Blob;
beforeAll(() => {
  global.Blob = class extends BlobReal {
    constructor(partes: BlobPart[], opciones?: BlobPropertyBag) {
      super(partes, opciones);
      csv = partes.map(String).join('');
    }
  } as typeof Blob;
  global.URL.createObjectURL = jest.fn(() => 'blob:prueba');
  global.URL.revokeObjectURL = jest.fn();
  // El clic de descarga navegaría (jsdom no lo implementa).
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterAll(() => {
  global.Blob = BlobReal;
});
beforeEach(() => {
  jest.clearAllMocks();
  csv = '';
});

async function exportar(items: NominaRowDTO[]) {
  actual.mockResolvedValue({ success: true, data: { periodo: PERIODO, items } });
  render(<NominaPage />);
  const boton = await screen.findByRole('button', { name: 'Exportar SPEI' });
  await waitFor(() => expect(boton).toBeEnabled());
  fireEvent.click(boton);
}

describe('Nómina · Exportar SPEI', () => {
  it('no incluye las nóminas ya pagadas (se transferirían dos veces) y lo avisa', async () => {
    await exportar([fila('Ana Ruiz', 'Pagado', 2500), fila('Beto Sosa', 'Pendiente', 3000), fila('Carla Paz', 'Pendiente', 0)]);
    await waitFor(() => expect(csv).not.toBe(''));
    expect(csv).toContain('Beto Sosa');
    expect(csv).not.toContain('Ana Ruiz');
    expect(csv).not.toContain('Carla Paz'); // sin sueldo por transferencia
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('1 ya pagada(s) no se incluyeron'), 'warning');
  });

  it('si todo lo de transferencia ya está pagado, no genera archivo', async () => {
    await exportar([fila('Ana Ruiz', 'Pagado', 2500), fila('Beto Sosa', 'Pagado', 3000)]);
    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(csv).toBe('');
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('ya están pagadas'), 'info');
  });

  it('sin pagadas: exporta a todos los que tienen sueldo por transferencia', async () => {
    await exportar([fila('Ana Ruiz', 'Pendiente', 2500), fila('Beto Sosa', 'Pendiente', 3000)]);
    await waitFor(() => expect(csv).not.toBe(''));
    expect(csv).toContain('Ana Ruiz');
    expect(csv).toContain('Beto Sosa');
    expect(csv).toContain('2500.00');
    expect(showToast).toHaveBeenCalledWith(expect.not.stringContaining('ya pagada'), 'warning');
  });
});
