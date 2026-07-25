import { API_URL, getToken } from '../api/client';

/** Descarga un archivo protegido (requiere el header Authorization) como si fuera un link normal. */
export async function descargarArchivo(path: string, nombreArchivo: string) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('No se pudo descargar el archivo');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
