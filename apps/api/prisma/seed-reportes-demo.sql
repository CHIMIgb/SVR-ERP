-- Seed demo: 2 reportes por cada tipo posible (8 tipos × 2 = 16 registros)
-- 2026-11-04 — códigos RC006..RC021. Estado/fecha variados; los RESUELTOS llevan
-- responsable asignado; RC018 lleva cliente+proyecto+monto para probar facturar.
INSERT INTO reportes_campo (id, codigo, tipo, usuario, maquina_id, fecha, hora, descripcion, estado, prioridad, activo, creado_en, actualizado_en, obra_texto, asignado_a_id, asignado_en, resuelto_en)
VALUES
(gen_random_uuid(), 'RC006', 'ADMINISTRATIVO', 'Laura M.', NULL, DATE '2026-11-03', '09:15', 'Alta de nuevo cliente: Constructora del Bajío. Documentos en orden.', 'PENDIENTE', 'MEDIA', true, now(), now(), 'Oficina central', NULL, NULL, NULL),
(gen_random_uuid(), 'RC007', 'ADMINISTRATIVO', 'Laura M.', NULL, DATE '2026-11-04', '12:40', 'Cotización pendiente de firma por el cliente Valle de Bravo.', 'PENDIENTE', 'BAJA', true, now(), now(), 'Oficina central', NULL, NULL, NULL),

(gen_random_uuid(), 'RC008', 'MECANICO', 'Ricardo M.', (SELECT id FROM maquinas WHERE codigo='M001' LIMIT 1), DATE '2026-11-03', '07:30', 'Reparación de neumático delantero izquierdo. Balanceo listo.', 'VISTO', 'MEDIA', true, now(), now(), 'Taller mecánico', (SELECT id FROM trabajadores WHERE codigo='T002' LIMIT 1), now(), NULL),
(gen_random_uuid(), 'RC009', 'MECANICO', 'Ricardo M.', (SELECT id FROM maquinas WHERE codigo='M003' LIMIT 1), DATE '2026-11-04', '16:05', 'Cambio de filtros y aceite del motor (servicio preventivo).', 'ATENDIDO', 'BAJA', true, now(), now(), 'Taller mecánico', (SELECT id FROM trabajadores WHERE codigo='T002' LIMIT 1), now(), NULL),

(gen_random_uuid(), 'RC010', 'OPERADOR', 'Pedro S.', (SELECT id FROM maquinas WHERE codigo='M002' LIMIT 1), DATE '2026-11-03', '08:00', 'Reporte matutino: nivel de combustible 90%, sin novedades.', 'PENDIENTE', NULL, true, now(), now(), 'Fraccionamiento Valle Sur', NULL, NULL, NULL),
(gen_random_uuid(), 'RC011', 'OPERADOR', 'Pedro S.', (SELECT id FROM maquinas WHERE codigo='M005' LIMIT 1), DATE '2026-11-04', '17:20', 'Traslado de material del banco de préstamo a la obra terminado.', 'VISTO', 'BAJA', true, now(), now(), 'Fraccionamiento Valle Sur', NULL, NULL, NULL),

(gen_random_uuid(), 'RC012', 'PIPERO', 'Marcos G.', (SELECT id FROM maquinas WHERE codigo='M004' LIMIT 1), DATE '2026-11-03', '10:30', 'Suministro de 350L de diésel en obra. Tanque lleno.', 'PENDIENTE', NULL, true, now(), now(), 'Valle Sur', NULL, NULL, NULL),
(gen_random_uuid(), 'RC013', 'PIPERO', 'Marcos G.', (SELECT id FROM maquinas WHERE codigo='M006' LIMIT 1), DATE '2026-11-04', '08:50', 'Abastecimiento de maquinaria en segundo frente.', 'ATENDIDO', 'BAJA', true, now(), now(), 'Valle Sur', NULL, NULL, NULL),

(gen_random_uuid(), 'RC014', 'CHECADOR', 'Sofía R.', NULL, DATE '2026-11-03', '06:45', 'Checador de asistencia funcionando; 18 trabajadores en sitio.', 'PENDIENTE', NULL, true, now(), now(), 'Fraccionamiento Valle Sur', NULL, NULL, NULL),
(gen_random_uuid(), 'RC015', 'CHECADOR', 'Sofía R.', NULL, DATE '2026-11-04', '06:50', 'Falta justificada por incapacidad: Juan D., 1 día.', 'PENDIENTE', 'BAJA', true, now(), now(), 'Fraccionamiento Valle Sur', NULL, NULL, NULL),

(gen_random_uuid(), 'RC016', 'INCIDENTE', 'Ricardo M.', (SELECT id FROM maquinas WHERE codigo='M007' LIMIT 1), DATE '2026-11-04', '09:05', 'Fuga de agua en radiador. Máquina detenida hasta revisión.', 'EN_REVISION', 'ALTA', true, now(), now(), 'Taller mecánico', (SELECT id FROM trabajadores WHERE codigo='T003' LIMIT 1), now(), NULL),
(gen_random_uuid(), 'RC017', 'INCIDENTE', 'Pedro S.', (SELECT id FROM maquinas WHERE codigo='M008' LIMIT 1), DATE '2026-11-04', '14:35', 'Luminaria trasera sin funcionar, riesgo por trabajo nocturno.', 'PENDIENTE', 'MEDIA', true, now(), now(), 'Fraccionamiento Valle Sur', NULL, NULL, NULL),

(gen_random_uuid(), 'RC018', 'INGENIERO', 'Ing. Alberto Ruiz', NULL, DATE '2026-11-03', '11:00', 'Revisión de resistencia de concreto: muestra de losa de cimiento en rango.', 'RESUELTO', NULL, true, now(), now(), 'Fraccionamiento Valle Sur', (SELECT id FROM trabajadores WHERE codigo='T003' LIMIT 1), now(), now()),
(gen_random_uuid(), 'RC019', 'INGENIERO', 'Ing. Alberto Ruiz', NULL, DATE '2026-11-04', '15:45', 'Supervisión de instalaciones hidrosanitarias: 80% completado.', 'PENDIENTE', 'MEDIA', true, now(), now(), 'Valle Sur', NULL, NULL, NULL),

(gen_random_uuid(), 'RC020', 'TRABAJADOR', 'Juan D.', NULL, DATE '2026-11-03', '13:10', 'Solicitud de herramienta nueva: desarmadores aislados.', 'PENDIENTE', 'BAJA', true, now(), now(), 'Fraccionamiento Valle Sur', NULL, NULL, NULL),
(gen_random_uuid(), 'RC021', 'TRABAJADOR', 'Juan D.', NULL, DATE '2026-11-04', '11:25', 'Limpieza de área de descanso completada conforme a plan.', 'RESUELTO', NULL, true, now(), now(), 'Fraccionamiento Valle Sur', (SELECT id FROM trabajadores WHERE codigo='T002' LIMIT 1), now(), now());

-- RC018 queda facturable (cliente + proyecto + monto para el flujo facturar).
UPDATE reportes_campo
   SET cliente_id   = (SELECT id FROM clientes WHERE activo = true AND eliminado_en IS NULL LIMIT 1),
       proyecto_id  = (SELECT id FROM proyectos LIMIT 1),
       monto_servicio = 8750.00
 WHERE codigo = 'RC018';
