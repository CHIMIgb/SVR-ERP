import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BajaSuscripcionPushDto, SuscripcionPushDto } from './push.dto';

const base = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  llaves: { p256dh: 'llave-p256dh', auth: 'llave-auth' },
};

describe('SuscripcionPushDto', () => {
  it('acepta una suscripción válida', async () => {
    const dto = plainToInstance(SuscripcionPushDto, base);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rechaza endpoint que no es https (el push exige contexto seguro)', async () => {
    const dto = plainToInstance(SuscripcionPushDto, { ...base, endpoint: 'http://inseguro.dev/abc' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rechaza endpoint de IP interna (SSRF — bloqueante 2 PR #23)', async () => {
    const dto = plainToInstance(SuscripcionPushDto, { ...base, endpoint: 'https://192.168.0.10:8080/hook' });
    const errores = await validate(dto);
    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('endpoint');
  });

  it('rechaza lookalike del host de push (evil-fcm.googleapis.com)', async () => {
    const dto = plainToInstance(SuscripcionPushDto, {
      ...base,
      endpoint: 'https://evil-fcm.googleapis.com/fcm/send/abc',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('acepta subdominios legítimos de los servicios push', async () => {
    for (const endpoint of [
      'https://db5.notify.windows.com/token/abc',
      'https://updates.push.services.mozilla.com/wpush/v2/abc',
      'https://api.push.apple.com:443/3/device/abc',
    ]) {
      const dto = plainToInstance(SuscripcionPushDto, { ...base, endpoint });
      expect(await validate(dto)).toHaveLength(0);
    }
  });

  it('rechaza llaves ausentes o incompletas', async () => {
    const dto = plainToInstance(SuscripcionPushDto, { endpoint: base.endpoint });
    expect((await validate(dto)).length).toBeGreaterThan(0);
    const dto2 = plainToInstance(SuscripcionPushDto, {
      ...base,
      llaves: { p256dh: '', auth: 'y' },
    });
    expect((await validate(dto2)).length).toBeGreaterThan(0);
  });
});

describe('BajaSuscripcionPushDto', () => {
  it('acepta un endpoint https', async () => {
    const dto = plainToInstance(BajaSuscripcionPushDto, { endpoint: base.endpoint });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rechaza un endpoint que no es https', async () => {
    const dto = plainToInstance(BajaSuscripcionPushDto, { endpoint: 'ftp://raro/abc' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rechaza un endpoint fuera de la lista blanca de push (IP interna)', async () => {
    const dto = plainToInstance(BajaSuscripcionPushDto, { endpoint: 'https://10.0.0.5/x' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
