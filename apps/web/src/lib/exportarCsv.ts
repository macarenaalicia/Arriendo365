/**
 * Genera y descarga un CSV que Excel abre correctamente (BOM UTF-8 +
 * separador ";", ya que en configuración regional es-CL la coma es el
 * separador decimal y Excel usa ";" para delimitar columnas).
 */
export function descargarCsv(
  nombreArchivo: string,
  columnas: string[],
  filas: Array<Array<string | number>>,
) {
  const escapar = (valor: string | number) => {
    const texto = String(valor ?? '');
    if (/[";\n]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const lineas = [columnas, ...filas].map((fila) => fila.map(escapar).join(';'));
  const contenido = '﻿' + lineas.join('\r\n');

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
