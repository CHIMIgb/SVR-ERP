-- /proyectos: ubicación exacta (calle, colonia, ciudad, estado, CP)
-- 2026-11-04 — columnasnullable para no romper los proyectos existentes;
-- la UI las vuelve obligatorias al crear/editar.
ALTER TABLE "proyectos" ADD COLUMN "calle" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "colonia" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "ciudad" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "estado_ubicacion" TEXT;
ALTER TABLE "proyectos" ADD COLUMN "codigo_postal" VARCHAR(10);

-- Backfill: direcciones para los 3 proyectos existentes (con perdidas? datos demo)
UPDATE "proyectos" SET
  calle = 'Av. Valle de la Plata 145',
  colonia = 'Valle de Banderas',
  ciudad = 'Bahía de Banderas',
  estado_ubicacion = 'Nayarit',
  codigo_postal = '63716'
WHERE codigo = 'P001';

UPDATE "proyectos" SET
  calle = 'Calle 5 de Mayo 217-B',
  colonia = 'Centro',
  ciudad = 'Tepic',
  estado_ubicacion = 'Nayarit',
  codigo_postal = '63000'
WHERE codigo = 'P002';

UPDATE "proyectos" SET
  calle = 'Carretera Atizapán-Parque Zúa km 2.5, Ex-Hacienda Santa María',
  colonia = 'Santa María del Tule',
  ciudad = 'Atizapán de Zaragoza',
  estado_ubicacion = 'Estado de México',
  codigo_postal = '52920'
WHERE codigo = 'P003';
