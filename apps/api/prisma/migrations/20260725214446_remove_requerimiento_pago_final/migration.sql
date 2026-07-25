/*
  Warnings:

  - You are about to drop the column `quienPago` on the `requerimiento` table. All the data in the column will be lost.
  - You are about to drop the column `valorPagado` on the `requerimiento` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "administrador_bien" DROP CONSTRAINT "administrador_bien_autoId_fkey";

-- DropForeignKey
ALTER TABLE "administrador_bien" DROP CONSTRAINT "administrador_bien_propiedadId_fkey";

-- DropForeignKey
ALTER TABLE "administrador_bien" DROP CONSTRAINT "administrador_bien_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "requerimiento" DROP CONSTRAINT "requerimiento_calificacionId_fkey";

-- DropForeignKey
ALTER TABLE "requerimiento_actualizacion" DROP CONSTRAINT "requerimiento_actualizacion_calificacionId_fkey";

-- AlterTable
ALTER TABLE "requerimiento" DROP COLUMN "quienPago",
DROP COLUMN "valorPagado";

-- AddForeignKey
ALTER TABLE "requerimiento" ADD CONSTRAINT "requerimiento_calificacionId_fkey" FOREIGN KEY ("calificacionId") REFERENCES "calificacion_requerimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento_actualizacion" ADD CONSTRAINT "requerimiento_actualizacion_calificacionId_fkey" FOREIGN KEY ("calificacionId") REFERENCES "calificacion_requerimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrador_bien" ADD CONSTRAINT "administrador_bien_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrador_bien" ADD CONSTRAINT "administrador_bien_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "propiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrador_bien" ADD CONSTRAINT "administrador_bien_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
