-- Empresa opcional: clientes sin empresa (persona física / alta rápida del POS).
ALTER TABLE "clientes" ALTER COLUMN "empresa" DROP NOT NULL;
