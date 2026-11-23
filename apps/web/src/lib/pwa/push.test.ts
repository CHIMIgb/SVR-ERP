/**
 * Menor 2 de la revisión PR #23: si el alta en el server LANZA por red,
 * `activarPush()` debe resolver con error (no lanzar) y desuscribir la
 * suscripción local — si no, `estadoPush()` diría "activadas" con un
 * backend que nunca la registró (desync de estados).
 */
import { activarPush } from './push';
import { notificacionesApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  notificacionesApi: {
    vapidPublica: jest.fn(),
    suscribirPush: jest.fn(),
    cancelarPush: jest.fn(),
  },
  mensajeErrorApi: jest.fn(() => 'error simulado'),
}));

const mockedVapid = notificacionesApi.vapidPublica as jest.Mock;
const mockedAlta = notificacionesApi.suscribirPush as jest.Mock;

const suscripcionFake = {
  unsubscribe: jest.fn().mockResolvedValue(undefined),
  toJSON: () => ({
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: { p256dh: 'clave', auth: 'auth' },
  }),
} as unknown as PushSubscription;

const registroFake = {
  pushManager: { subscribe: jest.fn().mockResolvedValue(suscripcionFake) },
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission: 'granted' },
  });
  Object.defineProperty(window, 'PushManager', { configurable: true, value: {} });
  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: jest.fn().mockResolvedValue(registroFake) },
  });
  mockedVapid.mockResolvedValue({ success: true, data: { clavePublica: 'BEl4GV7v' } });
});

describe('activarPush — errores de red (menor 2 revisión PR #23)', () => {
  it('si suscribirPush LANZA por red, resuelve con error y desuscribe la suscripción local', async () => {
    // arrange
    mockedAlta.mockRejectedValue(new Error('No se pudo conectar con el servidor'));

    // act
    const r = await activarPush();

    // assert
    expect(r.ok).toBe(false);
    expect(suscripcionFake.unsubscribe).toHaveBeenCalled();
  });

  it('si vapidPublica LANZA por red, resuelve con error sin llegar a suscribir', async () => {
    // arrange
    mockedVapid.mockRejectedValue(new Error('No se pudo conectar con el servidor'));

    // act
    const r = await activarPush();

    // assert
    expect(r.ok).toBe(false);
    expect(registroFake.pushManager.subscribe).not.toHaveBeenCalled();
    expect(suscripcionFake.unsubscribe).not.toHaveBeenCalled(); // aún no existía
  });

  it('sin señal, el error crudo de red se traduce a un mensaje es-MX', async () => {
    // arrange: el pushManager del navegador lanza "Failed to fetch" crudo
    registroFake.pushManager.subscribe.mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    );

    // act
    const r = await activarPush();

    // assert
    expect(r.ok).toBe(false);
    expect(r.mensaje).toBe('Sin conexión — activa las notificaciones cuando tengas señal.');
  });

  it('el error de red del apiClient (menciona localhost) también se traduce', async () => {
    // arrange
    mockedVapid.mockRejectedValueOnce(
      new Error('No se pudo conectar con el servidor. Verifica que la API esté corriendo en http://localhost:3001/api'),
    );

    // act
    const r = await activarPush();

    // assert
    expect(r.ok).toBe(false);
    expect(r.mensaje).toBe('Sin conexión — activa las notificaciones cuando tengas señal.');
  });

  it('si el server rechaza el alta (success:false), también desuscribe (regresión)', async () => {
    // arrange
    mockedAlta.mockResolvedValue({ success: false, error: { code: 'FORBIDDEN' } });

    // act
    const r = await activarPush();

    // assert
    expect(r.ok).toBe(false);
    expect(suscripcionFake.unsubscribe).toHaveBeenCalled();
  });

  it('con el alta exitosa, NO desuscribe y reporta ok', async () => {
    // arrange
    mockedAlta.mockResolvedValue({ success: true });

    // act
    const r = await activarPush();

    // assert
    expect(r.ok).toBe(true);
    expect(suscripcionFake.unsubscribe).not.toHaveBeenCalled();
  });
});
