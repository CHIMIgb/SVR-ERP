/**
 * La cola solo debe considerar "guardada" una captura cuando IndexedDB
 * COMETE la transacción: `req.onsuccess` llega antes y un reload inmediato
 * (HMR de Turbopack en dev) puede perder el registro recién encolado.
 */
import { encolar } from './offline';

class RequestFake {
  onsuccess: (() => void) | null = null;
  result: unknown;

  constructor(result?: unknown) {
    this.result = result;
  }

  exito(): void {
    this.onsuccess?.();
  }
}

type TxFake = {
  objectStore: jest.Mock;
  oncomplete: (() => void) | null;
};

describe('encolar — commit de IndexedDB', () => {
  let reqAlta: RequestFake;
  let tx: TxFake;

  beforeEach(() => {
    reqAlta = new RequestFake();
    tx = {
      objectStore: jest.fn(() => ({
        add: jest.fn(() => reqAlta),
      })),
      oncomplete: null,
    };
    const db = { transaction: jest.fn(() => tx) };
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: {
        open: () => {
          const req = new RequestFake(db);
          queueMicrotask(() => req.exito());
          return req;
        },
      },
    });
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID: () => 'uuid-de-prueba' },
    });
  });

  it('no resuelve con el onsuccess de la request: espera a tx.oncomplete', async () => {
    // arrange
    let terminado = false;
    const promesa = encolar('/reportes-campo', { descripcion: 'Falla en bomba' });
    void promesa.then(() => {
      terminado = true;
    });

    // act: abre la BD y el add() recibe su onsuccess, pero aún no hay commit
    await new Promise((resolve) => setTimeout(resolve, 0));
    reqAlta.exito();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // assert
    expect(terminado).toBe(false);

    // act: se comete la transacción
    tx.oncomplete?.();
    await promesa;

    // assert
    expect(terminado).toBe(true);
  });
});
