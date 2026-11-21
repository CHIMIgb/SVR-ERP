/**
 * Bloqueante 1 de PR #23: un adjunto que falla (403/413/422 o sin señal)
 * NO debe borrar el item de la cola — las fotos son la evidencia del
 * reporte. Se mockea `./offline` (IndexedDB) y `@/lib/api` (apiClient no
 * lanza ante error HTTP; solo ante error de red).
 */
import { sincronizarAhora, type PuertoEnvio } from './sincronizador';
import {
  pendientes,
  marcarEnviada,
  guardarAdjuntosPendientes,
  type ElementoCola,
} from './offline';
import { reportesCampoApi } from '@/lib/api';

jest.mock('./offline', () => ({
  pendientes: jest.fn(),
  marcarEnviada: jest.fn(),
  marcarError: jest.fn(),
  marcarConflicto: jest.fn(),
  guardarAdjuntosPendientes: jest.fn(),
  contarPendientes: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  reportesCampoApi: { adjuntar: jest.fn() },
}));

const mockedPendientes = pendientes as jest.Mock;
const mockedAdjuntar = reportesCampoApi.adjuntar as jest.Mock;

function itemConFotos(overrides: Partial<ElementoCola> = {}): ElementoCola {
  return {
    id: 'item-1',
    endpoint: '/reportes-campo',
    payload: { descripcion: 'Falla en bomba' },
    creado_en: '2026-11-20T10:00:00.000Z',
    intentos: 0,
    estado: 'pendiente',
    adjuntos: [
      { nombre: 'a.webp', mime: 'image/webp', tamano: 10, datos: 'AAA' },
      { nombre: 'b.webp', mime: 'image/webp', tamano: 10, datos: 'BBB' },
    ],
    ...overrides,
  };
}

/** Puerto que responde como apiClient: el alta siempre con ACK + id. */
const puertoOk: PuertoEnvio = async () => ({ ok: true, data: { id: 'reporte-1' } });

beforeEach(() => {
  jest.clearAllMocks();
  mockedAdjuntar.mockResolvedValue({ success: true });
});

describe('sincronizarAhora — adjuntos del alta (bloqueante 1 PR #23)', () => {
  it('un adjunto que falla (success:false) NO elimina el item: queda con las fotos faltantes', async () => {
    // arrange
    const item = itemConFotos();
    mockedPendientes.mockResolvedValue([item]);
    mockedAdjuntar
      .mockResolvedValueOnce({ success: true }) // a.webp sube
      .mockResolvedValueOnce({ success: false, error: { code: 'PAYLOAD_TOO_LARGE' } }); // b.webp NO

    // act
    await sincronizarAhora(puertoOk);

    // assert
    expect(marcarEnviada).not.toHaveBeenCalled();
    expect(guardarAdjuntosPendientes).toHaveBeenCalledWith('item-1', [1]);
  });

  it('error de red en un adjunto (throw) NO elimina el item y conserva lo ya subido', async () => {
    // arrange
    const item = itemConFotos();
    mockedPendientes.mockResolvedValue([item]);
    mockedAdjuntar
      .mockResolvedValueOnce({ success: true }) // a.webp sube antes de caer la señal
      .mockRejectedValueOnce(new Error('Error de conexión con el servidor')); // red cae

    // act
    await sincronizarAhora(puertoOk);

    // assert
    expect(marcarEnviada).not.toHaveBeenCalled();
    expect(guardarAdjuntosPendientes).toHaveBeenCalledWith('item-1', [1]);
  });

  it('cuando TODAS las fotos suben, el item se elimina (marcarEnviada)', async () => {
    // arrange
    mockedPendientes.mockResolvedValue([itemConFotos()]);

    // act
    await sincronizarAhora(puertoOk);

    // assert
    expect(guardarAdjuntosPendientes).not.toHaveBeenCalled();
    expect(marcarEnviada).toHaveBeenCalledWith('item-1');
  });

  it('el reenvío solo intenta las fotos FALTANTES (no duplica las ya subidas)', async () => {
    // arrange: la pasada anterior ya subió a.webp (índice 0)
    const item = itemConFotos({ adjuntosPendientes: [1] });
    mockedPendientes.mockResolvedValue([item]);

    // act
    await sincronizarAhora(puertoOk);

    // assert: una sola llamada, con los datos de b.webp (índice 1)
    expect(mockedAdjuntar).toHaveBeenCalledTimes(1);
    expect(mockedAdjuntar.mock.calls[0][1]).toMatchObject({ nombre: 'b.webp', datos: 'BBB' });
    expect(marcarEnviada).toHaveBeenCalledWith('item-1');
  });
});


