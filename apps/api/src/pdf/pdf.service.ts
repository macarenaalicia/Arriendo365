import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ArriendoPropiedad, Persona, Propiedad, Requerimiento, CalificacionRequerimiento } from '@prisma/client';

function formatMonto(valor: unknown): string {
  const numero = Number(valor ?? 0);
  return `$${numero.toLocaleString('es-CL')}`;
}

function formatFecha(fecha: Date | null | undefined): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CL');
}

function generarPdfBuffer(construir: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    construir(doc);
    doc.end();
  });
}

type ArriendoPropiedadDetalle = ArriendoPropiedad & {
  propiedad: Propiedad;
  arrendatario: Persona;
  codeudor: Persona | null;
};

type RequerimientoDetalle = Requerimiento & {
  arriendoPropiedad: { propiedad: Propiedad };
  tecnico: Persona | null;
  calificacion: CalificacionRequerimiento;
};

@Injectable()
export class PdfService {
  generarContratoArriendoPropiedad(arriendo: ArriendoPropiedadDetalle, nombreOrganizacion: string): Promise<Buffer> {
    return generarPdfBuffer((doc) => {
      const direccion = `${arriendo.propiedad.calle} ${arriendo.propiedad.numero}${
        arriendo.propiedad.numeroDepartamento ? ` depto. ${arriendo.propiedad.numeroDepartamento}` : ''
      }, ${arriendo.propiedad.ciudad}, ${arriendo.propiedad.region}`;

      doc.fontSize(18).text('Contrato de arriendo', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#555').text(`Generado el ${formatFecha(new Date())}`, { align: 'center' });
      doc.fillColor('black');
      doc.moveDown(2);

      doc.fontSize(13).text('Partes');
      doc.fontSize(11);
      doc.text(`Arrendador: ${nombreOrganizacion}`);
      doc.text(`Arrendatario: ${arriendo.arrendatario.nombreCompleto}${arriendo.arrendatario.rut ? ` (RUT ${arriendo.arrendatario.rut})` : ''}`);
      if (arriendo.codeudor) {
        doc.text(`Codeudor: ${arriendo.codeudor.nombreCompleto}${arriendo.codeudor.rut ? ` (RUT ${arriendo.codeudor.rut})` : ''}`);
      }
      doc.moveDown();

      doc.fontSize(13).text('Inmueble arrendado');
      doc.fontSize(11).text(direccion);
      if (arriendo.propiedad.fojasInscripcion || arriendo.propiedad.numeroInscripcion || arriendo.propiedad.anioInscripcion) {
        doc.text(
          `Inscripción: Fojas ${arriendo.propiedad.fojasInscripcion ?? '—'}, N° ${arriendo.propiedad.numeroInscripcion ?? '—'}, año ${arriendo.propiedad.anioInscripcion ?? '—'}`,
        );
      }
      doc.moveDown();

      doc.fontSize(13).text('Condiciones');
      doc.fontSize(11);
      doc.text(`Monto de arriendo: ${formatMonto(arriendo.montoArriendo)} mensual`);
      doc.text(`Día de pago: ${arriendo.fechaPago} de cada mes`);
      doc.text(`Fecha de entrega: ${formatFecha(arriendo.fechaEntrega)}`);
      doc.text(`Período de reajuste: ${arriendo.periodoAlza}`);
      if (arriendo.ipcPorcentaje !== null) {
        doc.text(`% IPC pactado por reajuste: ${arriendo.ipcPorcentaje}%`);
      }
      if (arriendo.garantia) {
        doc.moveDown();
        doc.fontSize(13).text('Garantía');
        doc.fontSize(11);
        doc.text(`Monto pactado: ${formatMonto(arriendo.garantiaMontoPactado)}`);
        doc.text(`Monto pagado: ${formatMonto(arriendo.garantiaMontoPagado)}`);
      }

      doc.moveDown(3);
      doc.fontSize(10).fillColor('#555').text(
        'Documento generado automáticamente por Arriendo365 a partir de los datos registrados del arriendo. No reemplaza un contrato firmado ante notario si la legislación vigente lo exige.',
        { align: 'left' },
      );
    });
  }

  generarRequerimiento(requerimiento: RequerimientoDetalle, mostrarGastos: boolean): Promise<Buffer> {
    return generarPdfBuffer((doc) => {
      const propiedad = requerimiento.arriendoPropiedad.propiedad;
      const direccion = `${propiedad.calle} ${propiedad.numero}`;

      doc.fontSize(18).text('Requerimiento', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#555').text(`Generado el ${formatFecha(new Date())}`, { align: 'center' });
      doc.fillColor('black');
      doc.moveDown(2);

      doc.fontSize(11);
      doc.text(`Propiedad: ${direccion}`);
      doc.text(`Urgencia: ${requerimiento.urgencia}`);
      doc.text(`Calificación: ${requerimiento.calificacion.nombre}`);
      doc.text(`Estado: ${requerimiento.estado.replace(/_/g, ' ')}`);
      doc.text(`Técnico asignado: ${requerimiento.tecnico?.nombreCompleto ?? 'Sin asignar'}`);
      doc.moveDown();

      doc.fontSize(13).text('Descripción del arrendatario');
      doc.fontSize(11).text(requerimiento.notasArrendatario || '—');
      doc.moveDown();

      if (requerimiento.detalleResolucion) {
        doc.fontSize(13).text('Detalle de resolución');
        doc.fontSize(11).text(requerimiento.detalleResolucion);
        doc.moveDown();
      }

      if (requerimiento.inspeccion) {
        doc.fontSize(13).text('Inspección');
        doc.fontSize(11).text(requerimiento.inspeccion);
        doc.moveDown();
      }

      if (mostrarGastos && (requerimiento.detalleGasto || requerimiento.totalGasto !== null)) {
        doc.fontSize(13).text('Gasto');
        doc.fontSize(11);
        if (requerimiento.detalleGasto) doc.text(requerimiento.detalleGasto);
        if (requerimiento.totalGasto !== null) doc.text(`Total: ${formatMonto(requerimiento.totalGasto)}`);
      }
    });
  }
}
