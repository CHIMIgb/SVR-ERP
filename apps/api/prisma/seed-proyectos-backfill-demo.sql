-- Backfill DEMO para los 3 proyectos existentes (P001–P003)
-- SOLO para entornos de desarrollo/demo. NO correr en producción/servidor:
-- las direcciones reales se capturan desde la UI (edita el proyecto).

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
