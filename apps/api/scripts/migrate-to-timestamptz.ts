import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:admin123@localhost:5432/svr_erp';

  // HISTÓRICO: ya corrió y ya no quedan columnas timestamp sin zona; no volver a correrlo. Su
  // `AT TIME ZONE 'America/Mexico_City'` leyó como hora de México valores que Prisma había guardado en UTC
  // (parte del desfase de 6 h que corrige la migración 20261123010000_corregir_zona_horaria_utc).
  // Sesión en UTC como toda conexión (ver src/prisma/prisma.service.ts).
  const pool = new Pool({ connectionString, options: '-c timezone=UTC' });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Buscar todas las columnas timestamp without time zone
    const columns = (await prisma.$queryRawUnsafe(
      `
      SELECT
        table_schema,
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type = 'timestamp without time zone'
      ORDER BY table_name, column_name;
      `,
    )) as Array<{
      table_schema: string;
      table_name: string;
      column_name: string;
      data_type: string;
    }>;

    console.log(`Columnas timestamp without time zone encontradas: ${columns.length}\n`);

    if (columns.length === 0) {
      console.log('No hay columnas para migrar.');
      return;
    }

    // Generar ALTER statements
    const alterStatements = columns.map(
      (col) =>
        `ALTER TABLE "${col.table_name}" ALTER COLUMN "${col.column_name}" TYPE timestamptz USING "${col.column_name}" AT TIME ZONE 'America/Mexico_City';`,
    );

    console.log('-- SQL de migración generado:\n');
    console.log(alterStatements.join('\n'));

    // Aplicar migración
    console.log('\n-- Aplicando migración...\n');
    for (const sql of alterStatements) {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✓ ${sql}`);
    }

    console.log('\nMigración completada.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
