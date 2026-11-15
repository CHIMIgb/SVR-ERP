-- El cliente llama "obra" a lo que el sistema nombra "proyecto": renombra la entrada
-- del sidebar (la etiqueta sale de vistas.nombre en el frontend).
UPDATE "vistas"
SET "nombre" = 'Obras', "actualizado_en" = now()
WHERE "ruta" = '/proyectos';
