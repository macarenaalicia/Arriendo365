import { api } from '../api/client';
import type { Foto } from '../api/types';

interface PresignedUpload {
  uploadUrl: string;
  key: string;
  archivoUrl: string;
}

/** Sube un archivo a R2 vía URL prefirmada y registra la Foto asociada a una entidad. */
export async function subirFoto(
  archivo: File,
  entidadTipo: 'propiedad' | 'persona' | 'auto' | 'arriendo_propiedad' | 'arriendo_auto' | 'requerimiento',
  entidadId: string,
  descripcion?: string,
): Promise<Foto> {
  const { uploadUrl, archivoUrl } = await api.post<PresignedUpload>('/storage/presigned-upload', {
    carpeta: 'fotos',
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
    throw new Error('No se pudo subir la foto');
  }

  return api.post<Foto>('/fotos', {
    archivoUrl,
    entidadTipo,
    entidadId,
    descripcion: descripcion || undefined,
  });
}

export function listarFotos(entidadTipo: string, entidadId: string) {
  return api.get<Foto[]>(`/fotos?entidadTipo=${entidadTipo}&entidadId=${entidadId}`);
}

export function eliminarFoto(id: string) {
  return api.delete(`/fotos/${id}`);
}
