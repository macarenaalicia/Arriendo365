-- AlterTable
ALTER TABLE "pago_vehiculo" ADD COLUMN     "abonoId" TEXT;

-- AddForeignKey
ALTER TABLE "pago_vehiculo" ADD CONSTRAINT "pago_vehiculo_abonoId_fkey" FOREIGN KEY ("abonoId") REFERENCES "pago_vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
