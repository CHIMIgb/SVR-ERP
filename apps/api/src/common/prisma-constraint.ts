import { Prisma } from '@prisma/client';

/**
 * Extrae el nombre de la restricción violada de un error P2002.
 *
 * Prisma 7 (driver adapters) no expone `meta.target`: la restricción viene en
 * `meta.driverAdapterError.cause.originalMessage` (ej: «facturas_codigo_key»).
 * Devuelve null si el error no es un P2002 de violación de unicidad.
 */
export function constraintP2002(err: unknown): string | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') {
    return null;
  }
  const meta = (err.meta ?? {}) as Record<string, unknown>;
  const causa = (
    meta.driverAdapterError as
      | { cause?: { kind?: string; originalMessage?: string } }
      | undefined
  )?.cause;
  if (causa?.kind !== 'UniqueConstraintViolation') return null;
  return causa.originalMessage?.match(/«([^»]+)»/)?.[1] ?? null;
}