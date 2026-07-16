-- AlterEnum
ALTER TYPE "EstadoRequerimiento" ADD VALUE 'RECHAZADO';

-- AlterTable
ALTER TABLE "requerimiento_actualizacion" ADD COLUMN     "nota" TEXT;
