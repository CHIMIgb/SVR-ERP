# Historial de cambios — SVR-ERP

Esta carpeta existe para una sola cosa: registrar cada cambio hecho en el repo,
acompañando al commit correspondiente. **Nunca plazo otro contenido.**

## Regla

- Cada cambio terminado genera **un archivo `.md` aqui** (incluido en el mismo commit del cambio).
- El archivo queda **fechado** (fecha + tema) y describe lo que se hizo y lo que es nuevo.
- Commits **en español**. Push y PR **solo cuando el usuario lo ordene**.

## Nomenclatura del archivo

```
YYYY-MM-DD-tema-corto.md        ej: 2026-11-03-restauracion-bd-fase7-recepcion.md
```

(Para varios cambios el mismo día, agrega `-2`, `-3`... al final.)

## Contenido mínimo del `.md`

```markdown
# [Tema del cambio]

**Fecha:** YYYY-MM-DD
**Autor:** [usuario/agent]

## Cambios realizados
- [lo que se modificó y por qué]

## Cosas nuevas
- [archivos/módulos/funciones/agregados nuevos]

## Archivos tocados
- apps/api/src/... (creado / modificado)

## Pruebas / verificación
- [comandos corridos y su resultado]

## Pendientes y riesgos
- [lo que quedó abierto o requiere atención]
```
