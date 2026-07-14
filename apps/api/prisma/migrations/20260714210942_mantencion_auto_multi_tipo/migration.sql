/*
  Warnings:

  - You are about to drop the column `configuracionId` on the `mantencion_auto` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "mantencion_auto" DROP CONSTRAINT "mantencion_auto_configuracionId_fkey";

-- AlterTable
ALTER TABLE "mantencion_auto" DROP COLUMN "configuracionId";

-- CreateTable
CREATE TABLE "mantencion_auto_item" (
    "id" TEXT NOT NULL,
    "mantencionAutoId" TEXT NOT NULL,
    "configuracionId" TEXT NOT NULL,

    CONSTRAINT "mantencion_auto_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mantencion_auto_item" ADD CONSTRAINT "mantencion_auto_item_mantencionAutoId_fkey" FOREIGN KEY ("mantencionAutoId") REFERENCES "mantencion_auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantencion_auto_item" ADD CONSTRAINT "mantencion_auto_item_configuracionId_fkey" FOREIGN KEY ("configuracionId") REFERENCES "configuracion_mantencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
