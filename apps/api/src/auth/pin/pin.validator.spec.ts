import {
  normalizarPin,
  validarPinNuevo,
  generarPinTemporal,
} from './pin.validator';
import * as bcrypt from 'bcryptjs';

describe('validarPinNuevo (reglas §8.3)', () => {
  const NUM = 'TRA-0142';

  it('acepta un PIN válido (8 alfanuméricos, letra+numero, sin repeticiones/secuencias)', async () => {
    const r = await validarPinNuevo('HV4K5R7M', NUM, []);
    expect(r.valido).toBe(true);
    expect(r.errorCode).toBeNull();
  });

  it('normaliza a mayúsculas: hv4k5r7m es equivalente', async () => {
    const r = await validarPinNuevo('hv4k5r7m', NUM, []);
    expect(r.valido).toBe(true);
  });

  it('rechaza longitud incorrecta (PIN_FORMATO)', async () => {
    expect((await validarPinNuevo('HV4K5R7', NUM, [])).errorCode).toBe('PIN_FORMATO');
    expect((await validarPinNuevo('HV4K5R7MM', NUM, [])).errorCode).toBe('PIN_FORMATO');
    expect((await validarPinNuevo('HV4K5R7M!', NUM, [])).errorCode).toBe('PIN_FORMATO');
  });

  it('rechaza sin letra o sin número (PIN_DEBIL)', async () => {
    expect((await validarPinNuevo('ABCDEFGH', NUM, [])).errorCode).toBe('PIN_DEBIL');
    expect((await validarPinNuevo('12345678', NUM, [])).errorCode).toBe('PIN_DEBIL');
  });

  it('rechaza 3+ repetidos (PIN_SECUENCIA)', async () => {
    expect((await validarPinNuevo('HV4AAAK9', NUM, [])).errorCode).toBe('PIN_SECUENCIA');
    expect((await validarPinNuevo('HV7777R7', NUM, [])).errorCode).toBe('PIN_SECUENCIA');
  });

  it('rechaza secuencias asc/desc de 3+ (PIN_SECUENCIA)', async () => {
    expect((await validarPinNuevo('HV4ABC7M', NUM, [])).errorCode).toBe('PIN_SECUENCIA');
    expect((await validarPinNuevo('HV4123KM', NUM, [])).errorCode).toBe('PIN_SECUENCIA');
    expect((await validarPinNuevo('HV4CBA7M', NUM, [])).errorCode).toBe('PIN_SECUENCIA');
    expect((await validarPinNuevo('HV49877M', NUM, [])).errorCode).toBe('PIN_SECUENCIA');
  });

  it('rechaza si contiene el número de empleado (PIN_CONTIENE_EMPLEADO)', async () => {
    expect((await validarPinNuevo('TRA0142Z', NUM, [])).errorCode).toBe('PIN_CONTIENE_EMPLEADO');
  });

  it('rechaza si es igual a alguno de los últimos 3 (PIN_REPETIDO)', async () => {
    const hashAnterior = await bcrypt.hash('HV4K5R7M', 4);
    const r = await validarPinNuevo('HV4K5R7M', NUM, [
      await bcrypt.hash('X9X9X9X9', 4),
      hashAnterior,
    ]);
    expect(r.errorCode).toBe('PIN_REPETIDO');
  });

  it('permite un PIN distinto a los últimos 3', async () => {
    const hashAnterior = await bcrypt.hash('HV4K5R7M', 4);
    const r = await validarPinNuevo('PQ7W2N9K', NUM, [
      await bcrypt.hash('HV4K5R7M', 4),
    ]);
    expect(r.valido).toBe(true);
  });
});

describe('generarPinTemporal', () => {
  it('8 caracteres sin confusos (0/O,1/l/I), con letra y número, sin repeticiones de 3', () => {
    for (let i = 0; i < 50; i++) {
      const pin = generarPinTemporal();
      expect(pin).toHaveLength(8);
      expect(pin).not.toMatch(/[0O1lI]/);
      expect(pin).toMatch(/[A-Z]/);
      expect(pin).toMatch(/[0-9]/);
      expect(pin).not.toMatch(/(.)\1{2,}/);
    }
  });

  it('normalizarPin hace trim+uppercase', () => {
    expect(normalizarPin('  hv4k5r7m ')).toBe('HV4K5R7M');
  });
});
