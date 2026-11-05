# Pruebas de integración: Asistencia y Trabajadores ya limpian las nóminas de sus trabajadores

**Fecha:** 2026-11-05
**Autor:** P4chec0php

## Cambios realizados
- Al terminar, las pruebas de integración de Asistencia y de Trabajadores borran las nóminas de sus
  trabajadores de prueba antes de borrar a los trabajadores. Las percepciones y deducciones se van en
  cascada.

## Bug corregido
- La prueba de Nómina genera la nómina del periodo para **todos** los trabajadores activos. Si corría al
  mismo tiempo que Asistencia o Trabajadores, también la generaba para sus trabajadores de prueba. Al
  limpiar, borrar esos trabajadores tronaba con `nominas_trabajador_id_fkey`: la suite salía en rojo aunque
  sus pruebas pasaran, y los trabajadores "Test" se quedaban en la base local.

## Archivos tocados
- `apps/api/src/asistencia/asistencia.integration.spec.ts`
- `apps/api/src/trabajadores/trabajadores.integration.spec.ts`

## Verificación
- La integración de Asistencia, GPS, Nómina, Trabajadores, Checklists, Combustible y Mantenimiento pasa
  completa en serie (`npm run test:integration -- --runInBand`), y también cada suite por separado.

## Pendientes
- Correr todas las suites en paralelo sobre la misma base deja otras carreras del mismo tipo. Por ejemplo,
  la simulación de GPS registra posiciones de todas las máquinas activas mientras otra suite borra su
  máquina de prueba (`rastreo_gps_maquina_id_fkey`). Propuesta: correr la integración en serie
  (`maxWorkers: 1` en `jest.integration.config.js`). Es más lenta, pero sin falsos rojos.
