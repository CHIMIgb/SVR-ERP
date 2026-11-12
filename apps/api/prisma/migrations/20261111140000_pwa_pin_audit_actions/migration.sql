-- Acciones de auditoría del ciclo PIN (plan §8.2):
-- PIN_CAMBIADO (cambio propio), PIN_REINICIADO (temporal 24h por mesa de
-- ayuda), CUENTA_DESBLOQUEADA (desbloqueo). Idempotente.
DO $$
DECLARE v text;
BEGIN
  FOREACH v IN ARRAY ARRAY['PIN_CAMBIADO', 'PIN_REINICIADO', 'CUENTA_DESBLOQUEADA'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'AuditAction' AND e.enumlabel = v
    ) THEN
      EXECUTE format('ALTER TYPE "AuditAction" ADD VALUE %L', v);
    END IF;
  END LOOP;
END $$;
