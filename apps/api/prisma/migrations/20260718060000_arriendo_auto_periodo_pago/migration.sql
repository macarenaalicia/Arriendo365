-- CreateEnum
CREATE TYPE "PeriodoPagoAuto" AS ENUM ('SEMANAL', 'DOS_SEMANAS', 'MENSUAL');

-- AlterTable: reemplaza fechaPago (día del mes) por periodoPago (frecuencia).
ALTER TABLE "arriendo_auto" ADD COLUMN "periodoPago" "PeriodoPagoAuto" NOT NULL DEFAULT 'MENSUAL';

ALTER TABLE "arriendo_auto" DROP COLUMN "fechaPago";
