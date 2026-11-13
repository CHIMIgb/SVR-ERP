-- B5.8: destinatarios explícitos (usuario / torre) + revert del acceso a
-- /proveedores de Administrativo (ya no hace falta: el buzón se dirige
-- explícitamente, independiente del menú).
-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN     "audiencia_torre" "CategoriaReporte",
ADD COLUMN     "destinatario_user_id" UUID;

-- CreateIndex
CREATE INDEX "notificaciones_destinatario_user_id_idx" ON "notificaciones"("destinatario_user_id");

-- CreateIndex
CREATE INDEX "notificaciones_audiencia_torre_idx" ON "notificaciones"("audiencia_torre");

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "fk_notificaciones_destinatario" FOREIGN KEY ("destinatario_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Revert de 20261113041000 (solo se usó para el filtro por vista, ya retirado).
DELETE FROM role_vistas
WHERE rol_id = 'e0000000-0000-0000-0000-0000000000a1'
  AND vista_id = (SELECT id FROM vistas WHERE ruta = '/proveedores');
