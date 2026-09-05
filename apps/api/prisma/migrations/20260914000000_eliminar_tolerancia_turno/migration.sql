-- Elimina la configuración de tolerancia del turno (valor muerto: no se usaba
-- en ninguna regla de negocio del POS ni del corte).
DELETE FROM configuracion_sistema WHERE clave = 'turno_tolerancia_minutos';
