/*
  Warnings:

  - You are about to drop the column `medioPago` on the `mantencion_auto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mantencion_auto" DROP COLUMN "medioPago",
ADD COLUMN     "quienPago" "QuienPago";
