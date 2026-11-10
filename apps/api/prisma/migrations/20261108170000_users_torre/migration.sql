-- Área (torre) asignada a cada empleado/usuario, para "misma área" en /reportes.
-- Nullable: sin asignar → el resolver cae en ADMINISTRATIVO (oficina).
ALTER TABLE "users" ADD COLUMN "torre" "CategoriaReporte";
