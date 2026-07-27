-- AlterTable
ALTER TABLE "arriendo_auto" ADD COLUMN     "pagaEnEfectivo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "arriendo_propiedad" ADD COLUMN     "pagaEnEfectivo" BOOLEAN NOT NULL DEFAULT false;
