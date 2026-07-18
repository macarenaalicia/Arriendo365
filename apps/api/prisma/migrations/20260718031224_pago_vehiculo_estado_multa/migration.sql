-- AlterTable
ALTER TABLE "pago_vehiculo" ADD COLUMN     "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaPagoReal" TIMESTAMP(3);
