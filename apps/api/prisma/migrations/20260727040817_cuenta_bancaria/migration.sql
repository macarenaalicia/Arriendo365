-- CreateEnum
CREATE TYPE "TipoCuentaBancaria" AS ENUM ('CORRIENTE', 'VISTA', 'AHORRO');

-- AlterTable
ALTER TABLE "arriendo_auto" ADD COLUMN     "cuentaBancariaId" TEXT;

-- AlterTable
ALTER TABLE "arriendo_propiedad" ADD COLUMN     "cuentaBancariaId" TEXT;

-- CreateTable
CREATE TABLE "cuenta_bancaria" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "tipoCuenta" "TipoCuentaBancaria" NOT NULL,
    "numero" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuenta_bancaria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cuenta_bancaria" ADD CONSTRAINT "cuenta_bancaria_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_propiedad" ADD CONSTRAINT "arriendo_propiedad_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuenta_bancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_auto" ADD CONSTRAINT "arriendo_auto_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuenta_bancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
