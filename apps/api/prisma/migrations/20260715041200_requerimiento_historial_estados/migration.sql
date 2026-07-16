-- CreateTable
CREATE TABLE "requerimiento_actualizacion" (
    "id" TEXT NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "estado" "EstadoRequerimiento" NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requerimiento_actualizacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "requerimiento_actualizacion" ADD CONSTRAINT "requerimiento_actualizacion_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento_actualizacion" ADD CONSTRAINT "requerimiento_actualizacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
