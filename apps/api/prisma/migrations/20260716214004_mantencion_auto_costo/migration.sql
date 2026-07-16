-- AlterTable
ALTER TABLE "mantencion_auto" ADD COLUMN     "aprobado" BOOLEAN,
ADD COLUMN     "costo" DECIMAL(10,2),
ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "medioPago" TEXT,
ADD COLUMN     "motivoRechazo" TEXT;
