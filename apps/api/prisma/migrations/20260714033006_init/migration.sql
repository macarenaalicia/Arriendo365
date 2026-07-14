-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'PROPIETARIO', 'ARRENDATARIO', 'TECNICO');

-- CreateEnum
CREATE TYPE "TipoPropiedad" AS ENUM ('CASA', 'DEPARTAMENTO', 'HABITACION');

-- CreateEnum
CREATE TYPE "EstadoPropiedad" AS ENUM ('DISPONIBLE', 'ARRENDADA', 'EN_MANTENCION');

-- CreateEnum
CREATE TYPE "TipoProveedor" AS ENUM ('AGUA', 'LUZ', 'GAS');

-- CreateEnum
CREATE TYPE "EstadoProveedor" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoArriendo" AS ENUM ('ACTIVO', 'INACTIVO', 'TERMINADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "UrgenciaRequerimiento" AS ENUM ('CRITICA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoRequerimiento" AS ENUM ('PENDIENTE_REVISION', 'REVISION_AGENDADA', 'EN_REVISION', 'RESUELTO');

-- CreateEnum
CREATE TYPE "TipoReparacion" AS ENUM ('ESTRUCTURAL', 'LOCATIVA');

-- CreateEnum
CREATE TYPE "QuienPago" AS ENUM ('PROPIETARIO', 'ARRENDATARIO');

-- CreateEnum
CREATE TYPE "EstadoAuto" AS ENUM ('DISPONIBLE', 'ARRENDADO', 'EN_MANTENCION');

-- CreateEnum
CREATE TYPE "TipoDocumentoAuto" AS ENUM ('PERMISO_CIRCULACION', 'REVISION_TECNICA', 'SOAP');

-- CreateEnum
CREATE TYPE "EstadoDocumentoAuto" AS ENUM ('ACTIVO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "Periodicidad" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "TipoPagoVehiculo" AS ENUM ('SEGURO', 'TAG', 'REVISION_TECNICA', 'PERMISO_CIRCULACION', 'SOAP');

-- CreateEnum
CREATE TYPE "TipoCobroAuto" AS ENUM ('TAG', 'ARRIENDO', 'REPARACION', 'DEVOLUCION');

-- CreateTable
CREATE TABLE "organizacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "plan" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "dicom360DocId" TEXT,
    "carnetFrontalFotoId" TEXT,
    "carnetTraseraFotoId" TEXT,
    "licenciaFrontalFotoId" TEXT,
    "licenciaTraseraFotoId" TEXT,
    "contratoTrabajoDocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_recomendacion" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "numeroContacto" TEXT NOT NULL,

    CONSTRAINT "persona_recomendacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foto" (
    "id" TEXT NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propiedad" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "sector" TEXT,
    "ciudad" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "tipo" "TipoPropiedad" NOT NULL,
    "nHabitaciones" INTEGER NOT NULL,
    "nBanos" INTEGER NOT NULL,
    "bodega" BOOLEAN NOT NULL DEFAULT false,
    "bodegaNumero" TEXT,
    "estacionamiento" BOOLEAN NOT NULL DEFAULT false,
    "estacionamientoNumero" TEXT,
    "mt2Totales" DECIMAL(8,2) NOT NULL,
    "mt2Construidos" DECIMAL(8,2) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoPropiedad" NOT NULL DEFAULT 'DISPONIBLE',
    "pagaContribuciones" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedor" (
    "id" TEXT NOT NULL,
    "propiedadId" TEXT NOT NULL,
    "tipo" "TipoProveedor" NOT NULL,
    "nCliente" TEXT NOT NULL,
    "estado" "EstadoProveedor" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arriendo_propiedad" (
    "id" TEXT NOT NULL,
    "propiedadId" TEXT NOT NULL,
    "arrendatarioId" TEXT NOT NULL,
    "codeudorId" TEXT,
    "fechaPago" INTEGER NOT NULL,
    "fechaEntrega" TIMESTAMP(3) NOT NULL,
    "fechaRecepcion" TIMESTAMP(3),
    "periodoAlza" TEXT NOT NULL,
    "garantia" BOOLEAN NOT NULL DEFAULT false,
    "garantiaMontoPactado" DECIMAL(10,2),
    "garantiaMontoPagado" DECIMAL(10,2),
    "garantiaFechaDevolucion" TIMESTAMP(3),
    "garantiaMontoDevuelto" DECIMAL(10,2),
    "garantiaMotivoRetencion" TEXT,
    "montoArriendo" DECIMAL(10,2) NOT NULL,
    "actaEntregaDetalle" TEXT,
    "actaRecepcionDetalle" TEXT,
    "estado" "EstadoArriendo" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arriendo_propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arriendo_inventario" (
    "id" TEXT NOT NULL,
    "arriendoPropiedadId" TEXT NOT NULL,
    "fotoId" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "arriendo_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" TEXT NOT NULL,
    "arriendoTipo" TEXT NOT NULL,
    "arriendoId" TEXT NOT NULL,
    "periodo" TIMESTAMP(3) NOT NULL,
    "fechaComprometida" TIMESTAMP(3) NOT NULL,
    "fechaPagoReal" TIMESTAMP(3),
    "monto" DECIMAL(10,2) NOT NULL,
    "medioPago" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "comprobanteFotoId" TEXT,
    "aprobado" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requerimiento" (
    "id" TEXT NOT NULL,
    "arriendoPropiedadId" TEXT NOT NULL,
    "urgencia" "UrgenciaRequerimiento" NOT NULL,
    "estado" "EstadoRequerimiento" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "tecnicoId" TEXT,
    "tipoReparacion" "TipoReparacion" NOT NULL,
    "detalleResolucion" TEXT,
    "notasInternas" TEXT,
    "notasArrendatario" TEXT,
    "fechaComprometida" TIMESTAMP(3),
    "fechaSolucion" TIMESTAMP(3),
    "valorPagado" DECIMAL(10,2),
    "quienPago" "QuienPago",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requerimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requerimiento_presupuesto" (
    "id" TEXT NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "fotoId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "requerimiento_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gasto" (
    "id" TEXT NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "fotoBoletaId" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "detalle" TEXT,

    CONSTRAINT "gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "kilometraje" INTEGER NOT NULL,
    "padronDocId" TEXT,
    "estado" "EstadoAuto" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_auto" (
    "id" TEXT NOT NULL,
    "autoId" TEXT NOT NULL,
    "tipo" "TipoDocumentoAuto" NOT NULL,
    "fechaRealizacion" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoDocumentoAuto" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "documento_auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_mantencion" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cadaKm" INTEGER NOT NULL,

    CONSTRAINT "configuracion_mantencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mantencion_auto" (
    "id" TEXT NOT NULL,
    "autoId" TEXT NOT NULL,
    "configuracionId" TEXT NOT NULL,
    "kilometrajeActual" INTEGER NOT NULL,
    "kilometrajeProxima" INTEGER,
    "fechaMantencion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mantencion_auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arriendo_auto" (
    "id" TEXT NOT NULL,
    "autoId" TEXT NOT NULL,
    "arrendatarioId" TEXT NOT NULL,
    "kilometrajeEntrega" INTEGER NOT NULL,
    "kilometrajeRecepcion" INTEGER,
    "contratoDocId" TEXT,
    "estado" "EstadoArriendo" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arriendo_auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_vehiculo" (
    "id" TEXT NOT NULL,
    "autoId" TEXT NOT NULL,
    "tipo" "TipoPagoVehiculo" NOT NULL,
    "periodicidad" "Periodicidad" NOT NULL,
    "conCredito" BOOLEAN NOT NULL DEFAULT false,
    "cuotas" INTEGER,
    "montoCuota" DECIMAL(10,2),
    "monto" DECIMAL(10,2) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "comprobanteFotoId" TEXT,

    CONSTRAINT "pago_vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobro_auto" (
    "id" TEXT NOT NULL,
    "autoId" TEXT NOT NULL,
    "tipo" "TipoCobroAuto" NOT NULL,
    "responsable" "QuienPago" NOT NULL,
    "quienReparo" "QuienPago",
    "valor" DECIMAL(10,2) NOT NULL,
    "detalle" TEXT,

    CONSTRAINT "cobro_auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_mensaje" (
    "id" TEXT NOT NULL,
    "arriendoTipo" TEXT NOT NULL,
    "arriendoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "persona_organizacionId_rut_key" ON "persona"("organizacionId", "rut");

-- CreateIndex
CREATE INDEX "documento_entidadTipo_entidadId_idx" ON "documento"("entidadTipo", "entidadId");

-- CreateIndex
CREATE INDEX "foto_entidadTipo_entidadId_idx" ON "foto"("entidadTipo", "entidadId");

-- CreateIndex
CREATE INDEX "pago_arriendoTipo_arriendoId_idx" ON "pago"("arriendoTipo", "arriendoId");

-- CreateIndex
CREATE UNIQUE INDEX "auto_organizacionId_patente_key" ON "auto"("organizacionId", "patente");

-- CreateIndex
CREATE INDEX "chat_mensaje_arriendoTipo_arriendoId_idx" ON "chat_mensaje"("arriendoTipo", "arriendoId");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_recomendacion" ADD CONSTRAINT "persona_recomendacion_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propiedad" ADD CONSTRAINT "propiedad_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedor" ADD CONSTRAINT "proveedor_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_propiedad" ADD CONSTRAINT "arriendo_propiedad_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_propiedad" ADD CONSTRAINT "arriendo_propiedad_arrendatarioId_fkey" FOREIGN KEY ("arrendatarioId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_propiedad" ADD CONSTRAINT "arriendo_propiedad_codeudorId_fkey" FOREIGN KEY ("codeudorId") REFERENCES "persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_inventario" ADD CONSTRAINT "arriendo_inventario_arriendoPropiedadId_fkey" FOREIGN KEY ("arriendoPropiedadId") REFERENCES "arriendo_propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento" ADD CONSTRAINT "requerimiento_arriendoPropiedadId_fkey" FOREIGN KEY ("arriendoPropiedadId") REFERENCES "arriendo_propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento" ADD CONSTRAINT "requerimiento_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimiento_presupuesto" ADD CONSTRAINT "requerimiento_presupuesto_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gasto" ADD CONSTRAINT "gasto_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto" ADD CONSTRAINT "auto_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_auto" ADD CONSTRAINT "documento_auto_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantencion_auto" ADD CONSTRAINT "mantencion_auto_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantencion_auto" ADD CONSTRAINT "mantencion_auto_configuracionId_fkey" FOREIGN KEY ("configuracionId") REFERENCES "configuracion_mantencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_auto" ADD CONSTRAINT "arriendo_auto_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arriendo_auto" ADD CONSTRAINT "arriendo_auto_arrendatarioId_fkey" FOREIGN KEY ("arrendatarioId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_vehiculo" ADD CONSTRAINT "pago_vehiculo_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobro_auto" ADD CONSTRAINT "cobro_auto_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_mensaje" ADD CONSTRAINT "chat_mensaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
