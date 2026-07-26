-- AlterEnum
ALTER TYPE "TipoPropiedad" ADD VALUE 'LOFT';

-- AlterTable
ALTER TABLE "propiedad" ADD COLUMN     "propiedadPadreId" TEXT;

-- AddForeignKey
ALTER TABLE "propiedad" ADD CONSTRAINT "propiedad_propiedadPadreId_fkey" FOREIGN KEY ("propiedadPadreId") REFERENCES "propiedad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
