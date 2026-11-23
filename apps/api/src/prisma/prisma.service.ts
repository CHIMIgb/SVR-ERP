import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Fuera de la clase: PrismaClient ya tiene sus propias propiedades y no conviene agregarle una.
const logger = new Logger('PrismaService');

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:admin123@localhost:5432/svr_erp';

    // Sesión de Postgres SIEMPRE en UTC. No quitar `options` (corrección 2026-11-23).
    // `@prisma/adapter-pg` manda cada Date como la hora UTC sin zona ("2026-11-23 06:04:01") y Postgres
    // la interpreta con el TimeZone de la sesión. Con el servidor en hora de México (-06), todo lo que
    // escribía Prisma quedaba 6 h en el futuro, y lo que pone Postgres (CURRENT_TIMESTAMP de los triggers
    // de actualizado_en, now()) se leía 6 h en el pasado. Con UTC cuadra en cualquier servidor, sin
    // importar su TimeZone. Toda conexión nueva (scripts, seeds) debe llevar la misma opción.
    // No choca con la regla de AGENTS.md ("la zona de la empresa vive solo en .env"): esto no es la zona
    // de la empresa, es el formato en que viajan las fechas entre la API y Postgres. hoyEnZona() y el
    // front siguen usando TZ / TIMEZONE / NEXT_PUBLIC_TZ del .env como siempre.
    // Detalle y corrección de los datos viejos: DECISIONS.md › "Zona horaria de la conexión a Postgres"
    // y la migración 20261123010000_corregir_zona_horaria_utc. Lo cuidan prisma.service.spec.ts y
    // zona-horaria.integration.spec.ts.
    const pool = new Pool({ connectionString, options: '-c timezone=UTC' });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.verificarZonaHoraria();
  }

  // Revisión al arrancar (corrección 2026-11-23, ver el comentario del constructor):
  // - Si la sesión NO quedó en UTC, no arranca. Pasa si DATABASE_URL trae su propio `options=` (gana
  //   sobre el de arriba) o si un pooler (PgBouncer) ignora los parámetros de arranque. Sin esto la API
  //   volvería a guardar fechas 6 h adelantadas sin que nada truene.
  // - Si la BD no tiene la corrección de los datos viejos, solo avisa: las BD de desarrollo y la de CI
  //   pueden no tenerla todavía. En pruebas (NODE_ENV=test) no avisa, para no llenar el log.
  async verificarZonaHoraria(): Promise<void> {
    const [fila] = await this.$queryRaw<{ tz: string; marca: string | null }[]>`
      SELECT current_setting('TimeZone') AS tz,
             obj_description(to_regclass('public._prisma_migrations'), 'pg_class') AS marca`;
    if (fila.tz !== 'UTC') {
      throw new Error(
        `La conexión a Postgres quedó en la zona "${fila.tz}" y debe ser UTC: las fechas se guardarían ` +
          `6 h adelantadas. Revisa que DATABASE_URL no traiga "options=" ni pase por un pooler que ignore ` +
          `los parámetros de arranque. Ver DECISIONS.md › "Zona horaria de la conexión a Postgres".`,
      );
    }
    if (
      process.env.NODE_ENV !== 'test' &&
      !fila.marca?.includes('svr.zona_horaria_corregida')
    ) {
      logger.warn(
        'Esta BD no tiene aplicada la migración 20261123010000_corregir_zona_horaria_utc: las fechas ' +
          'guardadas antes se verán 6 h adelantadas. Cómo aplicarla: encabezado de esa migración.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
