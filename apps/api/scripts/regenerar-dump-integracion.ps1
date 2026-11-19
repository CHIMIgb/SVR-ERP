# Regenera el dump que restaura el workflow de integración.
# Requiere PGPASSWORD en el entorno y pg_dump 18 en el PATH. Nunca guardar la contraseña aquí.
param(
  [string]$Salida = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\svr_erp_export\svr_erp_sin_postgis.sql'))
)

if (-not $env:PGPASSWORD) { throw 'Define PGPASSWORD con la contraseña de postgres antes de regenerar el dump.' }

$tablas = @(
  'registro_auditoria', 'sessions', 'refresh_tokens', 'token_blacklist',
  'intentos_login', 'usuarios_bloqueados', 'notificaciones',
  'notificaciones_lecturas', 'reportes_adjuntos'
)
$exclusiones = $tablas | ForEach-Object { "--exclude-table-data=public.$_" }

& pg_dump -h localhost -U postgres -d svr_erp --no-owner --no-privileges $exclusiones -f $Salida
if ($LASTEXITCODE -ne 0) { throw "pg_dump falló con código $LASTEXITCODE" }

# El repo es público: el dump de integración no debe llevar datos de negocio.
node (Join-Path $PSScriptRoot 'anonimizar-dump.cjs') $Salida
if ($LASTEXITCODE -ne 0) { throw "La anonimización falló con código $LASTEXITCODE" }

$dump = Get-Content $Salida -Raw
foreach ($tabla in $tablas) {
  if ($dump -match "(?m)^COPY public\.$tabla ") { throw "El dump aún contiene datos de $tabla" }
}
if ($dump -match '(?i)create extension.*postgis') { throw 'El dump contiene PostGIS; no es válido para el workflow.' }

Write-Host "Dump regenerado: $Salida ($((Get-Item $Salida).Length) bytes)"
