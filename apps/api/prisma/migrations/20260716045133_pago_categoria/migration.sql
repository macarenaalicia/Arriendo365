-- CreateEnum
CREATE TYPE "CategoriaPago" AS ENUM ('ARRIENDO', 'SERVICIOS_BASICOS');

-- AlterTable
ALTER TABLE "pago" ADD COLUMN     "categoria" "CategoriaPago" NOT NULL DEFAULT 'ARRIENDO';
