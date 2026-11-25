-- =====================================================================================================
-- Corrección ÚNICA de fechas: quedaron 6 h adelantadas (2026-11-23). Solo datos, no cambia el esquema.
-- Detalle completo: DECISIONS.md › "Zona horaria de la conexión a Postgres".
-- =====================================================================================================
--
-- QUÉ PASÓ
--   @prisma/adapter-pg manda cada Date como la hora UTC SIN zona ("2026-11-23 06:04:01") y Postgres la
--   interpretó con el TimeZone de la sesión (hora de México, -06). Todo lo que escribió Prisma quedó 6 h
--   en el futuro. Desde este cambio la API abre la sesión en UTC (src/prisma/prisma.service.ts); esta
--   migración corrige lo que ya estaba guardado.
--
-- CÓMO CORRIGE (todas las columnas timestamptz de las tablas de public, salvo _prisma_migrations)
--   valor_correcto = (valor AT TIME ZONE <zona del servidor>) AT TIME ZONE 'UTC'
--   Es la inversa exacta de lo que hizo Postgres al guardar (usa las reglas de la zona para cada fecha).
--   Si el servidor está en UTC, los datos no tienen desfase: no corrige nada, solo deja la marca.
--
--   Excepción: actualizado_en en las tablas con trigger que lo escribe (hoy update_updated_at_column()).
--   Ese trigger pone CURRENT_TIMESTAMP en cada UPDATE, y ese valor ya está bien. Solo se corrige donde
--   actualizado_en está a menos de 1 min de creado_en (fila nunca editada: los dos los puso Prisma).
--
--   Límite conocido: las filas que insertó SQL con NOW() (seeds dentro de migraciones: roles, permisos,
--   vistas) ya estaban bien y quedan 6 h antes. Solo es su fecha de creación. Las columnas con DEFAULT
--   now() en la BD no tienen este problema: Prisma declara @default(now()) y él mismo manda el valor.
--
-- CÓMO APLICARLA — código y migración van JUNTOS, con la API detenida:
--   1. Respaldo: pg_dump -Fc de la BD.
--   2. Detener la API.
--   3. Aplicar este archivo con la zona POR DEFECTO del servidor (con la que se escribieron los datos):
--        psql -v ON_ERROR_STOP=1 -f migration.sql   (recomendado: muestra los avisos por tabla)
--      o  npx prisma db execute --file ...            (no muestra los avisos: verificar con el paso 4)
--      Sin PGTZ, sin PGOPTIONS y sin `options=-c timezone=...` en la URL. Si la zona viene forzada desde
--      la conexión, la migración FALLA a propósito y no cambia nada.
--   4. Verificar ANTES de registrarla, en una conexión nueva:
--        SELECT obj_description('public._prisma_migrations'::regclass, 'pg_class');
--          → debe incluir "svr.zona_horaria_corregida".
--        SELECT count(*) FROM sessions WHERE actualizado_en < creado_en - interval '1 minute';
--          → 0 (antes de corregir salen cientos: lo puso el trigger con la hora buena y creado_en iba +6 h).
--   5. Registrarla en _prisma_migrations (flujo de siempre: checksum sha256, applied_steps_count 1).
--   6. Levantar la API con el código nuevo. Al arrancar revisa que la sesión esté en UTC (si no, no
--      arranca) y avisa en el log si esta corrección no está aplicada.
--   - Código nuevo sin la migración: lo viejo se ve 6 h adelantado en la app.
--   - Migración con la API vieja corriendo: lo que se escriba en medio vuelve a quedar adelantado. Lo mismo
--     si otra rama SIN este cambio escribe en una BD ya corregida (BD local compartida entre ramas).
--   - Requiere ser dueño de las tablas (ALTER TABLE / COMMENT): con el usuario postgres no hay problema.
--     Si falta el permiso, falla completa y no cambia nada.
--
-- SEGURIDAD
--   - Todo es un solo bloque DO = una transacción: si algo falla, no cambia ni una fila y los triggers
--     quedan como estaban.
--   - Se apagan los triggers de UPDATE de public SOLO dentro de esta transacción (hoy: los 56 de
--     actualizado_en y el de auditoría inmutable de UPDATE; el de DELETE no se toca) y se prenden de nuevo
--     en su modo original. Sin eso, el trigger le pondría la hora de hoy a cada fila corregida, y
--     registro_auditoria no dejaría corregirse. ALTER TABLE bloquea esas tablas hasta el final: nadie más
--     escribe mientras están apagados.
--   - No corre dos veces (correrla dos veces restaría 12 h):
--       a) un candado (pg_advisory_xact_lock) para que dos corridas simultáneas no se encimen;
--       b) ya registrada como terminada en _prisma_migrations;
--       c) la marca "svr.zona_horaria_corregida" en el comentario de la tabla _prisma_migrations. Viaja con
--          los respaldos (pg_dump / pg_restore) junto con los datos que corrigió, y una segunda corrida la
--          ve aunque sea en la misma sesión.
--   - No inserta fila en registro_auditoria (no existe una acción para esto y agregarla cambia el
--     esquema). La constancia queda en la marca, en _prisma_migrations y en el historial del PR.
-- =====================================================================================================

DO $$
DECLARE
  nombre_mig  constant text := '20261123010000_corregir_zona_horaria_utc';
  zona        text := current_setting('TimeZone');
  origen      text := (SELECT source FROM pg_settings WHERE name = 'TimeZone');
  comentario  text;
  r           record;
  tg          record;
  col         text;
  expr        text;
  sets        text;
  filtro      text;
  filas       bigint;
  total       bigint := 0;
  prender     text[] := '{}';
  apagados    text[] := '{}';
  stmt        text;
BEGIN
  -- ── Candados ──
  -- a) Una corrida a la vez: la segunda espera aquí y, al entrar, ve la marca de la primera.
  PERFORM pg_advisory_xact_lock(hashtext('svr:' || nombre_mig));

  IF to_regclass('public._prisma_migrations') IS NULL THEN
    RAISE EXCEPTION 'No existe public._prisma_migrations: esta migración espera una BD de SVR-ERP con su historial de migraciones.';
  END IF;

  -- b) Ya registrada.
  IF EXISTS (SELECT 1 FROM public._prisma_migrations
             WHERE migration_name = nombre_mig AND finished_at IS NOT NULL) THEN
    RAISE NOTICE 'Ya estaba aplicada (registrada en _prisma_migrations): no se repite.';
    RETURN;
  END IF;

  -- c) Ya corregida (aunque no se haya registrado todavía). Se lee del catálogo: ve lo ya confirmado.
  comentario := obj_description('public._prisma_migrations'::regclass, 'pg_class');
  IF coalesce(comentario, '') LIKE '%svr.zona_horaria_corregida%' THEN
    RAISE NOTICE 'Ya estaba aplicada (marca en el comentario de _prisma_migrations: %). Solo falta registrarla.', comentario;
    RETURN;
  END IF;

  -- ── La zona tiene que ser la del servidor, no una forzada desde la conexión ──
  -- origen 'client' = PGTZ, PGOPTIONS u options= en la URL; 'session' = SET TIME ZONE. Con esas, la
  -- corrección usaría una zona distinta a la que usó la app al escribir.
  IF origen IN ('client', 'session') THEN
    RAISE EXCEPTION 'La zona de esta conexión (%) viene forzada desde la conexión (origen: %), no del servidor. Corre esta migración sin PGTZ, sin PGOPTIONS y sin options=-c timezone=... en la URL.', zona, origen;
  END IF;

  -- ── Servidor en UTC: no hay desfase (se revisa invierno y verano, por si la zona tiene horario de verano) ──
  IF (timestamp '2026-01-15 12:00' AT TIME ZONE zona) = (timestamp '2026-01-15 12:00' AT TIME ZONE 'UTC')
     AND (timestamp '2026-07-15 12:00' AT TIME ZONE zona) = (timestamp '2026-07-15 12:00' AT TIME ZONE 'UTC') THEN
    EXECUTE format('COMMENT ON TABLE public._prisma_migrations IS %L',
      concat_ws(E'\n', nullif(comentario, ''),
        'svr.zona_horaria_corregida: ' || to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI')
        || ' UTC, sin cambios (el servidor está en ' || zona || ')'));
    RAISE NOTICE 'La zona del servidor (%) es UTC: los datos no tienen desfase. No se corrigió nada; quedó la marca.', zona;
    RETURN;
  END IF;

  -- ── Apagar los triggers de UPDATE de public (solo dentro de esta transacción) ──
  -- tgtype & 16 = el trigger dispara en UPDATE. Los que ya estaban apagados ('D') no se tocan.
  FOR tg IN
    SELECT t.tgrelid::regclass AS tabla, t.tgname, t.tgenabled
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relnamespace = 'public'::regnamespace
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
      AND (t.tgtype & 16) <> 0
  LOOP
    EXECUTE format('ALTER TABLE %s DISABLE TRIGGER %I', tg.tabla, tg.tgname);
    -- Prenderlo después en su modo original: 'O' normal, 'R' replica, 'A' always.
    prender := prender || format('ALTER TABLE %s ENABLE %sTRIGGER %I', tg.tabla,
                 CASE tg.tgenabled WHEN 'R' THEN 'REPLICA ' WHEN 'A' THEN 'ALWAYS ' ELSE '' END, tg.tgname);
    apagados := apagados || (tg.tabla::text || '.' || tg.tgname);
  END LOOP;

  -- ── Corregir: un UPDATE por tabla con todas sus columnas timestamptz ──
  -- pg_catalog en vez de information_schema: information_schema esconde las tablas sin permiso y se
  -- saltarían en silencio; así, si falta permiso, el UPDATE falla y no cambia nada.
  -- Un solo UPDATE por tabla para que la condición de actualizado_en compare contra el creado_en ORIGINAL.
  -- relkind 'r' + UPDATE ONLY: cada tabla física se corrige una sola vez (aunque hubiera herencia).
  FOR r IN
    SELECT c.relname AS tabla,
           array_agg(a.attname::text ORDER BY a.attname) AS columnas,
           bool_or(a.attname = 'creado_en') AS tiene_creado,
           EXISTS (
             SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
             WHERE t.tgrelid = c.oid AND NOT t.tgisinternal AND (t.tgtype & 16) <> 0
               AND p.prosrc ILIKE '%actualizado_en%'
           ) AS con_trigger
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind = 'r'
      AND c.relname <> '_prisma_migrations'
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND a.atttypid = 'timestamptz'::regtype
      AND a.attgenerated = ''
    GROUP BY c.oid, c.relname
    ORDER BY c.relname
  LOOP
    sets := '';
    filtro := '';
    FOREACH col IN ARRAY r.columnas LOOP
      IF col = 'actualizado_en' AND r.con_trigger THEN
        IF NOT r.tiene_creado THEN
          RAISE WARNING '%.actualizado_en NO se corrigió: tiene trigger que lo escribe pero la tabla no tiene creado_en para distinguir quién lo puso.', r.tabla;
          CONTINUE;
        END IF;
        expr := format(
          'CASE WHEN abs(extract(epoch FROM (actualizado_en - creado_en))) < 60 '
          'THEN (actualizado_en AT TIME ZONE %1$L) AT TIME ZONE ''UTC'' ELSE actualizado_en END', zona);
      ELSE
        expr := format('(%1$I AT TIME ZONE %2$L) AT TIME ZONE ''UTC''', col, zona);
      END IF;
      sets   := sets   || CASE WHEN sets   = '' THEN '' ELSE ', '   END || format('%I = %s', col, expr);
      filtro := filtro || CASE WHEN filtro = '' THEN '' ELSE ' OR ' END || format('%I IS NOT NULL', col);
    END LOOP;
    CONTINUE WHEN sets = ''; -- su única columna era la que se avisó arriba

    EXECUTE format('UPDATE ONLY public.%I SET %s WHERE %s', r.tabla, sets, filtro);
    GET DIAGNOSTICS filas = ROW_COUNT;
    total := total + filas;
    IF filas > 0 THEN
      RAISE NOTICE '%: % fila(s)', r.tabla, filas;
    END IF;
  END LOOP;

  -- ── Prender de nuevo los triggers y dejar la marca ──
  FOREACH stmt IN ARRAY prender LOOP
    EXECUTE stmt;
  END LOOP;
  EXECUTE format('COMMENT ON TABLE public._prisma_migrations IS %L',
    concat_ws(E'\n', nullif(comentario, ''),
      'svr.zona_horaria_corregida: ' || to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI')
      || ' UTC, desde la zona ' || zona || ', ' || total || ' fila(s)'));

  IF total = 0 THEN
    RAISE WARNING 'No había filas que corregir (¿BD vacía?). Quedó la marca de todos modos.';
  END IF;
  RAISE NOTICE 'Listo: % fila(s) corregidas desde la zona %. Triggers apagados y prendidos de nuevo (%): %',
               total, zona, coalesce(array_length(apagados, 1), 0), array_to_string(apagados, ', ');
END $$;
