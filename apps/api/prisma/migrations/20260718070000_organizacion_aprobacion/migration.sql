-- CreateEnum
CREATE TYPE "EstadoOrganizacion" AS ENUM ('PENDIENTE_APROBACION', 'ACTIVA', 'RECHAZADA');

-- AlterTable: las organizaciones que ya existen deben quedar ACTIVA (no
-- bloquearlas), por eso el default temporal al agregar la columna es ACTIVA;
-- luego se cambia el default a PENDIENTE_APROBACION para que solo las
-- organizaciones nuevas (a partir de ahora) requieran aprobación.
ALTER TABLE "organizacion" ADD COLUMN "estado" "EstadoOrganizacion" NOT NULL DEFAULT 'ACTIVA';
ALTER TABLE "organizacion" ADD COLUMN "vigenteHasta" TIMESTAMP(3);
ALTER TABLE "organizacion" ADD COLUMN "fechaAprobacion" TIMESTAMP(3);
ALTER TABLE "organizacion" ADD COLUMN "metodoPago" TEXT;
ALTER TABLE "organizacion" ADD COLUMN "ultimoPagoFecha" TIMESTAMP(3);
ALTER TABLE "organizacion" ADD COLUMN "ultimoPagoMonto" DECIMAL(10,2);

ALTER TABLE "organizacion" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_APROBACION';
