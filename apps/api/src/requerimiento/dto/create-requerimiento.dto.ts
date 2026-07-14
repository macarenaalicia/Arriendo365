import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TipoReparacion, UrgenciaRequerimiento } from '@prisma/client';
import { CreateRequerimientoPresupuestoDto } from './create-requerimiento-presupuesto.dto';

export class CreateRequerimientoDto {
  @IsUUID()
  arriendoPropiedadId: string;

  @IsEnum(UrgenciaRequerimiento)
  urgencia: UrgenciaRequerimiento;

  @IsEnum(TipoReparacion)
  tipoReparacion: TipoReparacion;

  @IsOptional()
  @IsUUID()
  tecnicoId?: string;

  @IsOptional()
  @IsString()
  notasArrendatario?: string;

  @IsOptional()
  @IsString()
  notasInternas?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaComprometida?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequerimientoPresupuestoDto)
  presupuestos?: CreateRequerimientoPresupuestoDto[];
}
