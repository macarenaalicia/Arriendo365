import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ENTIDAD_TIPOS, type EntidadTipo } from '../../common/entidad/entidad-resolver.service';

export class CreateDocumentoDto {
  @IsString()
  tipo: string;

  @IsString()
  archivoUrl: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaEmision?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaVencimiento?: Date;

  @IsIn(ENTIDAD_TIPOS)
  entidadTipo: EntidadTipo;

  @IsUUID()
  entidadId: string;
}
