import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const base = { email: 'admin@svr-constructora.com', password: 'admin1234' };

  describe('caso válido', () => {
    it('acepta email y contraseña con 8+ caracteres', async () => {
      // arrange
      const dto = plainToInstance(LoginDto, base);

      // act
      const errores = await validate(dto);

      // assert
      expect(errores).toHaveLength(0);
    });

    it('acepta todos los caracteres en la contraseña (espacios, símbolos)', async () => {
      // arrange
      const dto = plainToInstance(LoginDto, { ...base, password: 'frase c0n  espacios ¡y símbolos!' });

      // act
      const errores = await validate(dto);

      // assert
      expect(errores).toHaveLength(0);
    });
  });

  describe('casos inválidos', () => {
    it('rechaza email sin formato válido', async () => {
      // arrange
      const dto = plainToInstance(LoginDto, { ...base, email: 'no-es-correo' });

      // act
      const errores = await validate(dto);

      // assert
      expect(errores).toHaveLength(1);
      expect(errores[0].property).toBe('email');
      expect(errores[0].constraints?.isEmail).toBe('El correo no es válido');
    });

    it('NO exige longitud mínima (política larga = registro/cambio de contraseña)', async () => {
      // arrange
      const dto = plainToInstance(LoginDto, { ...base, password: 'corta12' });

      // act
      const errores = await validate(dto);

      // assert
      expect(errores).toHaveLength(0);
    });

    it('rechaza contraseña mayor a 128 caracteres (protección DoS por hash)', async () => {
      // arrange
      const dto = plainToInstance(LoginDto, { ...base, password: 'a'.repeat(129) });

      // act
      const errores = await validate(dto);

      // assert
      const fallo = errores.find((e) => e.property === 'password');
      expect(fallo).toBeTruthy();
      expect(fallo!.constraints?.maxLength).toBe(
        'La contraseña no puede exceder 128 caracteres',
      );
    });

    it('rechaza contraseña no string', async () => {
      // arrange
      const dto = plainToInstance(LoginDto, { ...base, password: 12 as unknown as string });

      // act
      const errores = await validate(dto);

      // assert
      expect(errores.some((e) => e.property === 'password')).toBe(true);
    });
  });
});
