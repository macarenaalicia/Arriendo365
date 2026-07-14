import { IsIn, IsUUID } from 'class-validator';
import { ENTIDAD_TIPOS, type EntidadTipo } from '../../common/entidad/entidad-resolver.service';

export class FindDocumentosDto {
  @IsIn(ENTIDAD_TIPOS)
  entidadTipo: EntidadTipo;

  @IsUUID()
  entidadId: string;
}
