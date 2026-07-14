import { IsIn, IsString } from 'class-validator';

export const CARPETAS_SUBIDA = ['documentos', 'fotos'] as const;

export class CrearUrlSubidaDto {
  @IsIn(CARPETAS_SUBIDA)
  carpeta: (typeof CARPETAS_SUBIDA)[number];

  @IsString()
  nombreArchivo: string;

  @IsString()
  contentType: string;
}
