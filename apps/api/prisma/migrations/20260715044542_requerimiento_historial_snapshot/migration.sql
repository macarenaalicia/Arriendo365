/*
  Warnings:

  - Added the required column `tipoReparacion` to the `requerimiento_actualizacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urgencia` to the `requerimiento_actualizacion` table without a default value. This is not possible if the table is not empty.

*/
-- Filas de prueba del formato anterior (solo estado+nota); no son datos de
-- clientes reales, se limpian para poder agregar las columnas obligatorias.
TRUNCATE TABLE "requerimiento_actualizacion";

-- AlterTable
ALTER TABLE "requerimiento_actualizacion" ADD COLUMN     "detalleResolucion" TEXT,
ADD COLUMN     "notasArrendatario" TEXT,
ADD COLUMN     "tecnicoId" TEXT,
ADD COLUMN     "tipoReparacion" "TipoReparacion" NOT NULL,
ADD COLUMN     "urgencia" "UrgenciaRequerimiento" NOT NULL;

-- AddForeignKey
ALTER TABLE "requerimiento_actualizacion" ADD CONSTRAINT "requerimiento_actualizacion_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
