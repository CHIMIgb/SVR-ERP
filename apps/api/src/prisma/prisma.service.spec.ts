/**
 * Guarda del arreglo de zona horaria (2026-11-23, ver DECISIONS.md › "Zona horaria de la conexión a Postgres").
 *
 * El Postgres de CI ya está en UTC, así que la prueba de integración `zona-horaria.integration.spec.ts` no
 * detecta en CI que alguien quite la opción. Estas sí: revisan que el Pool se cree con la sesión en UTC y que
 * la API no arranque si la sesión quedó en otra zona.
 */
jest.mock('pg', () => ({ Pool: jest.fn().mockImplementation(() => ({})) }));
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: jest.fn() }));
jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor(_opciones: unknown) {}
  },
}));

import { Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaService } from './prisma.service';

type ServicioSimulado = PrismaService & { $connect: jest.Mock; $queryRaw: jest.Mock };

function servicioCon(fila: { tz: string; marca: string | null }): ServicioSimulado {
  const servicio = new PrismaService() as ServicioSimulado;
  servicio.$connect = jest.fn().mockResolvedValue(undefined);
  servicio.$queryRaw = jest.fn().mockResolvedValue([fila]);
  return servicio;
}

describe('PrismaService', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = nodeEnvOriginal;
    warn.mockRestore();
  });

  it('abre la conexión a Postgres con la sesión en UTC', () => {
    new PrismaService();
    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({ options: '-c timezone=UTC' }),
    );
  });

  it('no arranca si la sesión quedó en otra zona (p. ej. DATABASE_URL con su propio options=)', async () => {
    const servicio = servicioCon({ tz: 'America/Chihuahua', marca: null });
    await expect(servicio.onModuleInit()).rejects.toThrow(/America\/Chihuahua.*debe ser UTC/);
  });

  it('arranca en UTC y avisa si la BD no tiene la corrección de los datos viejos', async () => {
    process.env.NODE_ENV = 'development';
    const servicio = servicioCon({ tz: 'UTC', marca: null });
    await expect(servicio.onModuleInit()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('20261123010000_corregir_zona_horaria_utc'));
  });

  it('arranca en UTC sin avisar si la BD ya tiene la marca de la corrección', async () => {
    process.env.NODE_ENV = 'development';
    const servicio = servicioCon({
      tz: 'UTC',
      marca: 'svr.zona_horaria_corregida: 2026-11-23 06:39 UTC, desde la zona America/Chihuahua',
    });
    await expect(servicio.onModuleInit()).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });
});
