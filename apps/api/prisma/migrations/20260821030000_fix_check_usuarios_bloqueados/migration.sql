-- ═══════════════════════════════════════════════════════════════════════
-- FIX: chk_usuarios_bloqueados_intentos bloqueaba TODO login fallido
-- (500 en vez de 401 "Credenciales inválidas").
--
-- El constraint original asumia que una fila en usuarios_bloqueados solo
-- se creaba una vez alcanzados los 5 intentos (nivel de bloqueo ya
-- activo). BloqueoService.registrarIntentoUsuario() en realidad usa esta
-- misma tabla como contador corriente desde el PRIMER intento fallido
-- (intentos_fallidos_consecutivos: 1, 2, 3... con nivel_numero: 0 hasta
-- llegar a 5) — un diseño valido, solo que incompatible con el CHECK que
-- yo mismo agregue antes de que existiera esta implementacion real.
--
-- Encontrado probando el audit service de login/logout: cualquier
-- password incorrecto tiraba PrismaClientKnownRequestError 23514 en vez
-- del 401 esperado.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE "usuarios_bloqueados" DROP CONSTRAINT IF EXISTS "chk_usuarios_bloqueados_intentos";
