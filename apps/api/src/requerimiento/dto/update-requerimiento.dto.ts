import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import {
  EstadoRequerimiento,
  QuienPago,
  TipoReparacion,
  UrgenciaRequerimiento,
} from '@prisma/client';

export class UpdateRequerimientoDto {
  @IsOptional()
  @IsUUID()
  arriendoPropiedadId?: string;

  @IsOptional()
  @IsEnum(UrgenciaRequerimiento)
  urgencia?: UrgenciaRequerimiento;

  @IsOptional()
  @IsEnum(EstadoRequerimiento)
  estado?: EstadoRequerimiento;

  @IsOptional()
  @IsEnum(TipoReparacion)
  tipoReparacion?: TipoReparacion;

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
  @IsString()
  detalleResolucion?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaComprometida?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaSolucion?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorPagado?: number;

  @IsOptional()
  @IsEnum(QuienPago)
  quienPago?: QuienPago;

  @IsOptional()
  @IsString()
  notaActualizacion?: string;
}
