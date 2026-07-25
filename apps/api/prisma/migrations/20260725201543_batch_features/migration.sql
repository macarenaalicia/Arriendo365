-- Perfil de persona (superconjunto de RolUsuario, agrega CODEUDOR)
CREATE TYPE "PerfilPersona" AS ENUM ('ADMINISTRADOR', 'PROPIETARIO', 'ARRENDATARIO', 'TECNICO', 'CODEUDOR');

ALTER TABLE "persona"
  ALTER COLUMN "tipoPersona" TYPE "PerfilPersona" USING ("tipoPersona"::text::"PerfilPersona");

-- Forzar cambio de contraseña (clave inicial "1234" o reseteo por admin)
ALTER TABLE "usuario" ADD COLUMN "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false;

-- Datos de inscripción de dominio en propiedad
ALTER TABLE "propiedad" ADD COLUMN "fojasInscripcion" TEXT;
ALTER TABLE "propiedad" ADD COLUMN "numeroInscripcion" TEXT;
ALTER TABLE "propiedad" ADD COLUMN "anioInscripcion" INTEGER;

-- Reajuste por IPC en arriendo de propiedad
ALTER TABLE "arriendo_propiedad" ADD COLUMN "ipcPorcentaje" DECIMAL(5,2);
ALTER TABLE "arriendo_propiedad" ADD COLUMN "ultimaAlzaFecha" TIMESTAMP(3);

-- Nuevos campos de requerimiento (visibles solo propietario/administrador)
ALTER TABLE "requerimiento" ADD COLUMN "inspeccion" TEXT;
ALTER TABLE "requerimiento" ADD COLUMN "detalleGasto" TEXT;
ALTER TABLE "requerimiento" ADD COLUMN "totalGasto" DECIMAL(10,2);

-- Catálogo "Calificación" reemplaza el enum de texto libre TipoReparacion
CREATE TABLE "calificacion_requerimiento" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  CONSTRAINT "calificacion_requerimiento_pkey" PRIMARY KEY ("id")
);

INSERT INTO "calificacion_requerimiento" ("id", "nombre") VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Estructural'),
  ('c0000000-0000-0000-0000-000000000002', 'Locativa');

ALTER TABLE "requerimiento" ADD COLUMN "calificacionId" TEXT;
UPDATE "requerimiento" SET "calificacionId" = CASE "tipoReparacion"
  WHEN 'ESTRUCTURAL' THEN 'c0000000-0000-0000-0000-000000000001'
  ELSE 'c0000000-0000-0000-0000-000000000002'
END;
ALTER TABLE "requerimiento" ALTER COLUMN "calificacionId" SET NOT NULL;
ALTER TABLE "requerimiento" ADD CONSTRAINT "requerimiento_calificacionId_fkey"
  FOREIGN KEY ("calificacionId") REFERENCES "calificacion_requerimiento"("id");
ALTER TABLE "requerimiento" DROP COLUMN "tipoReparacion";

ALTER TABLE "requerimiento_actualizacion" ADD COLUMN "calificacionId" TEXT;
UPDATE "requerimiento_actualizacion" SET "calificacionId" = CASE "tipoReparacion"
  WHEN 'ESTRUCTURAL' THEN 'c0000000-0000-0000-0000-000000000001'
  ELSE 'c0000000-0000-0000-0000-000000000002'
END;
ALTER TABLE "requerimiento_actualizacion" ALTER COLUMN "calificacionId" SET NOT NULL;
ALTER TABLE "requerimiento_actualizacion" ADD CONSTRAINT "requerimiento_actualizacion_calificacionId_fkey"
  FOREIGN KEY ("calificacionId") REFERENCES "calificacion_requerimiento"("id");
ALTER TABLE "requerimiento_actualizacion" DROP COLUMN "tipoReparacion";

DROP TYPE "TipoReparacion";

-- Administrador acotado a bienes puntuales (propiedad y/o auto)
CREATE TABLE "administrador_bien" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "propiedadId" TEXT,
  "autoId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "administrador_bien_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "administrador_bien" ADD CONSTRAINT "administrador_bien_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE;
ALTER TABLE "administrador_bien" ADD CONSTRAINT "administrador_bien_propiedadId_fkey"
  FOREIGN KEY ("propiedadId") REFERENCES "propiedad"("id") ON DELETE CASCADE;
ALTER TABLE "administrador_bien" ADD CONSTRAINT "administrador_bien_autoId_fkey"
  FOREIGN KEY ("autoId") REFERENCES "auto"("id") ON DELETE CASCADE;
