import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ENTIDAD_TIPOS, type EntidadTipo } from '../../common/entidad/entidad-resolver.service';

export class CreateFotoDto {
  @IsString()
  archivoUrl: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsIn(ENTIDAD_TIPOS)
  entidadTipo: EntidadTipo;

  @IsUUID()
  entidadId: string;
}
