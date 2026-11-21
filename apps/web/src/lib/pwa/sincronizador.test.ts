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
  marcarError,
  marcarConflicto,
  marcarRechazada,
  guardarAdjuntosPendientes,
  type ElementoCola,
} from './offline';
import { apiClient, reportesCampoApi } from '@/lib/api';

jest.mock('./offline', () => ({
  pendientes: jest.fn(),
  marcarEnviada: jest.fn(),
  marcarError: jest.fn(),
  marcarConflicto: jest.fn(),
  marcarRechazada: jest.fn(),
  guardarAdjuntosPendientes: jest.fn(),
  contarPendientes: jest.fn(),
}));

const mockedPost = apiClient.post as jest.Mock;

jest.mock('@/lib/api', () => ({
  apiClient: { post: jest.fn() },
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

describe('sincronizarAhora — clasificación de códigos (I-1 revisión PR #23)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('401 UNAUTHORIZED NO es rechazo terminal: queda en `error` reintentable', async () => {
    // arrange: la sesión venció — el reporte es válido y debe reenviarse
    mockedPost.mockResolvedValue({ success: false, error: { code: 'UNAUTHORIZED' } });
    mockedPendientes.mockResolvedValue([itemConFotos({ adjuntos: undefined })]);

    // act
    await sincronizarAhora();

    // assert
    expect(marcarError).toHaveBeenCalledWith('item-1');
    expect(marcarRechazada).not.toHaveBeenCalled();
  });

  it('429 TOO_MANY_REQUESTS NO es rechazo terminal (el throttler es temporal)', async () => {
    // arrange
    mockedPost.mockResolvedValue({ success: false, error: { code: 'TOO_MANY_REQUESTS' } });
    mockedPendientes.mockResolvedValue([itemConFotos({ adjuntos: undefined })]);

    // act
    await sincronizarAhora();

    // assert
    expect(marcarError).toHaveBeenCalledWith('item-1');
    expect(marcarRechazada).not.toHaveBeenCalled();
  });

  it('422 UNPROCESSABLE_ENTITY sí es rechazo terminal (datos inválidos)', async () => {
    // arrange
    mockedPost.mockResolvedValue({ success: false, error: { code: 'UNPROCESSABLE_ENTITY' } });
    mockedPendientes.mockResolvedValue([itemConFotos({ adjuntos: undefined })]);

    // act
    await sincronizarAhora();

    // assert
    expect(marcarRechazada).toHaveBeenCalledWith('item-1');
    expect(marcarError).not.toHaveBeenCalled();
  });
});

describe('sincronizarAhora — ids devueltos y rechazo terminal (bloqueante 5 PR #23)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve los IDS enviados, no un conteo global de la cola', async () => {
    // arrange: dos items — el primero envía, el segundo queda pendiente (red)
    mockedPendientes.mockResolvedValue([
      itemConFotos({ id: 'item-ok' }),
      itemConFotos({ id: 'item-sin-senal', adjuntos: undefined }),
    ]);

    // act
    const ids = await sincronizarAhora((item) =>
      item.id === 'item-ok'
        ? Promise.resolve({ ok: true, data: { id: 'reporte-1' } })
        : Promise.reject(new Error('Error de conexión con el servidor')),
    );

    // assert
    expect(ids).toEqual(['item-ok']);
  });

  it('un 4xx de validación (≠409) marca RECHAZADO (terminal) y NO se reenvía en la siguiente pasada', async () => {
    // arrange: primera pasada con respuesta de validación
    const item = itemConFotos({ adjuntos: undefined });
    mockedPendientes.mockResolvedValue([item]);

    // act: el server responde 422 UNPROCESSABLE_ENTITY
    await sincronizarAhora(() =>
      Promise.resolve({ ok: false, rechazo: true, conflicto: false }),
    );

    // assert: estado terminal, sin reintento
    expect(marcarRechazada).toHaveBeenCalledWith('item-1');
    expect(marcarError).not.toHaveBeenCalled();
    expect(marcarEnviada).not.toHaveBeenCalled();

    // y en la siguiente pasada NO se vuelve a intentar
    mockedPendientes.mockResolvedValue([
      itemConFotos({ adjuntos: undefined, estado: 'rechazado' }),
    ]);
    const puertoQueNoDebeLlamarse = jest.fn();
    await sincronizarAhora(puertoQueNoDebeLlamarse);
    expect(puertoQueNoDebeLlamarse).not.toHaveBeenCalled();
  });

  it('un 5xx sigue siendo RETRABLE (marcarError, no rechazado)', async () => {
    // arrange
    mockedPendientes.mockResolvedValue([itemConFotos({ adjuntos: undefined })]);

    // act: error interno del server
    await sincronizarAhora(() => Promise.resolve({ ok: false, rechazo: false, conflicto: false }));

    // assert
    expect(marcarError).toHaveBeenCalledWith('item-1');
    expect(marcarRechazada).not.toHaveBeenCalled();
  });

  it('un 409 sigue yendo a CONFLICTO (no lo toca el rechazo terminal)', async () => {
    // arrange
    mockedPendientes.mockResolvedValue([itemConFotos({ adjuntos: undefined })]);

    // act
    await sincronizarAhora(() => Promise.resolve({ ok: false, conflicto: true }));

    // assert
    expect(marcarConflicto).toHaveBeenCalledWith('item-1');
    expect(marcarRechazada).not.toHaveBeenCalled();
    expect(marcarError).not.toHaveBeenCalled();
  });
});


