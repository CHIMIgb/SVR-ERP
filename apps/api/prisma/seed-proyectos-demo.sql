-- Seed demo: 5 proyectos de ejemplo con ubicación exacta
-- 2026-11-04 — códigos P004..P008, junto a los 3 existentes (P001..P003,
-- ya con dirección por backfill de la migración). Clientes reales de la BD.
INSERT INTO proyectos
  (id, codigo, nombre, cliente_id, presupuesto, progreso, estado,
   ingreso_cobrado, gastado, fecha_inicio, fecha_fin, activo,
   creado_en, actualizado_en, calle, colonia, ciudad, estado_ubicacion, codigo_postal)
VALUES
(gen_random_uuid(), 'P004', 'Urbanización Vista Xalisco', 'f600f831-a44a-4930-9fc0-8e5ec1ee9450', 4200000, 15, 'EN_PROCESO', 0, 630000, DATE '2026-11-02', DATE '2027-06-30', true, now(), now(),
 'Av. Cuauhtémoc 892, Lote 12', 'Fraccionamiento Xalisco', 'Xalisco', 'Nayarit', '63778'),

(gen_random_uuid(), 'P005', 'Nave industrial Parque Tepic', 'cc2f4d26-2ef8-4579-8ca6-6a8e5006daae', 12500000, 5, 'EN_PROCESO', 0, 0, DATE '2026-11-05', DATE '2027-08-20', true, now(), now(),
 'Parque Industrial 220, Lote 8 (Nave C)', 'Ciudad Industrial de Tepic', 'Tepic', 'Nayarit', '63173'),

(gen_random_uuid(), 'P006', 'Planta de agua potable Mezcales', '3a05641a-c5eb-4676-8ec3-720b3e2d7ba1', 8700000, 40, 'EN_PROCESO', 3480000, 3412600, DATE '2026-07-10', DATE '2027-03-31', true, now(), now(),
 'Benito Juárez 45', 'Mezcales', 'Bahía de Banderas', 'Nayarit', '63730'),

(gen_random_uuid(), 'P007', 'Oficinas distribuidora Tokio', 'f600f831-a44a-4930-9fc0-8e5ec1ee9450', 2300000, 0, 'PAUSADO', 0, 405000, DATE '2026-09-01', DATE '2027-01-15', true, now(), now(),
 'Blvd. Avila Camacho 1563, Nave 3', 'Ciudad del Valle', 'Tepic', 'Nayarit', '63157'),

(gen_random_uuid(), 'P008', 'Pavimentación Av. Bahía (etapa II)', 'cf8c9e99-7dac-4337-a50f-82db43546a6a', 5400000, 100, 'FINALIZADO', 5400000, 5250000, DATE '2025-10-01', DATE '2026-09-30', true, now(), now(),
 'Av. Bahía de Banderas, tramos 2-14', 'Mirador de la Bahía', 'San Blas', 'Nayarit', '63740');
