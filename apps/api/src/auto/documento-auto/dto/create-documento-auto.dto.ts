import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { EstadoDocumentoAuto, TipoDocumentoAuto } from '@prisma/client';

export class CreateDocumentoAutoDto {
  @IsEnum(TipoDocumentoAuto)
  tipo: TipoDocumentoAuto;

  @Type(() => Date)
  @IsDate()
  fechaRealizacion: Date;

  @Type(() => Date)
  @IsDate()
  fechaVencimiento: Date;

  @IsOptional()
  @IsEnum(EstadoDocumentoAuto)
  estado?: EstadoDocumentoAuto;
}
