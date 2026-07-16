import { api } from '../api/client';
import type { Documento } from '../api/types';

interface PresignedUpload {
  uploadUrl: string;
  key: string;
  archivoUrl: string;
}

type EntidadConDocumentos =
  | 'propiedad'
  | 'persona'
  | 'auto'
  | 'arriendo_propiedad'
  | 'arriendo_auto'
  | 'requerimiento';

/** Sube un archivo a R2 vía URL prefirmada y registra el Documento asociado a una entidad. */
export async function subirDocumento(
  archivo: File,
  tipo: string,
  entidadTipo: EntidadConDocumentos,
  entidadId: string,
  fechaEmision?: string,
  fechaVencimiento?: string,
): Promise<Documento> {
  const { uploadUrl, archivoUrl } = await api.post<PresignedUpload>('/storage/presigned-upload', {
    carpeta: 'documentos',
    nombreArchivo: archivo.name,
    contentType: archivo.type,
    tamanioBytes: archivo.size,
  });

  const subida = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': archivo.type },
    body: archivo,
  });
  if (!subida.ok) {
    throw new Error('No se pudo subir el documento');
  }

  return api.post<Documento>('/documentos', {
    tipo,
    archivoUrl,
    entidadTipo,
    entidadId,
    fechaEmision: fechaEmision || undefined,
    fechaVencimiento: fechaVencimiento || undefined,
  });
}

export function listarDocumentos(entidadTipo: string, entidadId: string) {
  return api.get<Documento[]>(`/documentos?entidadTipo=${entidadTipo}&entidadId=${entidadId}`);
}

export function eliminarDocumento(id: string) {
  return api.delete(`/documentos/${id}`);
}
