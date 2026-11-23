/**
 * La cola solo debe considerar "guardada" una captura cuando IndexedDB
 * COMETE la transacción: `req.onsuccess` llega antes y un reload inmediato
 * (HMR de Turbopack en dev) puede perder el registro recién encolado.
 * Y la cola es DEL USUARIO (tercera revisión 2026-11-22): el item guarda
 * el usuarioId de la sesión; sin él no se envía solo.
 */
import { encolar, usuarioSesionId } from './offline';
import { STORAGE_KEYS } from '@svr-erp/shared';

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

let reqAlta: RequestFake;
let addSpy: jest.Mock;
let tx: TxFake;

beforeEach(() => {
  reqAlta = new RequestFake();
  addSpy = jest.fn(() => reqAlta);
  tx = {
    objectStore: jest.fn(() => ({
      add: addSpy,
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
  localStorage.removeItem(STORAGE_KEYS.USER);
});

/** Corre el fake hasta que la transacción comete. */
async function cometer(): Promise<void> {
  const promesa = encolar('/reportes-campo', { descripcion: 'Falla en bomba' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  reqAlta.exito();
  await new Promise((resolve) => setTimeout(resolve, 0));
  tx.oncomplete?.();
  await promesa;
}

describe('encolar — commit de IndexedDB', () => {
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

describe('encolar — dueño de la captura (tercera revisión)', () => {
  it('guarda el usuarioId del usuario de la sesión', async () => {
    // arrange
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: 'user-a', nombre: 'A' }));

    // act
    await cometer();

    // assert
    expect(addSpy.mock.calls[0][0]).toMatchObject({ usuarioId: 'user-a' });
  });

  it('sin usuario en sesión, el item no trae usuarioId (no se enviará solo)', async () => {
    // arrange: sin perfil persistido

    // act
    await cometer();

    // assert
    expect(addSpy.mock.calls[0][0].usuarioId).toBeUndefined();
  });
});

describe('usuarioSesionId — dueño de la sesión (tercera revisión)', () => {
  it('lee el id del perfil persistido', () => {
    // arrange
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: 'user-a', nombre: 'A' }));

    // act / assert
    expect(usuarioSesionId()).toBe('user-a');
  });

  it('sin perfil, o con perfil corrupto, devuelve null', () => {
    // arrange
    localStorage.removeItem(STORAGE_KEYS.USER);

    // act / assert
    expect(usuarioSesionId()).toBeNull();

    // arrange: JSON inválido
    localStorage.setItem(STORAGE_KEYS.USER, '{no-json');

    // act / assert
    expect(usuarioSesionId()).toBeNull();
  });
});
