-- Agrega las condiciones del arriendo de auto (monto, fecha de pago, entrega,
-- reajuste), con el mismo significado que ya tienen en arriendo_propiedad.
-- Se usan valores por defecto solo para completar las filas existentes; se
-- quitan después para que las filas nuevas los exijan explícitamente.

ALTER TABLE "arriendo_auto" ADD COLUMN "fechaPago" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "arriendo_auto" ADD COLUMN "fechaEntrega" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "arriendo_auto" ADD COLUMN "periodoAlza" TEXT NOT NULL DEFAULT 'ANUAL';
ALTER TABLE "arriendo_auto" ADD COLUMN "montoArriendo" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "arriendo_auto" ALTER COLUMN "fechaPago" DROP DEFAULT;
ALTER TABLE "arriendo_auto" ALTER COLUMN "fechaEntrega" DROP DEFAULT;
ALTER TABLE "arriendo_auto" ALTER COLUMN "periodoAlza" DROP DEFAULT;
ALTER TABLE "arriendo_auto" ALTER COLUMN "montoArriendo" DROP DEFAULT;
