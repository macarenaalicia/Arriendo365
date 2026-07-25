import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { UrgenciaRequerimiento } from '@prisma/client';
import { CreateRequerimientoPresupuestoDto } from './create-requerimiento-presupuesto.dto';

export class CreateRequerimientoDto {
  @IsUUID()
  arriendoPropiedadId: string;

  @IsEnum(UrgenciaRequerimiento)
  urgencia: UrgenciaRequerimiento;

  @IsUUID()
  calificacionId: string;

  @IsOptional()
  @IsUUID()
  tecnicoId?: string;

  @IsOptional()
  @IsString()
  notasArrendatario?: string;

  @IsOptional()
  @IsString()
  notasInternas?: string;

  // Solo propietario/administrador pueden informar estos campos.
  @IsOptional()
  @IsString()
  inspeccion?: string;

  @IsOptional()
  @IsString()
  detalleGasto?: string;

  @IsOptional()
  @IsNumber()
  totalGasto?: number;

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
