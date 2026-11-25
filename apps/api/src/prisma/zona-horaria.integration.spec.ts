/**
 * Integration test: la conexión de Prisma a Postgres trabaja en UTC — BD real, sin mocks, solo lecturas.
 *
 * Por qué existe (corrección 2026-11-23, ver DECISIONS.md › "Zona horaria de la conexión a Postgres"):
 * `@prisma/adapter-pg` manda cada `Date` como la hora UTC SIN zona ("2026-11-23 06:04:01") y Postgres
 * la interpreta con el `TimeZone` de la sesión. Con un servidor en -06 todo lo que escribía Prisma quedaba
 * 6 h en el futuro, y lo que pone Postgres (`CURRENT_TIMESTAMP` de los triggers de `actualizado_en`) se
 * leía 6 h en el pasado. La sesión en UTC lo arregla en cualquier servidor.
 *
 * Ojo: en CI el Postgres ya está en UTC, así que aquí estas pruebas pasan aunque se quite el arreglo.
 * Lo que truena en CI si alguien lo quita es `prisma.service.spec.ts`. Estas sirven en local (Postgres en
 * hora de México), donde sin el arreglo fallan.
 *
 * Run with: npm run test:integration -- --testPathPattern="zona-horaria"
 * Requires: PostgreSQL running with svr_erp database.
 */
import { PrismaService } from './prisma.service';

describe('Zona horaria de la conexión (Real DB)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    // onModuleInit y no solo $connect: así también se prueba la revisión de zona que hace la API al arrancar.
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('la sesión de Postgres está en UTC', async () => {
    const [fila] = await prisma.$queryRaw<{ tz: string }[]>`SELECT current_setting('TimeZone') AS tz`;
    expect(fila.tz).toBe('UTC');
  });

  it('una fecha que manda Prisma se guarda en el mismo instante (no 6 h después)', async () => {
    const enviada = new Date();
    // epoch calculado por Postgres sobre lo que guardó: no pasa por la lectura del adapter,
    // que es la que escondía el desfase.
    const [fila] = await prisma.$queryRaw<{ epoch_ms: number }[]>`
      SELECT (extract(epoch FROM ${enviada}::timestamptz) * 1000)::float8 AS epoch_ms`;
    expect(Math.abs(fila.epoch_ms - enviada.getTime())).toBeLessThan(1000);
  });

  it('la hora que pone Postgres (now(), la de los triggers) se lee igual que la del servidor de la API', async () => {
    const antes = Date.now();
    const [fila] = await prisma.$queryRaw<{ ahora: Date }[]>`SELECT now() AS ahora`;
    const despues = Date.now();
    // Margen de 5 min por si los relojes de la API y de Postgres no están idénticos (BD remota); el bug
    // era de 6 h, así que lo sigue detectando.
    expect(fila.ahora.getTime()).toBeGreaterThan(antes - 300_000);
    expect(fila.ahora.getTime()).toBeLessThan(despues + 300_000);
  });
});
