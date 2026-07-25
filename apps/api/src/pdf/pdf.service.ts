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
  arriendoPropiedad: { propiedad: Propiedad; arrendatario: Persona };
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

  /**
   * Formato "orden de trabajo": pensado para imprimir y llevar a la
   * propiedad, no solo para leer en pantalla. Los campos que normalmente se
   * completan durante la visita (inspección, resolución, gastos) llevan
   * líneas en blanco debajo aunque ya tengan texto, para poder anotar a mano.
   */
  generarRequerimiento(
    requerimiento: RequerimientoDetalle,
    mostrarInspeccion: boolean,
    mostrarGastos: boolean,
  ): Promise<Buffer> {
    return generarPdfBuffer((doc) => {
      const propiedad = requerimiento.arriendoPropiedad.propiedad;
      const arrendatario = requerimiento.arriendoPropiedad.arrendatario;
      const direccion = `${propiedad.calle} ${propiedad.numero}`;
      const pageLeft = doc.page.margins.left;
      const pageRight = doc.page.width - doc.page.margins.right;

      // Caja con Urgencia/Calificación arriba a la derecha.
      const cajaAncho = 160;
      const cajaX = pageRight - cajaAncho;
      const cajaY = doc.page.margins.top;
      const cajaAlto = 40;
      doc.rect(cajaX, cajaY, cajaAncho, cajaAlto).stroke();
      doc
        .moveTo(cajaX, cajaY + cajaAlto / 2)
        .lineTo(cajaX + cajaAncho, cajaY + cajaAlto / 2)
        .stroke();
      doc
        .moveTo(cajaX + 75, cajaY)
        .lineTo(cajaX + 75, cajaY + cajaAlto)
        .stroke();
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Urgencia', cajaX + 5, cajaY + 5, { width: 66 });
      doc.text('Calificación', cajaX + 5, cajaY + cajaAlto / 2 + 5, { width: 66 });
      doc.font('Helvetica');
      doc.text(requerimiento.urgencia, cajaX + 80, cajaY + 5, { width: cajaAncho - 85 });
      doc.text(requerimiento.calificacion.nombre, cajaX + 80, cajaY + cajaAlto / 2 + 5, {
        width: cajaAncho - 85,
      });

      // Título y fecha, a la izquierda de la caja.
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Orden de trabajo — Requerimiento', pageLeft, cajaY, { width: cajaAncho - 20 });
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#555')
        .text(`Generado el ${formatFecha(new Date())}`, pageLeft, doc.y + 2);
      doc.fillColor('black');

      doc.y = Math.max(doc.y, cajaY + cajaAlto) + 18;
      doc.x = pageLeft;

      const campo = (label: string, value: string) => {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(`${label}: `, pageLeft, doc.y, { continued: true });
        doc.font('Helvetica').text(value);
      };

      campo('Propiedad', direccion);
      campo('Arrendatario', arrendatario.nombreCompleto);
      if (arrendatario.telefono) campo('Contacto', arrendatario.telefono);
      campo('Estado', requerimiento.estado.replace(/_/g, ' '));
      campo('Técnico', requerimiento.tecnico?.nombreCompleto ?? 'Sin asignar');
      doc.moveDown();

      const lineaEnBlanco = () => {
        const y = doc.y + 16;
        doc
          .moveTo(pageLeft, y)
          .lineTo(pageRight, y)
          .strokeColor('#bbbbbb')
          .stroke()
          .strokeColor('black');
        doc.y = y + 2;
      };

      const seccion = (titulo: string, texto: string | null, lineasVacias: number) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${titulo}:`, pageLeft, doc.y);
        doc.font('Helvetica').fontSize(11);
        if (texto) doc.text(texto, pageLeft, doc.y + 2, { width: pageRight - pageLeft });
        for (let i = 0; i < lineasVacias; i++) lineaEnBlanco();
        doc.moveDown(0.6);
      };

      seccion('Descripción', requerimiento.notasArrendatario || '—', 0);

      if (mostrarInspeccion) {
        seccion('Inspección', requerimiento.inspeccion, 3);
        seccion('Detalle de resolución', requerimiento.detalleResolucion, 3);
      }

      if (mostrarGastos) {
        seccion('Detalle de gastos', requerimiento.detalleGasto, 4);
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Total gasto: ', pageLeft, doc.y, { continued: true });
        doc
          .font('Helvetica')
          .text(requerimiento.totalGasto !== null ? formatMonto(requerimiento.totalGasto) : '_______________');
        doc.moveDown();
      }

      doc.moveDown(2);
      const firmaY = doc.y;
      doc
        .moveTo(pageLeft, firmaY)
        .lineTo(pageLeft + 200, firmaY)
        .stroke();
      doc
        .moveTo(pageLeft + 280, firmaY)
        .lineTo(pageLeft + 480, firmaY)
        .stroke();
      doc.fontSize(9).font('Helvetica').text('Firma técnico', pageLeft, firmaY + 4);
      doc.text('Fecha', pageLeft + 280, firmaY + 4);
    });
  }
}
